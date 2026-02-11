const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

// All excel routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// POST /api/excel/import
router.post('/import', excelController.upload, excelController.importExcel);

// GET /api/excel/export
router.get('/export', excelController.exportExcel);

module.exports = router;
