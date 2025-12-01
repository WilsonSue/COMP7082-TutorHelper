const express = require("express");
const axios = require("axios");
const path = require('path');

const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const cors = require("cors");
const db = require("./database");
require("dotenv").config();

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json()); // parse JSON bodies

app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));
const frontendPath = path.join(__dirname, '../Frontend/build');
app.use(express.static(frontendPath));

// ==========================
// AI Model Routes
// ==========================

app.use("/api", aiRoutes);

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