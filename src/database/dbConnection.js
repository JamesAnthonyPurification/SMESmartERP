// ============================================================================
// FILE: src/database/dbConnection.js
// PURPOSE: Database Connection Manager (SQLite local file + PostgreSQL config)
// ============================================================================

import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from './schema.js';
import { seedInitialData } from './seedData.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'smarterp.sqlite');

// Optional PostgreSQL Connection Config (if DATABASE_URL is set in .env)
export const POSTGRES_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smarterp_sme',
  ssl: false
};

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create tables and seed initial SME dataset
  db.exec(CREATE_TABLES_SQL);
  seedInitialData(db);

  dbInstance = db;
  return db;
}

