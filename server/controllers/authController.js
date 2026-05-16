const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');


// Helper to sign with jwt 
const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        // This uses the env variable, but falls back to 1 day if the env is broken
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

// Registering new user
exports.signup = catchAsync(async (req, res, next) => {
    // 🚨 Removed username from destructuring
    const { email, password, role } = req.body;

    const newUser = await User.create({
        email,
        password,
        role
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        success: true,
        token,
        data: {
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role
            }
        }
    });
});


// Log in an existing user
exports.login = catchAsync(async (req, res, next) => {
    // 1. We now explicitly grab the 'role' the user selected on the frontend
    const { email, password, role } = req.body;

    if (!email || !password) {
        const error = new Error('Please provide valid email/password');
        error.statusCode = 401;
        throw error;
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        const error = new Error('Incorrect email/Password');
        error.statusCode = 401;
        throw error;
    }

    // THE FIX: Verify the dropdown selection matches the Database role
    if (user.role !== role) {
        const error = new Error(`Access Denied: You do not have ${role} clearance.`);
        error.statusCode = 403;
        throw error;
    }

    const token = signToken(user._id);

    res.status(200).json({
        success: true,
        token
    });
});