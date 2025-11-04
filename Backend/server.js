const express = require("express");
const axios = require("axios");
const path = require('path');
const { InferenceClient } = require("@huggingface/inference");
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require("openai");
const cors = require("cors");
const { startTopic, askQuestion, getHint } = require("./query");
const db = require("./database");
require("dotenv").config();

const app = express();
app.use(express.json()); // parse JSON bodies

// app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const client = new InferenceClient(process.env.HF_TOKEN);
// Create the Gemini client (reads API key from GEMINI_API_KEY env variable)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const gptClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN
});

// ==========================
// Route 1: DeepSeek
// ==========================
app.post("/api/ask/deepseek", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "deepseek-ai/DeepSeek-V3.1",
      messages: [{ role: "user", content: prompt }],
    });

    const output = chatCompletion.choices[0].message.content;
    res.json({ model: "DeepSeek", output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// ==========================
// Route 2: LLaMA
// ==========================
// app.post("/api/ask/llama", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

//     const output = await client.textGeneration({
//       provider: "featherless-ai",
//       model: "meta-llama/Llama-3.1-8B",
//       inputs: prompt,
//     });

//     res.json({ model: "LLaMA", output });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong." });
//   }
// });

// ==========================
// Route 2: GPT-OSS (replacing LLaMA)
// ==========================
app.post("/api/ask/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

    const chatCompletion = await gptClient.chat.completions.create({
      model: "openai/gpt-oss-120b:fireworks-ai",
      messages: [{ role: "user", content: prompt }]
    });

    const output = chatCompletion.choices[0].message.content;
    res.json({ model: "GPT-OSS", output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong.", details: err.message });
  }
});

// ==========================
// Route 3: Gemini
// ==========================
app.post("/api/ask/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    // The generated text is in response.text
    const output = response.text;
    res.json({ model: "Gemini", output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong.", details: err.message });
  }
});

// ==========================
// Route 4: Mistral
// ==========================
app.post("/api/ask/mistral", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

    const chatCompletion = await gptClient.chat.completions.create({
      model: "dphn/Dolphin-Mistral-24B-Venice-Edition:featherless-ai",
      messages: [{ role: "user", content: prompt }]
    });

    const output = chatCompletion.choices[0].message.content;
    res.json({ model: "Mistral", output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong.", details: err.message });
  }
});

// ==========================
// Frontend API Endpoints
// ==========================

// ordered model list
const MODEL_ORDER = ["deepseek", "mistral", "gpt", "gemini"];

// helper to pick fact checkers around main model
function getFactCheckModels(mainModel) {
  const index = MODEL_ORDER.indexOf(mainModel);
  if (index === -1) return ["mistral", "gpt"]; // default
  const left = MODEL_ORDER[(index - 1 + MODEL_ORDER.length) % MODEL_ORDER.length];
  const right = MODEL_ORDER[(index + 1) % MODEL_ORDER.length];
  return [left, right];
}

app.post("/api/startTopic", async (req, res) => {
  const { topic, model } = req.body;
  try {
    const result = await startTopic({ topic, mainModel: model });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/askQuestion", async (req, res) => {
  const { topic, question, model } = req.body;
  try {
    const factCheckModels = getFactCheckModels(model);
    const result = await askQuestion({ topic, question, mainModel: model, factCheckModels });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/hint", async (req, res) => {
  const { topic, model } = req.body;
  try {
    const result = await getHint({ topic, mainModel: model });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// app.post("/api/fullcycle", async (req, res) => {
//   try {
//     const { topic, level, style } = req.body;
//     const results = await runFullCycle({ topic, level, style });
//     res.json(results);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await db.insertUser(username, email, password);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: error.includes("email") ? "Email linked to an existing account" : "Username already in use" });
    } else if (error.code === "SQLITE_CONSTRAINT_NOTNULL") {
      blankfields = "";

      if (error.message.includes("email")) blankFields += "email";
      if (error.message.includes("username")) blankFields += ", username";
      if (error.message.includes("password")) blankfields += ", password";

      res.status(400).json({ error: `One or more fields are blank: ${blankFields}` });
    } else {
      res.status(500).json({ error: "Encountered an error while trying to register you. Please try again later" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const passed = db.loginUser(email, password);
    
    if (!passed) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = db.getUserByEmail(email);
    delete user.password;

    return res.status(200).json({ user, message: "Login successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});