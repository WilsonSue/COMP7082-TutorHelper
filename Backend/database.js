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

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    date_created TEXT,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_topic
      UNIQUE (user_id, topic)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    from_user INTEGER NOT NULL,
    date_created TEXT,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_convo
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
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

/**
 * Inserts a new user into the database.
 * Hashes the password using Argon2 before storing.
 * @async
 * @function insertUser
 * @param {string} username - Unique username
 * @param {string} email - Unique email address
 * @param {string} password - Raw plaintext password
 * @returns {number} The ID of the newly created user
 * @throws {Error} On constraint violations or database write failure
 */
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

/**
 * Retrieves a user by their ID (without password).
 * @function getUserById
 * @param {number} id - User ID
 * @returns {{id:number, username:string, email:string}|undefined}
 */
function getUserById(id) {
  return db.prepare(`SELECT id, username, email FROM users WHERE id = ?`).get(id);
}

/**
 * Retrieves a full user record by email, including the hashed password.
 * Used for login authentication.
 * @function getUserByEmail
 * @param {string} email - Email address
 * @returns {object|undefined} User record
 */
function getUserByEmail(email) {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

/**
 * Verifies a user's login credentials.
 * @async
 * @function loginUser
 * @param {string} email - Email used to log in
 * @param {string} password - Plaintext password
 * @returns {boolean} True if password matches the stored hash
 * @throws {Error} If the user does not exist or password is invalid
 */
async function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (!user) throw new Error("User not found");
  return await argon2.verify(user.password, password);
}

/**
 * Updates a user's username, email, or password.
 * Passwords are re-hashed if changed.
 * @async
 * @function updateUser
 * @param {number} id - User ID
 * @param {object} fields - Fields to update
 * @param {string} [fields.username]
 * @param {string} [fields.email]
 * @param {string} [fields.password] - Plaintext password
 * @returns {boolean} True if a row was updated
 * @throws {Error} If the user does not exist
 */
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

/**
 * Deletes a user by ID.
 * Cascades to sessions/messages/preferences because of foreign keys.
 * @function deleteUser
 * @param {number} id - User ID
 * @returns {boolean} True if a user was deleted
 */
function deleteUser(id) {
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== SESSIONS ====================

/**
 * Creates a new chat session for a user.
 * Enforces `UNIQUE(user_id, topic)`.
 * @function createSession
 * @param {number} userId - ID of the user
 * @param {string} topic - Human-readable session topic/title
 * @returns {number} New session ID
 */
function createSession(userId, topic) {
  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, topic, date_created)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, topic, new Date().toISOString());
  return result.lastInsertRowid;
}

/**
 * Retrieves a session by its ID.
 * @function getSessionById
 * @param {number} id - Session ID
 * @returns {object|undefined} Session record
 */
function getSessionById(id) {
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
}

/**
 * Retrieves a session for a given user by topic.
 * Assumes topics are unique per user.
 * @function getSessionByTopic
 * @param {string} topic
 * @param {number} userId
 * @returns {object|undefined} Session record
 */
function getSessionByTopic(topic, userId) {
  return db
    .prepare(`SELECT * FROM sessions WHERE topic = ? AND user_id = ? ORDER BY id ASC`)
    .get(topic, userId);
}

/**
 * Retrieves all sessions belonging to a user.
 * @function getSessionsByUserId
 * @param {number} userId
 * @returns {Array<object>} Sorted array of sessions
 */
function getSessionsByUserId(userId) {
  return db
    .prepare(`SELECT * FROM sessions WHERE user_id = ? ORDER BY id ASC`)
    .all(userId);
}

/**
 * Updates the topic of an existing session.
 * @function updateSession
 * @param {number} id - Session ID
 * @param {string} new_topic - New session topic
 * @returns {boolean} True if update applied
 * @throws {Error} If the session does not exist
 */
function updateSession(id, new_topic) {
  const existing = getSessionById(id);

  if (!existing) throw new Error(`session with id ${id} not found`);

  const stmt = db.prepare("UPDATE sessions SET topic = ? WHERE id = ?;");

  const result = stmt.run(new_topic, id);
  return result.changes > 0;
}

/**
 * Deletes a session by ID.
 * Cascades to messages.
 * @function deleteSession
 * @param {number} id - Session ID
 * @returns {boolean} True if deleted
 */
function deleteSession(id) {
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== MESSAGES ====================

/**
 * Inserts a message into a session.
 * @function insertMessage
 * @param {number} userId - Author user ID
 * @param {number} sessionId - Session it belongs to
 * @param {string} message - Message content
 * @param {boolean} fromUser - True if user authored, false if AI authored
 * @returns {number} New message ID
 */
function insertMessage(userId, sessionId, message, fromUser) {
  const stmt = db.prepare(`
    INSERT INTO messages (user_id, session_id, message, from_user, date_created)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userId,
    sessionId,
    message,
    fromUser ? 1 : 0,
    new Date().toISOString()
  );
  return result.lastInsertRowid;
}

/**
 * Inserts a message into a session identified by its topic.
 * Convenience helper.
 * @function insertMessageByTopic
 * @param {number} userId
 * @param {string} topic
 * @param {string} message
 * @param {boolean} fromUser
 * @returns {number} Message ID
 */
function insertMessageByTopic(userId, topic, message, fromUser) {
  const sessionId = getSessionByTopic(topic, userId).id;

  return insertMessage(userId, sessionId, message, fromUser);
}

/**
 * Retrieves a message by ID.
 * @function getMessageById
 * @param {number} id - Message ID
 * @returns {object|undefined}
 */
function getMessageById(id) {
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id);
}

/**
 * Retrieves all messages belonging to a session.
 * Ordered by chronological ID.
 * @function getMessagesBySessionId
 * @param {number} sessionId
 * @returns {Array<object>}
 */
function getMessagesBySessionId(sessionId) {
  return db
    .prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC`)
    .all(sessionId);
}

/**
 * Updates a message's text or author flag.
 * @function updateMessage
 * @param {number} id - Message ID
 * @param {object} fields
 * @param {string} [fields.message]
 * @param {boolean} [fields.from_user]
 * @returns {boolean} True if updated
 * @throws {Error} If the message does not exist
 */
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

/**
 * Deletes a message.
 * @function deleteMessage
 * @param {number} id - Message ID
 * @returns {boolean} True if a row was removed
 */
function deleteMessage(id) {
  const stmt = db.prepare(`DELETE FROM messages WHERE id = ?`);
  return stmt.run(id).changes > 0;
}

// ==================== PREFERENCES ====================

/**
 * Inserts a user preferences row.
 * Called when a new user has no preferences yet.
 * @function insertPreferences
 * @param {object} prefs
 * @param {number} prefs.user_id
 * @param {boolean} prefs.visual
 * @param {boolean} prefs.adhd
 * @param {boolean} prefs.due_dates
 * @param {boolean} prefs.onboarding_complete
 * @returns {number} New row ID
 */
function insertPreferences({user_id, visual, adhd, due_dates, onboarding_complete }) {
  const stmt = db.prepare(`
    INSERT INTO preferences (user_id, visual, adhd, due_dates, onboarding_complete)
    VALUES (?, ?, ?, ?, ?)`);

    const result = stmt.run(user_id, Number(visual), Number(adhd), Number(due_dates), Number(onboarding_complete));
    return result.lastInsertRowid;
}

/**
 * Retrieves preferences by their primary key.
 * @function getPreferencesById
 * @param {number} id
 * @returns {object|undefined}
 */
function getPreferencesById(id) {
  return db.prepare(`SELECT * FROM preferences WHERE id = ?`).get(id);
}

/**
 * Retrieves preferences for a given user.
 * @function getPreferencesByUserId
 * @param {number} userId
 * @returns {object|undefined}
 */
function getPreferencesByUserId(userId) {
  return db.prepare(`SELECT * FROM preferences WHERE user_id = ?`).get(userId);
}

/**
 * Updates a preferences record.
 * @function updatePreferences
 * @param {number} id - Preference row ID
 * @param {object} prefs
 * @param {boolean} [prefs.visual]
 * @param {boolean} [prefs.adhd]
 * @param {boolean} [prefs.due_dates]
 * @param {boolean} [prefs.onboarding_complete]
 * @returns {boolean} True if updated
 * @throws {Error} If the preference row doesn't exist
 */
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

  // Sessions
  createSession,
  getSessionById,
  getSessionByTopic,
  getSessionsByUserId,
  updateSession,
  deleteSession,

  // Messages
  insertMessage,
  insertMessageByTopic,
  getMessageById,
  getMessagesBySessionId,
  updateMessage,
  deleteMessage,

  // Preferences
  insertPreferences,
  getPreferencesByUserId,
  updatePreferences
};
