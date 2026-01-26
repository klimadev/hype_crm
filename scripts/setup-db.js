const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');
const SQL_DIR = path.join(process.cwd(), 'src', 'lib', 'db');

function readSql(fileName) {
  return fs.readFileSync(path.join(SQL_DIR, fileName), 'utf-8');
}

function ensureDbDir() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

function setup() {
  console.log('🧱 Creating schema and seeding defaults...');

  ensureDbDir();

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    db.exec(readSql('schema.sql'));

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      db.exec(readSql('seed.sql'));
      console.log('✅ Default user created');
    } else {
      console.log('ℹ️  Users already exist, skipping seed');
    }

    console.log('✨ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

setup();
