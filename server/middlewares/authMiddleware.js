const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 🚨 FIX: Explicitly check for the string "null"
    if (!token || token === 'null') {
        const error = new Error('You are not logged in. Please login to get access');
        error.statusCode = 401;
        throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        const error = new Error('The user belongs to this id does not exist anymore');
        error.statusCode = 401;
        throw error;
    }

    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const error = new Error('You do not have permission for this');
            error.statusCode = 403;
            //  Added 'return' to stop execution!
            return next(error);
        }
        next();
    }
};
