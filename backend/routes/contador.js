const express = require('express');
const router = express.Router();
const contadorController = require('../controllers/contadorController');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

// All contador routes require authentication and contador role
router.use(authMiddleware);
router.use(roleMiddleware('contador'));

// GET /api/contador/dashboard
router.get('/dashboard', contadorController.getDashboard);

// GET /api/contador/personas
router.get('/personas', contadorController.getPersonas);

module.exports = router;
