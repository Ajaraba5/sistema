const Persona = require('../models/Persona');

const personasController = {
    // Get all personas (with filters)
    async getAll(req, res, next) {
        try {
            const { zona, partido, search } = req.query;

            const filters = {};
            if (zona) filters.zona = zona;
            if (partido) filters.partido = partido;
            if (search) filters.search = search;

            const personas = await Persona.findAll(filters);

            res.json({
                success: true,
                data: personas
            });
        } catch (error) {
            next(error);
        }
    },

    // Create persona
    async create(req, res, next) {
        try {
            const { nombre, cedula, telefono, direccion, zona, partido, lider_id, contador_id } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre is required'
                });
            }

            const newPersona = await Persona.create({
                nombre,
                cedula,
                telefono,
                direccion,
                zona,
                partido,
                lider_id,
                contador_id
            });

            res.status(201).json({
                success: true,
                message: 'Persona created successfully',
                data: newPersona
            });
        } catch (error) {
            next(error);
        }
    },

    // Mark vote
    async markVote(req, res, next) {
        try {
            const { id } = req.params;

            const persona = await Persona.markVote(id);

            if (!persona) {
                return res.status(404).json({
                    success: false,
                    message: 'Persona not found'
                });
            }

            res.json({
                success: true,
                message: 'Vote marked successfully',
                data: persona
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete persona
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const deleted = await Persona.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Persona not found'
                });
            }

            res.json({
                success: true,
                message: 'Persona deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = personasController;
