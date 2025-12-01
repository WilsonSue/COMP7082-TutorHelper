const express = require("express");
const router = express.Router();
const db = require("../database");
require("dotenv").config();

/**
 * @route GET /sessions/:user_id
 * @group Sessions - Operations related to user chat sessions
 * @param {number} user_id.path.required - The ID of the user whose sessions are being fetched
 * @returns {Array<Object>} 200 - Successfully retrieved all sessions belonging to the user
 * @returns {Error} 400 - Invalid user id (not a number)
 * @returns {Error} 404 - User not found
 * @description
 * Retrieves all chat sessions associated with a specific user.
 * Validates the user ID and checks that the user exists before
 * returning the list of sessions.
 */
router.get("/sessions/:user_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  return res.status(200).json(db.getSessionsByUserId(user_id));
});

/**
 * @route GET /sessions/:user_id/:session_id
 * @group Sessions - Operations related to user chat sessions
 * @param {number} user_id.path.required - The ID of the user requesting the session
 * @param {number} session_id.path.required - The ID of the specific session to fetch
 * @returns {Object} 200 - Successfully retrieved session topic and messages
 * @returns {Error} 400 - Invalid user id (not a number)
 * @returns {Error} 404 - User not found or session not found
 * @description
 * Retrieves a single session by ID, including:
 *   - session topic  
 *   - all messages belonging to that session  
 * Ensures both the user and session exist before returning data.
 */
router.get("/sessions/:user_id/:session_id", (req, res) => {
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

module.exports = router;