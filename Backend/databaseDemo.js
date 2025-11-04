// demo.js
const db = require("./database");

(async () => {
  try {
    console.log("===== DEMO START =====");

    // 1. Create a user
    const userId = await db.insertUser("alice", "alice@example.com", "password123");
    console.log("Created user with id:", userId);

    // 2. Log in with correct password
    const loginSuccess = await db.loginUser("alice@example.com", "password123");
    console.log("Login success:", loginSuccess);

    // 3. Create a conversation for this user
    const convoId = db.createConversation(userId);
    console.log("Created conversation with id:", convoId);

    // 4. Insert messages into the conversation
    const msg1 = db.insertMessage(userId, convoId, "Hey, this is Alice!", true);
    const msg2 = db.insertMessage(userId, convoId, "Hello Alice! I'm your AI assistant.", false);
    console.log("Inserted messages with ids:", msg1, msg2);

    // 5. Fetch all messages in the conversation
    const messages = db.getMessagesByConversationId(convoId);
    console.log("\nAll messages in conversation:");
    messages.forEach((m) => {
      console.log(
        `  [${m.id}] ${m.fromUser ? "User" : "AI"}: ${m.message} (at ${m.dateCreated})`
      );
    });

    // 6. Update a message
    const updated = db.updateMessage(msg1, { message: "Hey, this is Alice (edited)!" });
    console.log("\nMessage updated:", updated);

    // Fetch again to confirm update
    const updatedMessages = db.getMessagesByConversationId(convoId);
    console.log("\nUpdated conversation messages:");
    updatedMessages.forEach((m) => {
      console.log(`  [${m.id}] ${m.fromUser ? "User" : "AI"}: ${m.message}`);
    });

    // 7. Delete the AI’s message
    const deleted = db.deleteMessage(msg2);
    console.log("\nDeleted AI message:", deleted);

    // Verify deletion
    const afterDelete = db.getMessagesByConversationId(convoId);
    console.log("\nConversation after deletion:");
    afterDelete.forEach((m) => {
      console.log(`  [${m.id}] ${m.fromUser ? "User" : "AI"}: ${m.message}`);
    });

    // 8. Cleanup: delete conversation and user
    const convoDeleted = db.deleteConversation(convoId);
    const userDeleted = db.deleteUser(userId);
    console.log("\nCleanup complete. Conversation deleted:", convoDeleted, "User deleted:", userDeleted);

    console.log("\n===== DEMO END =====");
  } catch (err) {
    console.error("Error during demo:", err);
  }
})();
