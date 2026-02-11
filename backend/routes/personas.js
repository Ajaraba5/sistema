const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');
const authMiddleware = require('../middlewares/auth');

// All personas routes require authentication
router.use(authMiddleware);

// GET /api/personas
router.get('/', personasController.getAll);

// POST /api/personas
router.post('/', personasController.create);

// PATCH /api/personas/:id/voto
router.patch('/:id/voto', personasController.markVote);

// DELETE /api/personas/:id
router.delete('/:id', personasController.delete);

module.exports = router;
