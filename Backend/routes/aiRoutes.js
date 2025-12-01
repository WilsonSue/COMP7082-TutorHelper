const express = require("express");
const router = express.Router();
const { InferenceClient } = require("@huggingface/inference");
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require("openai");
const { startTopic, askQuestion, getHint } = require("../query");
const { getFactCheckModels } = require("../helpers/factCheck");
const db = require("../database");
require("dotenv").config();

const client = new InferenceClient(process.env.HF_TOKEN);
// Create the Gemini client (reads API key from GEMINI_API_KEY env variable)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const gptClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN
});

// ==========================
// AI Model Routes
// ==========================

// ==========================
// Route 1: DeepSeek
// ==========================
/**
 * @route POST /api/ask/deepseek
 * @summary Ask the DeepSeek AI model a prompt
 * @param {string} prompt.body.required - The prompt text to send
 * @returns {object} 200 - The AI response
 * @returns {string} model - Model name
 * @returns {string} output - Generated text from AI
 * @returns {object} 400 - Missing prompt error
 * @returns {object} 500 - Internal server error
 */
router.post("/ask/deepseek", async (req, res) => {
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
// Route 2: GPT-OSS
// ==========================
/**
 * @route POST /api/ask/gpt
 * @summary Ask the GPT-OSS AI model a prompt
 * @param {string} prompt.body.required - The prompt text to send
 * @returns {object} 200 - The AI response
 * @returns {string} model - Model name
 * @returns {string} output - Generated text from AI
 * @returns {object} 400 - Missing prompt error
 * @returns {object} 500 - Internal server error
 */
router.post("/ask/gpt", async (req, res) => {
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
/**
 * @route POST /api/ask/gemini
 * @summary Ask the Gemini AI model a prompt
 * @param {string} prompt.body.required - The prompt text to send
 * @returns {object} 200 - The AI response
 * @returns {string} model - Model name
 * @returns {string} output - Generated text from AI
 * @returns {object} 400 - Missing prompt error
 * @returns {object} 500 - Internal server error
 */
router.post("/ask/gemini", async (req, res) => {
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
/**
 * @route POST /api/ask/mistral
 * @summary Ask the Mistral AI model a prompt
 * @param {string} prompt.body.required - The prompt text to send
 * @returns {object} 200 - The AI response
 * @returns {string} model - Model name
 * @returns {string} output - Generated text from AI
 * @returns {object} 400 - Missing prompt error
 * @returns {object} 500 - Internal server error
 */
router.post("/ask/mistral", async (req, res) => {
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

// ==========================
// Routes Using query.js AI Functions
// ==========================

/**
 * @route POST /api/startTopic
 * @summary Start a new topic with the AI tutor
 * @param {string} topic.body.required - Topic name
 * @param {string} model.body.required - Main AI model to use (e.g., deepseek, gpt)
 * @param {string} user_id.body.required - Current user ID
 * @returns {object} 200 - Object containing model and initial AI output
 * @returns {string} model - AI model used
 * @returns {string} output - Initial AI explanation for the topic
 * @returns {object} 500 - Error message
 */
router.post('/startTopic', async (req, res) => {
  const { topic, model, user_id } = req.body;
  try {
    const result = await startTopic({ topic, mainModel: model });

    // Create session BEFORE sending response
    const sessionId = db.createSession(user_id, topic);

    res.json(result);
  } catch (err) {
    let error = err.message;

    if (error.includes('topic')) {
      error = 'Error using the given topic. Please re-enter, or use another.';
    }

    res.status(500).json({ error });
  }
});

/**
 * @route POST /api/askQuestion
 * @summary Ask a question to the AI tutor, get initial answer, fact-checked feedback, and revised answer
 * @param {string} topic.body.required - Topic context
 * @param {string} question.body.required - User's question
 * @param {string} model.body.required - Main AI model
 * @param {string} user_id.body.required - Current user ID
 * @returns {object} 200 - Object containing AI responses
 * @returns {string} model - Main AI model used
 * @returns {string} initial - Initial AI answer
 * @returns {Array} factChecks - Array of fact-checking objects { model, check }
 * @returns {string} revised - AI answer revised after feedback
 * @returns {object} 500 - Error message
 */
router.post('/askQuestion', async (req, res) => {
  const { topic, question, model, user_id } = req.body;
  try {
    const factCheckModels = getFactCheckModels(model);
    const result = await askQuestion({
      topic,
      question,
      mainModel: model,
      factCheckModels,
    });

    // Check if session exists, create if not
    let session = db.getSessionByTopic(topic, user_id);
    if (!session) {
      const sessionId = db.createSession(user_id, topic);
      session = db.getSessionById(sessionId);
    }

    // The result has: { model, initial, factChecks, revised }
    // Use 'revised' for the final answer
    const answerText =
      result.revised || result.initial || JSON.stringify(result);

    // Now insert messages
    db.insertMessage(user_id, session.id, question, true);
    db.insertMessage(user_id, session.id, answerText, false);

    res.json(result);
  } catch (err) {
    console.error('Error in /api/askQuestion:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/hint
 * @summary Request a Socratic hint from the AI tutor
 * @param {string} topic.body.required - Topic context
 * @param {string} model.body.required - Main AI model
 * @param {string} user_id.body.required - Current user ID
 * @returns {object} 200 - Object containing AI hint
 * @returns {string} hint - Socratic hint generated by AI
 * @returns {object} 500 - Error message
 */
router.post('/hint', async (req, res) => {
  const { topic, model, user_id } = req.body;
  try {
    const result = await getHint({ topic, mainModel: model });

    // Check if session exists, create if not
    let session = db.getSessionByTopic(topic, user_id);
    if (!session) {
      const sessionId = db.createSession(user_id, topic);
      session = db.getSessionById(sessionId);
    }

    // Extract hint text - adjust based on what getHint returns
    // If it has similar structure, use result.revised or result.hint
    const hintText =
      result.hint ||
      result.revised ||
      result.initial ||
      (typeof result === 'string' ? result : JSON.stringify(result));

    // Insert hint message
    db.insertMessage(user_id, session.id, hintText, false);

    res.json(result);
  } catch (err) {
    console.error('Error in /api/hint:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;