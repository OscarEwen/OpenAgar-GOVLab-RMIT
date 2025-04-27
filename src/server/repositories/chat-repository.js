const db = require("../sql.js").default;

const logChatMessage = async (username, message, ipAddress) => {
    const timestamp = new Date().getTime();

    const insertChatStmt = db.prepare("INSERT INTO chat_messages (username, message, ip_address, timestamp) VALUES (?, ?, ?, ?)");

    return new Promise((resolve) => {
        insertChatStmt.run(username, message, ipAddress, timestamp);
        /*    "INSERT INTO chat_messages (username, message, ip_address, timestamp) VALUES (?, ?, ?, ?)",
            [username, message, ipAddress, timestamp],
            (err) => {
                if (err) console.error(err);
                resolve();
            }
        ); */
    });
};

module.exports = {
    logChatMessage,
};
