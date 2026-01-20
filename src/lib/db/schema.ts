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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  CREATE INDEX IF NOT EXISTS idx_sent_messages_lead_id ON sent_whatsapp_messages(lead_id);
  CREATE INDEX IF NOT EXISTS idx_sent_messages_event_id ON sent_whatsapp_messages(event_id);
`;

export const INSERT_DEFAULT_DATA_SQL = `
  INSERT INTO users (username, password) VALUES ('admin', '$2a$10$rBV2JIAXxZNMXRdQxpR0XuPQ0YqKpV8K0U0K9qp5EcL9LQ4m9wWce');
`;
