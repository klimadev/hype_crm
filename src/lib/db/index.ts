import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES_SQL, INSERT_DEFAULT_DATA_SQL } from './schema';

const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');

  // Always ensure tables exist and default data is present
  dbInstance.exec(CREATE_TABLES_SQL);
  // Check if users table is empty and insert default user if needed
  const userCount = dbInstance.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    dbInstance.exec(INSERT_DEFAULT_DATA_SQL);
  }

  return dbInstance;
}

export function query<T>(sql: string, params?: unknown[]): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as never[]);
  return stmt.all() as T[];
}

export function run(sql: string, params?: unknown[]): { id: number; changes: number } {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.run(params as never[]);
  const info = db.prepare('SELECT last_insert_rowid() as id, changes() as changes').get() as { id: number; changes: number };
  return info;
}

export function getOne<T>(sql: string, params?: unknown[]): T | null {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(params as never[]) as T | null;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
