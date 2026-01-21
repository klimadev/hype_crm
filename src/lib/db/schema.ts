export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    type TEXT NOT NULL CHECK (type IN ('product', 'service')),
    recurrence_type TEXT DEFAULT 'none' CHECK (recurrence_type IN ('none', 'minute_30', 'hour_1', 'hour_2', 'hour_4', 'hour_8', 'day_1', 'day_3', 'day_7', 'day_15', 'day_30', 'day_60', 'day_90', 'month_1', 'month_2', 'month_3', 'month_6')),
    instance_name TEXT DEFAULT 'teste2',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    stage_id INTEGER NOT NULL,
    delay_value INTEGER NOT NULL DEFAULT 1,
    delay_unit TEXT NOT NULL DEFAULT 'day' CHECK (delay_unit IN ('minute', 'hour', 'day', 'week', 'month')),
    reminder_mode TEXT NOT NULL DEFAULT 'once' CHECK (reminder_mode IN ('once', 'recurring')),
    instance_name TEXT,
    message TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lead_recurrence_tracker (
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
  );

  CREATE TABLE IF NOT EXISTS reminder_logs (
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
  );

  CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    position INTEGER NOT NULL DEFAULT 0,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'new',
    stage_id INTEGER,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS whatsapp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    product_id INTEGER,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stage_entry', 'stage_timeout')),
    stage_id INTEGER,
    timeout_minutes INTEGER,
    message_template TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lead_stage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    stage_id INTEGER NOT NULL,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    exited_at DATETIME,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sent_whatsapp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES whatsapp_events(id) ON DELETE CASCADE,
    UNIQUE(lead_id, event_id)
  );

  CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id ON lead_stage_history(lead_id);
  CREATE INDEX IF NOT EXISTS idx_lead_stage_history_stage_id ON lead_stage_history(stage_id);
  CREATE INDEX IF NOT EXISTS idx_stages_position ON stages(position);
  CREATE INDEX IF NOT EXISTS idx_whatsapp_events_stage_id ON whatsapp_events(stage_id);
  CREATE INDEX IF NOT EXISTS idx_whatsapp_events_product_id ON whatsapp_events(product_id);
  CREATE INDEX IF NOT EXISTS idx_products_recurrence_type ON products(recurrence_type);
  CREATE INDEX IF NOT EXISTS idx_products_instance_name ON products(instance_name);
  CREATE INDEX IF NOT EXISTS idx_product_reminders_product_id ON product_reminders(product_id);
  CREATE INDEX IF NOT EXISTS idx_product_reminders_stage_id ON product_reminders(stage_id);
  CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_lead_id ON lead_recurrence_tracker(lead_id);
  CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_product_id ON lead_recurrence_tracker(product_id);
  CREATE INDEX IF NOT EXISTS idx_lead_recurrence_tracker_next_date ON lead_recurrence_tracker(next_reminder_date);
  CREATE INDEX IF NOT EXISTS idx_reminder_logs_lead_id ON reminder_logs(lead_id);
  CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status);
  CREATE INDEX IF NOT EXISTS idx_reminder_logs_scheduled ON reminder_logs(scheduled_at);
`;

export const INSERT_DEFAULT_DATA_SQL = `
  INSERT INTO users (username, password) VALUES ('admin', '$2a$10$rBV2JIAXxZNMXRdQxpR0XuPQ0YqKpV8K0U0K9qp5EcL9LQ4m9wWce');
`;
