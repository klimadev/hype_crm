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
`;

export const INSERT_DEFAULT_DATA_SQL = `
  INSERT INTO users (username, password) VALUES ('admin', 'admin123');

  INSERT INTO products (name, description, price, type) VALUES 
    ('Consultoria inicial', 'Primeira reunião de consultoria', 0.00, 'service'),
    ('Plano Básico', 'Plano básico de acompanhamento', 99.00, 'product');

  INSERT INTO stages (name, position, product_id) VALUES
    ('Novo', 0, NULL),
    ('Contato', 1, NULL),
    ('Qualificação', 2, NULL),
    ('Proposta', 3, NULL),
    ('Fechado', 4, NULL);
`;
