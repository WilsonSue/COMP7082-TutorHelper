const express = require("express");
const router = express.Router();
const db = require("../database");
require("dotenv").config();

router.get("/sessions/:user_id", (req, res) => {
  let { user_id } = req.params;
  user_id = Number(user_id);

  if (Number.isNaN(user_id)) return res.status(400).json({ error: "Invalid user id" });

  if (!db.getUserById(user_id)) return res.status(404).json({ error: "User not found" });

  return res.status(200).json(db.getSessionsByUserId(user_id));
});

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