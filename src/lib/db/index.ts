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
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(CREATE_TABLES_SQL);

  const userCount = dbInstance.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    dbInstance.exec(INSERT_DEFAULT_DATA_SQL);
  }

  const columns = dbInstance.prepare("PRAGMA table_info(stages)").all() as { name: string }[];
  const hasColorColumn = columns.some(col => col.name === 'color');
  if (!hasColorColumn) {
    dbInstance.exec("ALTER TABLE stages ADD COLUMN color TEXT DEFAULT '#6366f1'");
    dbInstance.exec("UPDATE stages SET color = '#6366f1' WHERE color IS NULL");
  }

  return dbInstance;
}

export function query<T>(sql: string, params?: unknown[]): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) {
    return stmt.bind(...params as never[]).all() as T[];
  }
  return stmt.all() as T[];
}

export function run(sql: string, params?: unknown[]): { id: number; changes: number } {
  const db = getDb();
  const stmt = db.prepare(sql);
  const info = params ? stmt.bind(...params as never[]).run() : stmt.run();
  return { id: info.lastInsertRowid as number, changes: info.changes };
}

export function getOne<T>(sql: string, params?: unknown[]): T | null {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) {
    return stmt.bind(...params as never[]).get() as T | null;
  }
  return stmt.get() as T | null;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function isDbOpen(): boolean {
  return dbInstance !== null;
}
