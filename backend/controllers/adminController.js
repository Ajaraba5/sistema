const User = require('../models/User');
const Persona = require('../models/Persona');
const Lider = require('../models/Lider');
const db = require('../config/db');

const adminController = {
    // Get dashboard statistics
    async getDashboard(req, res, next) {
        try {
            const personaStats = await Persona.getStats();
            const contadores = await User.findAll('contador');
            const lideres = await Lider.findAll();
            const statsByZona = await Persona.getStatsByZona();
            const statsByPartido = await Persona.getStatsByPartido();

            res.json({
                success: true,
                data: {
                    personas: personaStats,
                    contadores: {
                        total: contadores.length,
                        lista: contadores
                    },
                    lideres: {
                        total: lideres.length,
                        lista: lideres
                    },
                    statsByZona,
                    statsByPartido
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Create contador user
    async createContador(req, res, next) {
        try {
            const { username, password, nombre, email } = req.body;

            if (!username || !password || !nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, password, and nombre are required'
                });
            }

            const existingUser = await User.findByUsername(username);
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            const newUser = await User.create({
                username,
                password,
                role: 'contador',
                nombre,
                email
            });

            res.status(201).json({
                success: true,
                message: 'Contador created successfully',
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    },

    // Get all contadores
    async getContadores(req, res, next) {
        try {
            const contadores = await User.findAll('contador');
            
            // Get stats for each contador
            const contadoresWithStats = await Promise.all(
                contadores.map(async (contador) => {
                    const stats = await User.getContadorStats(contador.id);
                    return {
                        ...contador,
                        stats
                    };
                })
            );

            res.json({
                success: true,
                data: contadoresWithStats
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete contador
    async deleteContador(req, res, next) {
        try {
            const { id } = req.params;

            const deleted = await User.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Contador not found'
                });
            }

            res.json({
                success: true,
                message: 'Contador deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    },

    // Assign persona to contador
    async assignPersona(req, res, next) {
        try {
            const { personaId, counterId } = req.params;

            const persona = await Persona.assignContador(personaId, counterId);

            if (!persona) {
                return res.status(404).json({
                    success: false,
                    message: 'Persona not found'
                });
            }

            res.json({
                success: true,
                message: 'Persona assigned successfully',
                data: persona
            });
        } catch (error) {
            next(error);
        }
    },

    // Get contador statistics
    async getContadorStats(req, res, next) {
        try {
            const result = await db.query(
                `SELECT 
                    u.id, 
                    u.nombre, 
                    u.username,
                    COUNT(p.id) as total_asignados,
                    COUNT(CASE WHEN p.ha_votado = true THEN 1 END) as total_votaron,
                    COUNT(CASE WHEN p.ha_votado = false THEN 1 END) as total_pendientes
                 FROM users u
                 LEFT JOIN personas p ON u.id = p.contador_id
                 WHERE u.role = 'contador'
                 GROUP BY u.id, u.nombre, u.username
                 ORDER BY total_asignados DESC`
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    },

    // Get lider statistics
    async getLiderStats(req, res, next) {
        try {
            const stats = await Lider.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    },

    // Create lider
    async createLider(req, res, next) {
        try {
            const { nombre, partido, zona, telefono, email } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre is required'
                });
            }

            const newLider = await Lider.create({
                nombre,
                partido,
                zona,
                telefono,
                email
            });

            res.status(201).json({
                success: true,
                message: 'Lider created successfully',
                data: newLider
            });
        } catch (error) {
            next(error);
        }
    },

    // Get all lideres
    async getLideres(req, res, next) {
        try {
            const lideres = await Lider.findAll();

            res.json({
                success: true,
                data: lideres
            });
        } catch (error) {
            next(error);
        }
    },

    // Reset database (requires confirmation)
    async resetDatabase(req, res, next) {
        try {
            const { confirmations } = req.body;

            if (!confirmations || confirmations.length !== 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren 3 confirmaciones para reiniciar la base de datos'
                });
            }

            // Verify confirmations
            const expectedConfirmations = ['CONFIRMO', 'ELIMINAR', 'TODO'];
            const isValid = confirmations.every((conf, idx) => conf === expectedConfirmations[idx]);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Las confirmaciones no son válidas'
                });
            }

            // Delete all data except admin user
            await db.query('DELETE FROM audit_log');
            await db.query('DELETE FROM personas');
            await db.query('DELETE FROM lideres');
            await db.query("DELETE FROM users WHERE role = 'contador'");

            res.json({
                success: true,
                message: 'Base de datos reiniciada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = adminController;
