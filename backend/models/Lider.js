const db = require('../config/db');

class Lider {
    static async create(liderData) {
        const { nombre, partido, zona, telefono, email } = liderData;
        
        const result = await db.query(
            `INSERT INTO lideres (nombre, partido, zona, telefono, email) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [nombre, partido, zona, telefono, email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM lideres WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findAll() {
        const result = await db.query(
            'SELECT * FROM lideres ORDER BY created_at DESC'
        );
        return result.rows;
    }

    static async update(id, liderData) {
        const { nombre, partido, zona, telefono, email } = liderData;
        
        const result = await db.query(
            `UPDATE lideres 
             SET nombre = $1, partido = $2, zona = $3, telefono = $4, email = $5
             WHERE id = $6 
             RETURNING *`,
            [nombre, partido, zona, telefono, email, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query(
            'DELETE FROM lideres WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    static async getStats() {
        const result = await db.query(
            `SELECT 
                l.id,
                l.nombre,
                l.partido,
                l.zona,
                COUNT(p.id) as total_personas,
                COUNT(CASE WHEN p.ha_votado = true THEN 1 END) as total_votaron
             FROM lideres l
             LEFT JOIN personas p ON l.id = p.lider_id
             GROUP BY l.id, l.nombre, l.partido, l.zona
             ORDER BY total_personas DESC`
        );
        return result.rows;
    }
}

module.exports = Lider;
