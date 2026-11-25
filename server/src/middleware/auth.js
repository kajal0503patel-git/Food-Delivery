const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// login hona zaroori hai
exports.protect = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new AppError('Please login first', 401);

    let decoded;
    try {
        decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch {
        throw new AppError('Invalid or expired token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User no longer exists', 401);
    if (user.isBlocked) throw new AppError('Your account is blocked', 403);

    req.user = user;
    next();
});

// role check: authorize('owner', 'admin')
exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new AppError('You are not allowed to do this', 403);
    next();
};