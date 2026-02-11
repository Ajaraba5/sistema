-- Sistema de Votación Enterprise v3.0.0
-- PostgreSQL Database Schema

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS lideres CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (admin and contador accounts)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'contador')),
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lideres table (political leaders)
CREATE TABLE lideres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    partido VARCHAR(100),
    zona VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personas table (voters)
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    zona VARCHAR(100),
    partido VARCHAR(100),
    lider_id INTEGER REFERENCES lideres(id) ON DELETE SET NULL,
    contador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ha_votado BOOLEAN DEFAULT FALSE,
    fecha_voto TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_personas_contador ON personas(contador_id);
CREATE INDEX idx_personas_lider ON personas(lider_id);
CREATE INDEX idx_personas_zona ON personas(zona);
CREATE INDEX idx_personas_partido ON personas(partido);
CREATE INDEX idx_personas_ha_votado ON personas(ha_votado);
CREATE INDEX idx_personas_cedula ON personas(cedula);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Insert default admin user (password: admin123)
-- Hash generated with bcryptjs for 'admin123'
INSERT INTO users (username, password, role, nombre, email) 
VALUES ('admin', '$2a$10$gMhMqaBuM5gcUxjLfNQ6zuocdI/xArL5oi0Vk4mYm2m/17zvkeBai', 'admin', 'Administrador Principal', 'admin@sistema.com');

COMMENT ON TABLE users IS 'System users (admin and contador roles)';
COMMENT ON TABLE lideres IS 'Political leaders managing voter groups';
COMMENT ON TABLE personas IS 'Registered voters';
COMMENT ON TABLE audit_log IS 'Audit trail for system actions';
