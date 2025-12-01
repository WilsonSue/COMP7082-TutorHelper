const express = require("express");
const axios = require("axios");
const path = require('path');

const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const { InferenceClient } = require("@huggingface/inference");
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require("openai");
// ordered model list
const MODEL_ORDER = ["deepseek", "mistral", "gpt", "gemini"];

const cors = require("cors");
const { startTopic, askQuestion, getHint } = require("./query");
const db = require("./database");
require("dotenv").config();

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json()); // parse JSON bodies

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
// AI Model Routes
// ==========================

app.use("/api", aiRoutes);

// // ==========================
// // Route 1: DeepSeek
// // ==========================
// /**
//  * @route POST /api/ask/deepseek
//  * @summary Ask the DeepSeek AI model a prompt
//  * @param {string} prompt.body.required - The prompt text to send
//  * @returns {object} 200 - The AI response
//  * @returns {string} model - Model name
//  * @returns {string} output - Generated text from AI
//  * @returns {object} 400 - Missing prompt error
//  * @returns {object} 500 - Internal server error
//  */
// app.post("/api/ask/deepseek", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

//     const chatCompletion = await client.chatCompletion({
//       provider: "fireworks-ai",
//       model: "deepseek-ai/DeepSeek-V3.1",
//       messages: [{ role: "user", content: prompt }],
//     });

//     const output = chatCompletion.choices[0].message.content;
//     res.json({ model: "DeepSeek", output });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong." });
//   }
// });

// // ==========================
// // Route 2: GPT-OSS
// // ==========================
// /**
//  * @route POST /api/ask/gpt
//  * @summary Ask the GPT-OSS AI model a prompt
//  * @param {string} prompt.body.required - The prompt text to send
//  * @returns {object} 200 - The AI response
//  * @returns {string} model - Model name
//  * @returns {string} output - Generated text from AI
//  * @returns {object} 400 - Missing prompt error
//  * @returns {object} 500 - Internal server error
//  */
// app.post("/api/ask/gpt", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

//     const chatCompletion = await gptClient.chat.completions.create({
//       model: "openai/gpt-oss-120b:fireworks-ai",
//       messages: [{ role: "user", content: prompt }]
//     });

//     const output = chatCompletion.choices[0].message.content;
//     res.json({ model: "GPT-OSS", output });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong.", details: err.message });
//   }
// });

// // ==========================
// // Route 3: Gemini
// // ==========================
// /**
//  * @route POST /api/ask/gemini
//  * @summary Ask the Gemini AI model a prompt
//  * @param {string} prompt.body.required - The prompt text to send
//  * @returns {object} 200 - The AI response
//  * @returns {string} model - Model name
//  * @returns {string} output - Generated text from AI
//  * @returns {object} 400 - Missing prompt error
//  * @returns {object} 500 - Internal server error
//  */
// app.post("/api/ask/gemini", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt
//     });

//     // The generated text is in response.text
//     const output = response.text;
//     res.json({ model: "Gemini", output });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong.", details: err.message });
//   }
// });

// // ==========================
// // Route 4: Mistral
// // ==========================
// /**
//  * @route POST /api/ask/mistral
//  * @summary Ask the Mistral AI model a prompt
//  * @param {string} prompt.body.required - The prompt text to send
//  * @returns {object} 200 - The AI response
//  * @returns {string} model - Model name
//  * @returns {string} output - Generated text from AI
//  * @returns {object} 400 - Missing prompt error
//  * @returns {object} 500 - Internal server error
//  */
// app.post("/api/ask/mistral", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

//     const chatCompletion = await gptClient.chat.completions.create({
//       model: "dphn/Dolphin-Mistral-24B-Venice-Edition:featherless-ai",
//       messages: [{ role: "user", content: prompt }]
//     });

//     const output = chatCompletion.choices[0].message.content;
//     res.json({ model: "Mistral", output });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Something went wrong.", details: err.message });
//   }
// });

// // ==========================
// // Frontend API Endpoints
// // ==========================


// // ==========================
// // Routes Using query.js AI Functions
// // ==========================

// /**
//  * Get the two neighboring models to use as fact-checkers for a given main model.
//  * Uses a circular ordering of models defined in MODEL_ORDER.
//  *
//  * @param {string} mainModel - The primary AI model being used (e.g., 'deepseek', 'mistral', 'gpt', 'gemini')
//  * @returns {string[]} Array of two model names to use as fact-checkers
//  *
//  * @example
//  * getFactCheckModels('gpt'); // might return ['mistral', 'gemini']
//  * getFactCheckModels('unknown'); // returns default ['mistral', 'gpt']
//  */
// // helper to pick fact checkers around main model
// function getFactCheckModels(mainModel) {
//   const index = MODEL_ORDER.indexOf(mainModel);
//   if (index === -1) return ["mistral", "gpt"]; // default
//   const left = MODEL_ORDER[(index - 1 + MODEL_ORDER.length) % MODEL_ORDER.length];
//   const right = MODEL_ORDER[(index + 1) % MODEL_ORDER.length];
//   return [left, right];
// }

// /**
//  * @route POST /api/startTopic
//  * @summary Start a new topic with the AI tutor
//  * @param {string} topic.body.required - Topic name
//  * @param {string} model.body.required - Main AI model to use (e.g., deepseek, gpt)
//  * @param {string} user_id.body.required - Current user ID
//  * @returns {object} 200 - Object containing model and initial AI output
//  * @returns {string} model - AI model used
//  * @returns {string} output - Initial AI explanation for the topic
//  * @returns {object} 500 - Error message
//  */
// app.post('/api/startTopic', async (req, res) => {
//   const { topic, model, user_id } = req.body;
//   try {
//     const result = await startTopic({ topic, mainModel: model });

//     // Create session BEFORE sending response
//     const sessionId = db.createSession(user_id, topic);

//     res.json(result);
//   } catch (err) {
//     let error = err.message;

//     if (error.includes('topic')) {
//       error = 'Error using the given topic. Please re-enter, or use another.';
//     }

//     res.status(500).json({ error });
//   }
// });

// /**
//  * @route POST /api/askQuestion
//  * @summary Ask a question to the AI tutor, get initial answer, fact-checked feedback, and revised answer
//  * @param {string} topic.body.required - Topic context
//  * @param {string} question.body.required - User's question
//  * @param {string} model.body.required - Main AI model
//  * @param {string} user_id.body.required - Current user ID
//  * @returns {object} 200 - Object containing AI responses
//  * @returns {string} model - Main AI model used
//  * @returns {string} initial - Initial AI answer
//  * @returns {Array} factChecks - Array of fact-checking objects { model, check }
//  * @returns {string} revised - AI answer revised after feedback
//  * @returns {object} 500 - Error message
//  */
// app.post('/api/askQuestion', async (req, res) => {
//   const { topic, question, model, user_id } = req.body;
//   try {
//     const factCheckModels = getFactCheckModels(model);
//     const result = await askQuestion({
//       topic,
//       question,
//       mainModel: model,
//       factCheckModels,
//     });

//     // Check if session exists, create if not
//     let session = db.getSessionByTopic(topic, user_id);
//     if (!session) {
//       const sessionId = db.createSession(user_id, topic);
//       session = db.getSessionById(sessionId);
//     }

//     // The result has: { model, initial, factChecks, revised }
//     // Use 'revised' for the final answer
//     const answerText =
//       result.revised || result.initial || JSON.stringify(result);

//     // Now insert messages
//     db.insertMessage(user_id, session.id, question, true);
//     db.insertMessage(user_id, session.id, answerText, false);

//     res.json(result);
//   } catch (err) {
//     console.error('Error in /api/askQuestion:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * @route POST /api/hint
//  * @summary Request a Socratic hint from the AI tutor
//  * @param {string} topic.body.required - Topic context
//  * @param {string} model.body.required - Main AI model
//  * @param {string} user_id.body.required - Current user ID
//  * @returns {object} 200 - Object containing AI hint
//  * @returns {string} hint - Socratic hint generated by AI
//  * @returns {object} 500 - Error message
//  */
// app.post('/api/hint', async (req, res) => {
//   const { topic, model, user_id } = req.body;
//   try {
//     const result = await getHint({ topic, mainModel: model });

//     // Check if session exists, create if not
//     let session = db.getSessionByTopic(topic, user_id);
//     if (!session) {
//       const sessionId = db.createSession(user_id, topic);
//       session = db.getSessionById(sessionId);
//     }

//     // Extract hint text - adjust based on what getHint returns
//     // If it has similar structure, use result.revised or result.hint
//     const hintText =
//       result.hint ||
//       result.revised ||
//       result.initial ||
//       (typeof result === 'string' ? result : JSON.stringify(result));

//     // Insert hint message
//     db.insertMessage(user_id, session.id, hintText, false);

//     res.json(result);
//   } catch (err) {
//     console.error('Error in /api/hint:', err);
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

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});