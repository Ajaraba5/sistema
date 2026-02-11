const ExcelService = require('../utils/excelService');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

const excelController = {
    upload: upload.single('file'),

    // Import Excel
    async importExcel(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const results = await ExcelService.importExcel(req.file.buffer);

            res.json({
                success: true,
                message: `Import completed. Success: ${results.success}, Errors: ${results.errors.length}`,
                data: results
            });
        } catch (error) {
            next(error);
        }
    },

    // Export Excel
    async exportExcel(req, res, next) {
        try {
            const buffer = await ExcelService.exportExcel();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=personas-${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = excelController;
