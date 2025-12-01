const express = require("express");
const router = express.Router();
const db = require("../database");
require("dotenv").config();

/**
 * @route POST /register
 * @group Users - User account management
 * @summary Register a new user account
 * @param {string} username.body.required - Desired username
 * @param {string} email.body.required - User email address
 * @param {string} password.body.required - User password
 * @returns {object} 201 - Successfully created account
 * @returns {string} message - Confirmation message
 * @returns {object} 400 - Missing or invalid fields
 * @returns {object} 500 - Server error
 */
router.post("/register", async (req, res) => {
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

/**
 * @route POST /login
 * @group Users - User authentication
 * @summary Log a user into their account
 * @param {string} login.body.required - Username or email used to log in
 * @param {string} password.body.required - User password
 * @returns {object} 200 - Logged in successfully
 * @returns {object} user - User information (password removed)
 * @returns {string} message - Login confirmation
 * @returns {object} 400 - Invalid credentials
 * @returns {object} 401 - Unauthorized / login failure
 */
router.post("/login", async (req, res) => {
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

/**
 * @route GET /user/{id}/preferences
 * @group Users - User preferences
 * @summary Retrieve a user's preference settings
 * @param {number} id.path.required - User ID
 * @returns {object} 200 - User preferences object
 * @returns {object} 400 - Invalid user ID
 * @returns {object} 404 - User not found
 */
router.get("/user/:id/preferences", async (req, res) => {
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

/**
 * @route PUT /user/{id}/preferences
 * @group Users - User preferences
 * @summary Update a user's preference settings
 * @param {number} id.path.required - User ID
 * @param {boolean} visual.body.optional - Visual learning preference
 * @param {boolean} adhd.body.optional - ADHD support preference
 * @param {boolean} due_dates.body.optional - Due date reminders enabled
 * @param {boolean} onboarding_complete.body.optional - Onboarding completion status
 * @returns {object} 202 - Preferences updated successfully
 * @returns {object} 201 - Preferences created (if none existed)
 * @returns {object} 400 - Invalid user ID
 * @returns {object} 404 - User not found
 * @returns {object} 500 - Server error saving preferences
 */
router.put("/user/:id/preferences", (req, res) => {
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

module.exports = router;