const express = require("express");
const axios = require("axios");
const path = require('path');
const { InferenceClient } = require("@huggingface/inference");
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require("openai");
const cors = require("cors");
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
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing 'question'" });

    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "deepseek-ai/DeepSeek-V3.1",
      messages: [{ role: "user", content: question }],
    });

    const answer = chatCompletion.choices[0].message.content;
    res.json({ model: "DeepSeek", answer });
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
    res.json({ model: "Gemini", output: response.text });
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

    const chatCompletion = await openaiClient.chat.completions.create({
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

const { runFullCycle } = require("./query");

app.post("/api/fullcycle", async (req, res) => {
  try {
    const { topic, level, style } = req.body;
    const results = await runFullCycle({ topic, level, style });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});