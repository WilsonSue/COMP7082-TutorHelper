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

// quick request logger to help debugging route matching
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));
const frontendPath = path.join(__dirname, '../Frontend/build');
app.use(express.static(frontendPath));

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
  const { topic, model, user_id } = req.body;
  try {
    const result = await startTopic({ topic, mainModel: model });
    res.json(result);

    // createSession is the database helper that inserts a session row
    // `createConversation` didn't exist which would throw at runtime
    try {
      db.createSession(user_id, topic);
    } catch (err) {
      console.error('Failed to create session in DB:', err);
    }
  } catch (err) {
    let error = err.message;

    if (error.includes("topic")) {
      error = "Error using the given topic. Please re-enter, or use another."
    }

    res.status(500).json({ error });
  }
});

app.post("/api/askQuestion", async (req, res) => {
  const { topic, question, model, user_id } = req.body;
  try {
    const factCheckModels = getFactCheckModels(model);
    const result = await askQuestion({ topic, question, mainModel: model, factCheckModels });
    
    db.insertMessageByTopic(user_id, topic, question, true);
    db.insertMessageByTopic(user_id, topic, result, false);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/hint", async (req, res) => {
  const { topic, model, user_id } = req.body;
  try {
    const result = await getHint({ topic, mainModel: model });
    
    db.insertMessageByTopic(user_id, topic, result, false);
    
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
    res.status(201).json({ message: "Account successfully created" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: error.message.includes("email") ? "Email linked to an existing account" : "Username already in use" });
    } else if (error.code === "SQLITE_CONSTRAINT_NOTNULL") {
      let blankFields = "";

      if (error.message.includes("email")) blankFields += "email";
      if (error.message.includes("username")) blankFields += ", username";
      if (error.message.includes("password")) blankFields += ", password";

      res.status(400).json({ error: `One or more fields are blank: ${blankFields}` });
    } else {
      res.status(500).json({ error: "Encountered an error while trying to register you. Please try again later" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;
  
  try {
    const passed = db.loginUser(login, password);
    
    if (!passed) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const user = db.getUserByEmail(login);
    delete user.password;

    return res.status(200).json({ user, message: "Login successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/user/:id/preferences", async (req, res) => {
  let { id } = req.params;
  id = Number(id);

  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(id)) return res.status(404).json({ error: "User not found" }); 
  let preferences = db.getPreferencesByUserId(id);

  if (!preferences) {
    preferences = {
      user_id: id,
      visual: false,
      adhd: false,
      due_dates: false,
      onboarding_complete: false
    };
    db.insertPreferences(preferences);
  }

  res.status(200).json(preferences);
});

app.put("/api/user/:id/preferences", (req, res) => {
  let { id } = req.params;
  id = Number(id);

  const {visual, adhd, due_dates, onboarding_complete} = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(id)) return res.status(404).json({ error: "User not found" }); 
  let preferences = db.getPreferencesByUserId(id);

  if (!preferences) {
    preferences = {
      user_id: id,
      visual: visual ?? false,
      adhd: adhd ?? false,
      due_dates: due_dates ?? false,
      onboarding_complete: onboarding_complete ?? false
    };

    try { 
      db.insertPreferences(preferences);
      return res.status(201).json({ "message": "Preferences saved", "preferences" : preferences });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Encountered a server error, please try again later." });
    }
  }

  const toUpdate = {
    ...(visual != null && { visual }),
    ...(adhd != null && { adhd }),
    ...(due_dates != null && { due_dates }),
    ...(onboarding_complete != null && { onboarding_complete })
  };

  const updated = db.updatePreferences(preferences.id, toUpdate);
  delete preferences.id;
  if (updated) {
    return res.status(202).json({ "message": "Preferences saved", "preferences" : preferences });
  } else {
    return res.status(500).json({ error: "Problem with saving preferences, please try again later." });
  }
});

app.get("/api/sessions/:user_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  return res.status(200).json(db.getSessionsByUserId(user_id));
});

app.get("/api/sessions/:user_id/:session_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  let { session_id } = req.params;
  session_id = Number(session_id);
  const session = db.getSessionById(session_id);

  if (!session) return res.status(404).json({error: "Could not find the specified session "});

  const messages = db.getMessagesBySessionId(session_id);

  return res.status(200).json({ topic: session.topic, messages });
});

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await db.insertUser(username, email, password);
    res.status(201).json({ message: "Account successfully created" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: error.message.includes("email") ? "Email linked to an existing account" : "Username already in use" });
    } else if (error.code === "SQLITE_CONSTRAINT_NOTNULL") {
      let blankFields = "";

      if (error.message.includes("email")) blankFields += "email";
      if (error.message.includes("username")) blankFields += ", username";
      if (error.message.includes("password")) blankFields += ", password";

      res.status(400).json({ error: `One or more fields are blank: ${blankFields}` });
    } else {
      res.status(500).json({ error: "Encountered an error while trying to register you. Please try again later" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;
  
  try {
    const passed = db.loginUser(login, password);
    
    if (!passed) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const user = db.getUserByEmail(login);
    delete user.password;

    return res.status(200).json({ user, message: "Login successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/user/:id/preferences", async (req, res) => {
  let { id } = req.params;
  id = Number(id);

  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(id)) return res.status(404).json({ error: "User not found" }); 
  let preferences = db.getPreferencesByUserId(id);

  if (!preferences) {
    preferences = {
      user_id: id,
      visual: false,
      adhd: false,
      due_dates: false,
      onboarding_complete: false
    };
    db.insertPreferences(preferences);
  }

  res.status(200).json(preferences);
});

app.put("/api/user/:id/preferences", (req, res) => {
  let { id } = req.params;
  id = Number(id);

  const {visual, adhd, due_dates, onboarding_complete} = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(id)) return res.status(404).json({ error: "User not found" }); 
  let preferences = db.getPreferencesByUserId(id);

  if (!preferences) {
    preferences = {
      user_id: id,
      visual: visual ?? false,
      adhd: adhd ?? false,
      due_dates: due_dates ?? false,
      onboarding_complete: onboarding_complete ?? false
    };

    try { 
      db.insertPreferences(preferences);
      return res.status(201).json({ "message": "Preferences saved", "preferences" : preferences });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Encountered a server error, please try again later." });
    }
  }

  const toUpdate = {
    ...(visual != null && { visual }),
    ...(adhd != null && { adhd }),
    ...(due_dates != null && { due_dates }),
    ...(onboarding_complete != null && { onboarding_complete })
  };

  const updated = db.updatePreferences(preferences.id, toUpdate);
  delete preferences.id;
  if (updated) {
    return res.status(202).json({ "message": "Preferences saved", "preferences" : preferences });
  } else {
    return res.status(500).json({ error: "Problem with saving preferences, please try again later." });
  }
});

app.get("/api/sessions/:user_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  return res.status(200).json(db.getSessionsByUserId(user_id));
});

app.get("/api/sessions/:user_id/:session_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  let { session_id } = req.params;
  session_id = Number(session_id);
  const session = db.getSessionById(session_id);

  if (!session) return res.status(404).json({error: "Could not find the specified session "});

  const messages = db.getMessagesBySessionId(session_id);

  return res.status(200).json({ topic: session.topic, messages });
});

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Listen on PORT (default to 3000) and avoid unexpected process exit on errors
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Keep the process alive and log errors instead of force-stopping the console
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // do not call process.exit here so the server stays up for debugging
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // do not call process.exit here so the server stays up for debugging
});

// Heartbeat so you can see the server is still alive in terminals/logs
const HEARTBEAT_INTERVAL = 30_000; // 30s
const heartbeat = setInterval(() => {
  console.log(`[heartbeat] Server still running on http://localhost:${PORT} - ${new Date().toISOString()}`);
}, HEARTBEAT_INTERVAL);

// Graceful shutdown logging (this will not forcibly exit unless OS asks us to)
function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Performing graceful shutdown...`);
  clearInterval(heartbeat);
  // close server if needed in future
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));