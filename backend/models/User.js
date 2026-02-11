const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async findByUsername(username) {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT id, username, role, nombre, email, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async create(userData) {
        const { username, password, role, nombre, email } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users (username, password, role, nombre, email) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, nombre, email, created_at',
            [username, hashedPassword, role, nombre, email]
        );
        return result.rows[0];
    }

    static async findAll(role = null) {
        let query = 'SELECT id, username, role, nombre, email, created_at FROM users';
        const params = [];
        
        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async delete(id) {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getContadorStats(contadorId) {
        const result = await db.query(
            `SELECT 
                COUNT(*) as total_asignados,
                COUNT(CASE WHEN ha_votado = true THEN 1 END) as total_votaron,
                COUNT(CASE WHEN ha_votado = false THEN 1 END) as total_pendientes
             FROM personas 
             WHERE contador_id = $1`,
            [contadorId]
        );
        return result.rows[0];
    }
}

module.exports = User;
