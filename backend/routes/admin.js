const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// Contador management
router.post('/usuarios', adminController.createContador);
router.get('/usuarios', adminController.getContadores);
router.delete('/usuarios/:id', adminController.deleteContador);

// Assign persona to contador
router.patch('/asignar/:personaId/:counterId', adminController.assignPersona);

// Statistics
router.get('/contadores/estadisticas', adminController.getContadorStats);
router.get('/lideres/estadisticas', adminController.getLiderStats);

// Lider management
router.post('/lideres', adminController.createLider);
router.get('/lideres', adminController.getLideres);

// Database reset
router.post('/reset-db', adminController.resetDatabase);

module.exports = router;
