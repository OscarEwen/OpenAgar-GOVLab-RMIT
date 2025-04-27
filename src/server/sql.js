// const sqlite3 = require('sqlite3').verbose();
import Database from 'better-sqlite3';
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
const db = new Database(dbPath, { verbose: console.log });

// const buffer = db.serialize();

const loginStmt = db.prepare(`CREATE TABLE IF NOT EXISTS failed_login_attempts (
    username TEXT,
    ip_address TEXT
  )`);

const chatStmt = db.prepare(`CREATE TABLE IF NOT EXISTS chat_messages (
    username TEXT,
    message TEXT,
    ip_address TEXT,
    timestamp INTEGER
  )`);

if (db.open) {
  loginStmt.run();
  chatStmt.run();
}

/*
// Create the database connection
const olddb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
// Callback function called when database opened successfully or error occurred
  (err) => {
  // If an error occurred, throw it, else perform other tasks
  if (err) {
    console.error(err);
  } else {
    console.log('Connected to the SQLite database.');

    // Perform any necessary table creations
    olddb.serialize(
      () => {
        olddb.run(`CREATE TABLE IF NOT EXISTS failed_login_attempts (
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

      olddb.run(`CREATE TABLE IF NOT EXISTS chat_messages (
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
      }
    );
  }
});
*/

process.on('beforeExit', () => {
  db.close();
  /* olddb.close((err) => {
    if (err) {
      console.error('Error closing the database connection. ', err);
    } else {
      console.log('Closed the database connection.');
    }
  }); */
});

export default db;
