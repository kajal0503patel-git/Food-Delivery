const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/users?role=customer&q=asha
exports.getUsers = asyncHandler(async (req, res) => {
    const { role, q } = req.query;
    const filter = {};
    if (role) filter.role = String(role);
    if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        filter.$or = [{ name: rx }, { email: rx }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: users.length, users });
});

// PUT /api/admin/users/:id/block   (block / unblock toggle)
exports.toggleBlock = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('An admin cannot be blocked');

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, isBlocked: user.isBlocked, user });
});

// GET /api/admin/orders?status=Placed
exports.getOrders = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);

    const orders = await Order.find(filter)
        .populate('user', 'name email')
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 })
        .limit(100);
    res.json({ success: true, count: orders.length, orders });
});

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
    const [totalUsers, totalRestaurants, totalOrders, revenueData, byStatus, topRestaurants] = await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: '$restaurant', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
            { $sort: { orders: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
            { $unwind: '$restaurant' },
            { $project: { _id: 0, restaurantId: '$_id', name: '$restaurant.name', orders: 1, revenue: 1 } },
        ]),
    ]);

    const ordersByStatus = {};
    byStatus.forEach((s) => {
        ordersByStatus[s._id] = s.count;
    });

    res.json({
        success: true,
        stats: {
            totalUsers,
            totalRestaurants,
            totalOrders,
            revenue: revenueData[0] ? revenueData[0].revenue : 0,
            ordersByStatus,
            topRestaurants,
        },
    });
});