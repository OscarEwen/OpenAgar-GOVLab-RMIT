const db = require("../sql.js").default;

const logFailedLoginAttempt = async (username, ipAddress) => {
    
    const insertFailedLoginStmt = db.prepare("INSERT INTO failed_login_attempts (username, ip_address) VALUES (?, ?)");
    return new Promise((resolve) => {
        /* insertFailedLoginStmt.run(username, ipAddress);
            "INSERT INTO failed_login_attempts (username, ip_address) VALUES (?, ?)",
            [username, ipAddress],
            (err) => {
                if (err) console.error(err);
                resolve();
            }
        ); */
    });
};

module.exports = {
    logFailedLoginAttempt,
};
