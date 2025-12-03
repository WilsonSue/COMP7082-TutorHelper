const request = require("supertest");
const app = require("../app");
const db = require("../database");
const query = require("../query");

// ====================
// Mock AI Clients
// ====================

// Mock HuggingFace Inference client
jest.mock("@huggingface/inference", () => ({
  InferenceClient: jest.fn().mockImplementation(() => ({
    chatCompletion: jest.fn().mockResolvedValue({
      choices: [{ message: { content: "DeepSeek response" } }]
    })
  }))
}));

// Mock Google Gemini client
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({ text: "Gemini response" })
    }
  }))
}));

// Mock OpenAI client
jest.mock("openai", () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "GPT response" } }]
        })
      }
    }
  }))
}));

// Mock query.js functions
jest.mock("../query", () => ({
  startTopic: jest.fn().mockResolvedValue({ model: "DeepSeek", output: "Topic started" }),
  askQuestion: jest.fn().mockResolvedValue({
    model: "DeepSeek",
    initial: "Initial answer",
    factChecks: [{ model: "GPT", check: "FactCheck" }],
    revised: "Revised answer"
  }),
  getHint: jest.fn().mockResolvedValue({ hint: "This is a hint" })
}));

// ====================
// Mock Database Methods
// ====================

jest.mock("../database", () => ({
  createSession: jest.fn().mockReturnValue(1),
  getSessionByTopic: jest.fn().mockReturnValue({ id: 1, topic: "Math" }),
  getSessionById: jest.fn().mockReturnValue({ id: 1, topic: "Math" }),
  insertMessage: jest.fn().mockReturnValue(1)
}));

// ====================
// Test Suite
// ====================

describe("AI Routes", () => {
  describe("POST /api/ask/deepseek", () => {
    it("should return DeepSeek response", async () => {
      const res = await request(app)
        .post("/api/ask/deepseek")
        .send({ prompt: "Hello" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "DeepSeek");
      expect(res.body).toHaveProperty("output", "DeepSeek response");
    });

    it("should return 400 if prompt is missing", async () => {
      const res = await request(app).post("/api/ask/deepseek").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/ask/gpt", () => {
    it("should return GPT response", async () => {
      const res = await request(app)
        .post("/api/ask/gpt")
        .send({ prompt: "Hello" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "GPT-OSS");
      expect(res.body).toHaveProperty("output", "GPT response");
    });
  });

  describe("POST /api/ask/gemini", () => {
    it("should return Gemini response", async () => {
      const res = await request(app)
        .post("/api/ask/gemini")
        .send({ prompt: "Hello" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "Gemini");
      expect(res.body).toHaveProperty("output", "Gemini response");
    });
  });

  describe("POST /api/ask/mistral", () => {
    it("should return Mistral response", async () => {
      const res = await request(app)
        .post("/api/ask/mistral")
        .send({ prompt: "Hello" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "Mistral");
      expect(res.body).toHaveProperty("output", "GPT response"); // Uses same mocked OpenAI
    });
  });

  describe("POST /api/startTopic", () => {
    it("should start a topic and create a session", async () => {
      const res = await request(app)
        .post("/api/startTopic")
        .send({ topic: "Math", model: "deepseek", user_id: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "DeepSeek");
      expect(res.body).toHaveProperty("output", "Topic started");
      expect(db.createSession).toHaveBeenCalledWith(1, "Math");
    });
  });

  describe("POST /api/askQuestion", () => {
    it("should return initial, factChecks, and revised answer", async () => {
      const res = await request(app)
        .post("/api/askQuestion")
        .send({ topic: "Math", question: "2+2?", model: "deepseek", user_id: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("model", "DeepSeek");
      expect(res.body).toHaveProperty("initial", "Initial answer");
      expect(res.body).toHaveProperty("factChecks");
      expect(res.body.factChecks).toEqual([{ model: "GPT", check: "FactCheck" }]);
      expect(res.body).toHaveProperty("revised", "Revised answer");

      // Messages inserted
      expect(db.insertMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe("POST /api/hint", () => {
    it("should return a Socratic hint", async () => {
      const res = await request(app)
        .post("/api/hint")
        .send({ topic: "Math", model: "deepseek", user_id: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("hint", "This is a hint");
      expect(db.insertMessage).toHaveBeenCalled();
    });
  });
});