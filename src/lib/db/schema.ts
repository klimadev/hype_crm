import fs from 'fs';
import path from 'path';

const SQL_DIR = path.join(process.cwd(), 'src', 'lib', 'db');

function loadSqlFile(fileName: string): string {
  return fs.readFileSync(path.join(SQL_DIR, fileName), 'utf-8');
}

export const CREATE_TABLES_SQL = loadSqlFile('schema.sql');
export const INSERT_DEFAULT_DATA_SQL = loadSqlFile('seed.sql');
