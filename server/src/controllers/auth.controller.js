const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const sendToken = (user, status, res) => {
    const token = user.generateToken();
    res.status(status).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
    });
};

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {

    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) throw new AppError('Name, email and password are required');

    // public registration se admin nahi ban sakta
    const allowedRoles = ['customer', 'owner', 'partner'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({ name, email, password, phone, role: userRole });
    sendToken(user, 201, res);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) throw new AppError('Invalid email or password', 401);
    if (user.isBlocked) throw new AppError('Your account is blocked', 403);

    sendToken(user, 200, res);
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    await req.user.save();
    res.json({ success: true, user: req.user });
});