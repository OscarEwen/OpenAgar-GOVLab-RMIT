// const sqlite3 = require('sqlite3').verbose();
import config from 'config';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const sqlInfo = config.get('db.sqlInfo');

const __dirname = import.meta.dirname;

const dbPath = join(__dirname, 'db', sqlInfo.filename);

// Ensure the database folder exists
const dbFolder = dirname(dbPath);
if (!existsSync(dbFolder)) {
  mkdirSync(dbFolder, { recursive: true });
  console.log(`Created the database folder: ${dbFolder}`);
}

// Create the database connection
const db = new Database(dbPath, { verbose: console.log });

// Prepare login table creation statement
const loginStmt = db.prepare(`CREATE TABLE IF NOT EXISTS failed_login_attempts (
    username TEXT,
    ip_address TEXT
  )`);

// Prepare chat table creation statement
const chatStmt = db.prepare(`CREATE TABLE IF NOT EXISTS chat_messages (
    username TEXT,
    message TEXT,
    ip_address TEXT,
    timestamp INTEGER
  )`);

// If the database is open, run both prepared statements
if (db.open) {
  loginStmt.run();
  chatStmt.run();
}

// If before exit is called, close the database
process.on('beforeExit', () => {
  db.close();
});

export default db;
