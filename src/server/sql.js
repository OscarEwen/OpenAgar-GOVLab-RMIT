const sqlite3 = require('sqlite3').verbose();
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { sqlinfo } from '../../config';

const sqlInfo = sqlinfo;
const dbPath = join(__dirname, 'db', sqlInfo.fileName);

// Ensure the database folder exists
const dbFolder = dirname(dbPath);
if (!existsSync(dbFolder)) {
  mkdirSync(dbFolder, { recursive: true });
  console.log(`Created the database folder: ${dbFolder}`);
}

// Create the database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Connected to the SQLite database.');

    // Perform any necessary table creations
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS failed_login_attempts (
        username TEXT,
        ip_address TEXT
      )`, (err) => {
        if (err) {
          console.error(err);
        }
        else {
          console.log("Created failed_login_attempts table");
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        username TEXT,
        message TEXT,
        ip_address TEXT,
        timestamp INTEGER
      )`, (err) => {
        if (err) {
          console.error(err);
        }
        else {
          console.log("Created chat_messages table");
        }
      });
    });
  }
});

process.on('beforeExit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection. ', err);
    } else {
      console.log('Closed the database connection.');
    }
  });
});

export default db;
