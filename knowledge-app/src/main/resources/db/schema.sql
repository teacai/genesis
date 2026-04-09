CREATE TABLE IF NOT EXISTS entry (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    tags VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_link (
    id VARCHAR(36) PRIMARY KEY,
    source_id VARCHAR(36) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    label VARCHAR(200),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_link_source FOREIGN KEY (source_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_link_target FOREIGN KEY (target_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT uq_link UNIQUE (source_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_link_source ON entry_link(source_id);
CREATE INDEX IF NOT EXISTS idx_link_target ON entry_link(target_id);
CREATE INDEX IF NOT EXISTS idx_entry_updated ON entry(updated_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(500)
);
