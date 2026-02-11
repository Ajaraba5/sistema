const User = require('../models/User');
const Persona = require('../models/Persona');

const contadorController = {
    // Get contador's personal dashboard
    async getDashboard(req, res, next) {
        try {
            const contadorId = req.user.id;

            const stats = await User.getContadorStats(contadorId);
            const personas = await Persona.findAll({ contador_id: contadorId });

            res.json({
                success: true,
                data: {
                    stats,
                    personas
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Get assigned personas
    async getPersonas(req, res, next) {
        try {
            const contadorId = req.user.id;
            const { search, ha_votado } = req.query;

            const filters = {
                contador_id: contadorId
            };

            if (search) {
                filters.search = search;
            }

            if (ha_votado !== undefined) {
                filters.ha_votado = ha_votado === 'true';
            }

            const personas = await Persona.findAll(filters);

            res.json({
                success: true,
                data: personas
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = contadorController;
