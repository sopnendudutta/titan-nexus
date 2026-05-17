const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // 🚨 MONGODB ERRORS
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Registration Denied: That ${field} is already in use.`;
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // 🚨 NEW: MYSQL ERRORS
    if (err.code === 'ER_NO_SUCH_TABLE') {
        statusCode = 500; // Keep 500, but send a clear message
        message = "Database Error: The required tables (products/inventory) do not exist in Aiven.";
    }
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = "Validation Error: This SKU is already registered in the vault.";
    }

    // MAP JWT ERRORS
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