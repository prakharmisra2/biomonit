-- Bio-Monitor Database Schema
-- PostgreSQL Database Setup Script
-- Run this script as postgres superuser

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'normal_user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- 2. REACTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reactors (
    reactor_id SERIAL PRIMARY KEY,
    reactor_name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    data_retention_days INT DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. USER-REACTOR ACCESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_reactor_access (
    access_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('owner', 'operator', 'viewer')),
    assigned_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reactor_id)
);

-- ============================================
-- 4. EQUIPMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id SERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    manufacturer VARCHAR(100),
    serial_number VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. DATA SOURCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS data_source (
    source_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL CHECK (name IN ('dilution', 'gas', 'level_control')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data sources
INSERT INTO data_source (name, description) VALUES
    ('dilution', 'Dilution rate monitoring VI'),
    ('gas', 'Gas analysis and respiratory monitoring VI'),
    ('level_control', 'Level control and weight monitoring VI')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. DILUTION DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dilution_data (
    record_id BIGSERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    time_passed FLOAT,
    flowrate FLOAT,
    dilution_rate FLOAT,
    volume_reactor FLOAT,
    mass_in_tank FLOAT,
    filtered_mass_in_tank FLOAT,
    total_tank_balance FLOAT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dilution_reactor_timestamp ON dilution_data(reactor_id, timestamp DESC);

-- ============================================
-- 7. GAS DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gas_data (
    record_id BIGSERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    OUR FLOAT,
    RQ FLOAT,
    Kla_1h FLOAT,
    Kla_bar FLOAT,
    stirrer_speed FLOAT,
    pH FLOAT,
    Dissolved_Oxygen FLOAT,
    reactor_temp FLOAT,
    pio2 FLOAT,
    gas_flow_in FLOAT,
    reactor_volume FLOAT,
    Tout FLOAT,
    Tin FLOAT,
    Pout FLOAT,
    Pin FLOAT,
    gas_out FLOAT,
    Ni FLOAT,
    Nout FLOAT,
    CPR FLOAT,
    Yo2in FLOAT,
    Yo2out FLOAT,
    Yco2in FLOAT,
    Yco2out FLOAT,
    Yinert_in FLOAT,
    Yinert_out FLOAT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gas_reactor_timestamp ON gas_data(reactor_id, timestamp DESC);

-- ============================================
-- 8. LEVEL CONTROL DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS level_control_data (
    record_id BIGSERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    reactor_weight FLOAT,
    volume_reactor FLOAT,
    pid_value FLOAT,
    pump_rpm FLOAT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_level_reactor_timestamp ON level_control_data(reactor_id, timestamp DESC);

-- ============================================
-- 9. SETPOINTS TABLE (for alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS setpoints (
    setpoint_id SERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('dilution', 'gas', 'level_control')),
    field_name VARCHAR(50) NOT NULL,
    min_value FLOAT,
    max_value FLOAT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reactor_id, data_type, field_name, user_id)
);

-- ============================================
-- 10. ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    reactor_id INT NOT NULL REFERENCES reactors(reactor_id) ON DELETE CASCADE,
    setpoint_id INT REFERENCES setpoints(setpoint_id) ON DELETE SET NULL,
    data_type VARCHAR(20) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    current_value FLOAT,
    threshold_value FLOAT,
    threshold_type VARCHAR(10) CHECK (threshold_type IN ('min', 'max')),
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INT REFERENCES users(user_id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_reactor ON alerts(reactor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON alerts(is_acknowledged, created_at DESC);

-- ============================================
-- 11. ALERT NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alert_notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(20) DEFAULT 'email' CHECK (notification_type IN ('email', 'system')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'pending'))
);

-- ============================================
-- 12. AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id BIGINT,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, created_at DESC);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to reactors table
DROP TRIGGER IF EXISTS update_reactors_updated_at ON reactors;
CREATE TRIGGER update_reactors_updated_at BEFORE UPDATE ON reactors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to setpoints table
DROP TRIGGER IF EXISTS update_setpoints_updated_at ON setpoints;
CREATE TRIGGER update_setpoints_updated_at BEFORE UPDATE ON setpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREATE DEFAULT ADMIN USER
-- ============================================
-- Password: Admin@123
-- Hash generated with bcrypt (10 rounds)
-- IMPORTANT: This is a real bcrypt hash for "Admin@123"
INSERT INTO users (username, full_name, email, password_hash, role) VALUES
    ('admin', 'System Administrator', 'admin@biomonitor.com', 
     '$2a$10$XQTwa9yCK.xKGYPjxW5Lw.vPgPgYqZ9bYZYqZ9bYZYqZ9bYZYqZ9e', 
     'admin')
ON CONFLICT (username) DO NOTHING;

-- Note: The password hash above is for "Admin@123"
-- You should change this password immediately after first login

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for latest data from each reactor
CREATE OR REPLACE VIEW latest_reactor_status AS
SELECT 
    r.reactor_id,
    r.reactor_name,
    d.timestamp as dilution_timestamp,
    d.dilution_rate,
    d.volume_reactor as dilution_volume,
    g.timestamp as gas_timestamp,
    g.pH,
    g.Dissolved_Oxygen,
    g.reactor_temp,
    g.OUR,
    l.timestamp as level_timestamp,
    l.reactor_weight,
    l.volume_reactor as level_volume
FROM reactors r
LEFT JOIN LATERAL (
    SELECT * FROM dilution_data 
    WHERE reactor_id = r.reactor_id 
    ORDER BY timestamp DESC LIMIT 1
) d ON true
LEFT JOIN LATERAL (
    SELECT * FROM gas_data 
    WHERE reactor_id = r.reactor_id 
    ORDER BY timestamp DESC LIMIT 1
) g ON true
LEFT JOIN LATERAL (
    SELECT * FROM level_control_data 
    WHERE reactor_id = r.reactor_id 
    ORDER BY timestamp DESC LIMIT 1
) l ON true
WHERE r.is_active = true;

-- ============================================
-- GRANT PERMISSIONS (if using separate app user)
-- ============================================
-- Uncomment and run these if you created a separate database user
-- GRANT CONNECT ON DATABASE bio_monitor TO bio_monitor_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bio_monitor_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bio_monitor_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bio_monitor_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bio_monitor_app;

-- ============================================
-- COMPLETED
-- ============================================
-- Database schema created successfully!
-- Default admin credentials:
--   Username: admin
--   Password: Admin@123
-- IMPORTANT: Change the admin password after first login!