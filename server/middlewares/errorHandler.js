const errorHandler = (err, req, res, next) => {
    //  If a response was already sent, don't try again!
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;