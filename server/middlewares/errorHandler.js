const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // 🚨 NEW: Catch Duplicate User/Email errors
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Registration Denied: That ${field} is already in use.`;
    }

    // 🚨 NEW: Catch MongoDB Validation Errors (Missing fields)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Invalid or expired token. Security protocol initiated.';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;