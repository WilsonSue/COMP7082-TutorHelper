const db = require("better-sqlite3")("dev.db");
const argon2 = require("argon2");

// ==================== Schema Setup ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, 
    password TEXT NOT NULL,
    date_created TEXT
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date_created TEXT,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    conversation_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    from_user INTEGER NOT NULL,
    date_created TEXT,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_convo
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    visual INTEGER NOT NULL,
    adhd INTEGER NOT NULL,
    due_dates INTEGER NOT NULL,
    onboarding_complete INTEGER NOT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ==================== USERS ====================

async function insertUser(username, email, password) {
  try {
    const hashedPassword = await argon2.hash(password);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, date_created)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, email, hashedPassword, new Date().toISOString());
    return result.lastInsertRowid;
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  }
}

function getUserById(id) {
  return db.prepare(`SELECT id, username, email FROM users WHERE id = ?`).get(id);
}

function getUserByEmail(email) {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

async function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (!user) throw new Error("User not found");
  return await argon2.verify(user.password, password);
}

async function updateUser(id, { username, email, password }) {
  const user = getUserById(id);
  if (!user) throw new Error(`User with id ${id} not found`);

  const updatedUsername = username ?? user.username;
  const updatedEmail = email ?? user.email;
  const updatedPassword = password
    ? await argon2.hash(password)
    : db.prepare("SELECT password FROM users WHERE id = ?").get(id).password;

  const stmt = db.prepare(`
    UPDATE users
    SET username = ?, email = ?, password = ?
    WHERE id = ?
  `);
  const result = stmt.run(updatedUsername, updatedEmail, updatedPassword, id);
  return result.changes > 0;
}

function deleteUser(id) {
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== CONVERSATIONS ====================

function createConversation(userId) {
  const stmt = db.prepare(`
    INSERT INTO conversations (userId, date_created)
    VALUES (?, ?)
  `);
  const result = stmt.run(userId, new Date().toISOString());
  return result.lastInsertRowid;
}

function getConversationById(id) {
  return db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id);
}

function getConversationsByUserId(userId) {
  return db
    .prepare(`SELECT * FROM conversations WHERE user_id = ? ORDER BY id ASC`)
    .all(userId);
}

function deleteConversation(id) {
  const stmt = db.prepare(`DELETE FROM conversations WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== MESSAGES ====================

function insertMessage(userId, conversationId, message, fromUser) {
  const stmt = db.prepare(`
    INSERT INTO messages (userId, conversationId, message, from_user, date_created)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userId,
    conversationId,
    message,
    fromUser ? 1 : 0,
    new Date().toISOString()
  );
  return result.lastInsertRowid;
}

function getMessageById(id) {
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id);
}

function getMessagesByConversationId(conversationId) {
  return db
    .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC`)
    .all(conversationId);
}

function updateMessage(id, { message, from_user }) {
  const existing = getMessageById(id);
  if (!existing) throw new Error(`Message with id ${id} not found`);

  const newMessage = message ?? existing.message;
  const newFromUser =
    typeof from_user === "boolean" ? (from_user ? 1 : 0) : existing.fromUser;

  const stmt = db.prepare(`
    UPDATE messages
    SET message = ?, fromUser = ?
    WHERE id = ?
  `);
  const result = stmt.run(newMessage, newFromUser, id);
  return result.changes > 0;
}

function deleteMessage(id) {
  const stmt = db.prepare(`DELETE FROM messages WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== PREFERENCES ====================

function insertPreferences({user_id, visual, adhd, due_dates, onboarding_complete }) {
  const stmt = db.prepare(`
    INSERT INTO preferences (user_id, visual, adhd, due_dates, onboarding_complete)
    VALUES (?, ?, ?, ?, ?)`);

    const result = stmt.run(user_id, Number(visual), Number(adhd), Number(due_dates), Number(onboarding_complete));
    return result.lastInsertRowid;
}

function getPreferencesById(id) {
  return db.prepare(`SELECT * FROM preferences WHERE id = ?`).get(id);
}

function getPreferencesByUserId(userId) {
  return db.prepare(`SELECT * FROM preferences WHERE user_id = ?`).get(userId);
}

function updatePreferences(id, { visual, adhd, due_dates, onboarding_complete }) {
  const existing = getPreferencesById(id);
  if (!existing) throw new Error(`Preferences with id ${id} not found`);

  const newVisual = visual !== undefined ? visual : existing.visual;
  const newAdhd = adhd !== undefined ? adhd : existing.adhd;
  const newDueDates = due_dates !== undefined ? due_dates : existing.dueDates;
  const newOnboarding = onboarding_complete !== undefined
    ? onboarding_complete
    : existing.onboarding_complete;

  const stmt = db.prepare(`
    UPDATE preferences
    SET visual = ?, adhd = ?, due_dates = ?, onboarding_complete = ?
    WHERE id = ?
  `);

  const result = stmt.run(Number(newVisual), Number(newAdhd), Number(newDueDates), Number(newOnboarding), id);

  return result.changes > 0;
}

// ==================== EXPORTS ====================
module.exports = {
  // Users
  insertUser,
  getUserById,
  getUserByEmail,
  loginUser,
  updateUser,
  deleteUser,

  // Conversations
  createConversation,
  getConversationById,
  getConversationsByUserId,
  deleteConversation,

  // Messages
  insertMessage,
  getMessageById,
  getMessagesByConversationId,
  updateMessage,
  deleteMessage,

  // Preferences
  insertPreferences,
  getPreferencesByUserId,
  updatePreferences
};
