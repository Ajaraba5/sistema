const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Database errors
    if (err.code === '23505') { // Unique violation
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
            error: err.detail
        });
    }

    if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. Related record does not exist.',
            error: err.detail
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
