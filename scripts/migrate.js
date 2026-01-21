const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');

function migrate() {
  console.log('🔄 Starting database migration...\n');

  const db = new Database(DB_PATH);

  try {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();

    if (tableInfo) {
      const productsInfo = db.prepare("PRAGMA table_info(products)").all();
      const hasRecurrenceType = productsInfo.find((col) => col.name === 'recurrence_type');
      const hasRecurrenceDays = productsInfo.find((col) => col.name === 'recurrence_days');
      const hasInstanceName = productsInfo.find((col) => col.name === 'instance_name');

      if (!hasRecurrenceType) {
        db.prepare("ALTER TABLE products ADD COLUMN recurrence_type TEXT DEFAULT 'none' CHECK (recurrence_type IN ('none', 'minute_30', 'hour_1', 'hour_2', 'hour_4', 'hour_8', 'day_1', 'day_3', 'day_7', 'day_15', 'day_30', 'day_60', 'day_90', 'month_1', 'month_2', 'month_3', 'month_6'))").run();
        console.log('✅ Added recurrence_type column to products');
      } else {
        console.log('ℹ️  recurrence_type column already exists');
      }

      if (!hasInstanceName) {
        db.prepare("ALTER TABLE products ADD COLUMN instance_name TEXT DEFAULT 'teste2'").run();
        console.log('✅ Added instance_name column to products');
      } else {
        console.log('ℹ️  instance_name column already exists');
      }

      if (hasRecurrenceDays) {
        db.prepare("ALTER TABLE products DROP COLUMN recurrence_days").run();
        console.log('✅ Dropped recurrence_days column from products');
      }
    }

    const hasProductReminders = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_reminders'").get();
    if (hasProductReminders) {
      const remindersInfo = db.prepare("PRAGMA table_info(product_reminders)").all();
      const hasDelayValue = remindersInfo.find((col) => col.name === 'delay_value');
      const hasDelayUnit = remindersInfo.find((col) => col.name === 'delay_unit');
      const hasReminderMode = remindersInfo.find((col) => col.name === 'reminder_mode');

      if (!hasDelayValue) {
        db.prepare("ALTER TABLE product_reminders ADD COLUMN delay_value INTEGER DEFAULT 1").run();
        console.log('✅ Added delay_value column to product_reminders');
      }

      if (!hasDelayUnit) {
        db.prepare("ALTER TABLE product_reminders ADD COLUMN delay_unit TEXT DEFAULT 'day' CHECK (delay_unit IN ('minute', 'hour', 'day', 'week', 'month'))").run();
        console.log('✅ Added delay_unit column to product_reminders');
      }

      if (!hasReminderMode) {
        db.prepare("ALTER TABLE product_reminders ADD COLUMN reminder_mode TEXT DEFAULT 'once' CHECK (reminder_mode IN ('once', 'recurring'))").run();
        console.log('✅ Added reminder_mode column to product_reminders');
      }
    } else {
      db.prepare(`
        CREATE TABLE product_reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          stage_id INTEGER NOT NULL,
          delay_value INTEGER NOT NULL DEFAULT 1,
          delay_unit TEXT NOT NULL DEFAULT 'day' CHECK (delay_unit IN ('minute', 'hour', 'day', 'week', 'month')),
          reminder_mode TEXT NOT NULL DEFAULT 'once' CHECK (reminder_mode IN ('once', 'recurring')),
          message TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
        )
      `).run();
      console.log('✅ Created product_reminders table');

      db.prepare("CREATE INDEX IF NOT EXISTS idx_product_reminders_product_id ON product_reminders(product_id)").run();
      db.prepare("CREATE INDEX IF NOT EXISTS idx_product_reminders_stage_id ON product_reminders(stage_id)").run();
      console.log('✅ Created indexes for product_reminders');
    }

    const hasLeadRecurrenceTracker = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lead_recurrence_tracker'").get();
    if (!hasLeadRecurrenceTracker) {
      db.prepare(`
        CREATE TABLE lead_recurrence_tracker (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          last_service_date DATETIME,
          next_reminder_date DATETIME,
          cycle_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(lead_id, product_id)
        )
      `).run();
      console.log('✅ Created lead_recurrence_tracker table');

      db.prepare("CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_lead_id ON lead_recurrence_tracker(lead_id)").run();
      db.prepare("CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_product_id ON lead_recurrence_tracker(product_id)").run();
      db.prepare("CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_next_date ON lead_recurrence_tracker(next_reminder_date)").run();
      console.log('✅ Created indexes for lead_recurrence_tracker');
    } else {
      console.log('ℹ️  lead_recurrence_tracker table already exists');
    }

    const hasReminderLogs = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reminder_logs'").get();
    if (!hasReminderLogs) {
      db.prepare(`
        CREATE TABLE reminder_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          reminder_id INTEGER NOT NULL,
          scheduled_at DATETIME NOT NULL,
          sent_at DATETIME,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
          message_preview TEXT,
          next_scheduled_at DATETIME,
          error TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (reminder_id) REFERENCES product_reminders(id) ON DELETE CASCADE
        )
      `).run();
      console.log('✅ Created reminder_logs table');

      db.prepare("CREATE INDEX IF NOT EXISTS idx_reminder_logs_lead_id ON reminder_logs(lead_id)").run();
      db.prepare("CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status)").run();
      db.prepare("CREATE INDEX IF NOT EXISTS idx_reminder_logs_scheduled ON reminder_logs(scheduled_at)").run();
      console.log('✅ Created indexes for reminder_logs');
    } else {
      console.log('ℹ️  reminder_logs table already exists');
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
