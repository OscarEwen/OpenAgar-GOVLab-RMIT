import db from "../sql.js";

const logFailedLoginAttempt = async (username, ipAddress) => {
    
    const insertFailedLoginStmt = db.prepare("INSERT INTO failed_login_attempts (username, ip_address) VALUES (?, ?)");
    return new Promise((resolve) => {
        insertFailedLoginStmt.run(username, ipAddress);
    });
};

export default {
    logFailedLoginAttempt,
};
