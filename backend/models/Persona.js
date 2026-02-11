const db = require('../config/db');

class Persona {
    static async create(personaData) {
        const { nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id } = personaData;
        
        const result = await db.query(
            `INSERT INTO personas (nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM personas WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   l.nombre as lider_nombre, 
                   u.nombre as contador_nombre 
            FROM personas p
            LEFT JOIN lideres l ON p.lider_id = l.id
            LEFT JOIN users u ON p.contador_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (filters.zona) {
            query += ` AND p.zona ILIKE $${paramCount}`;
            params.push(`%${filters.zona}%`);
            paramCount++;
        }

        if (filters.partido) {
            query += ` AND p.partido ILIKE $${paramCount}`;
            params.push(`%${filters.partido}%`);
            paramCount++;
        }

        if (filters.search) {
            query += ` AND (p.nombre ILIKE $${paramCount} OR p.cedula ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }

        if (filters.contador_id) {
            query += ` AND p.contador_id = $${paramCount}`;
            params.push(filters.contador_id);
            paramCount++;
        }

        if (filters.ha_votado !== undefined) {
            query += ` AND p.ha_votado = $${paramCount}`;
            params.push(filters.ha_votado);
            paramCount++;
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    static async update(id, personaData) {
        const { nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id } = personaData;
        
        const result = await db.query(
            `UPDATE personas 
             SET nombre = $1, cedula = $2, telefono = $3, direccion = $4, 
                 zona = $5, partido = $6, lider_id = $7, contador_id = $8, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 
             RETURNING *`,
            [nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id, id]
        );
        return result.rows[0];
    }

    static async markVote(id) {
        const result = await db.query(
            `UPDATE personas 
             SET ha_votado = true, fecha_voto = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query(
            'DELETE FROM personas WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rowCount > 0;
    }

    static async assignContador(personaId, contadorId) {
        const result = await db.query(
            `UPDATE personas 
             SET contador_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 
             RETURNING *`,
            [contadorId, personaId]
        );
        return result.rows[0];
    }

    static async getStats() {
        const result = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN ha_votado = true THEN 1 END) as votaron,
                COUNT(CASE WHEN ha_votado = false THEN 1 END) as pendientes,
                COUNT(CASE WHEN contador_id IS NOT NULL THEN 1 END) as asignados,
                COUNT(CASE WHEN contador_id IS NULL THEN 1 END) as sin_asignar
             FROM personas`
        );
        return result.rows[0];
    }

    static async getStatsByZona() {
        const result = await db.query(
            `SELECT 
                zona,
                COUNT(*) as total,
                COUNT(CASE WHEN ha_votado = true THEN 1 END) as votaron
             FROM personas
             GROUP BY zona
             ORDER BY zona`
        );
        return result.rows;
    }

    static async getStatsByPartido() {
        const result = await db.query(
            `SELECT 
                partido,
                COUNT(*) as total,
                COUNT(CASE WHEN ha_votado = true THEN 1 END) as votaron
             FROM personas
             GROUP BY partido
             ORDER BY partido`
        );
        return result.rows;
    }
}

module.exports = Persona;
