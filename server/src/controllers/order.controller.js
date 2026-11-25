const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const calculateTotal = require('../utils/calculateTotal');
const getOwnedRestaurant = require('../utils/getOwnedRestaurant');
const { NEXT_STATUS } = require('../utils/orderStatus');

// POST /api/orders   body: { deliveryAddress, paymentMethod }
exports.placeOrder = asyncHandler(async (req, res) => {
    const { deliveryAddress, paymentMethod = 'cod' } = req.body;
    if (!deliveryAddress || !String(deliveryAddress).trim()) {
        throw new AppError('Delivery address is required');
    }
    if (!['cod', 'online'].includes(paymentMethod)) {
        throw new AppError('paymentMethod must be cod or online');
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
    if (!cart || cart.items.length === 0) {
        throw new AppError('Your cart is empty');
    }

    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant || !restaurant.isOpen) {
        throw new AppError('This restaurant is closed right now');
    }

    const items = cart.items.map((i) => {
        if (!i.menuItem) {
            throw new AppError('An item in your cart no longer exists. Please update your cart');
        }
        if (!i.menuItem.isAvailable) {
            throw new AppError(`${i.menuItem.name} is not available right now`);
        }
        return {
            menuItem: i.menuItem._id,
            name: i.menuItem.name,
            price: i.menuItem.price, // database ka price, client ka nahi
            quantity: i.quantity,
        };
    });

    const order = await Order.create({
        user: req.user._id,
        restaurant: restaurant._id,
        items,
        totalAmount: calculateTotal(items),
        deliveryAddress: String(deliveryAddress).trim(),
        paymentMethod,
    });

    // order ban gaya, cart khali
    cart.items = [];
    cart.restaurant = undefined;
    await cart.save();

    res.status(201).json({
        success: true,
        order
    });
});

// GET /api/orders   (customer ke apne orders)
exports.getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 });
    res.json({
        success: true,
        count: orders.length,
        orders
    });
});

// GET /api/orders/restaurant/:restaurantId?status=Placed   (owner ke incoming orders)
exports.getRestaurantOrders = asyncHandler(async (req, res) => {
    await getOwnedRestaurant(req.params.restaurantId, req.user);

    const filter = { restaurant: req.params.restaurantId };
    if (req.query.status) {
        filter.status = String(req.query.status);
    }

    const orders = await Order.find(filter).populate('user', 'name phone').sort({ createdAt: -1 });
    res.json({
        success: true,
        count: orders.length,
        orders
    });
});

// GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name phone')
        .populate('restaurant', 'name address owner');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const isCustomer = order.user._id.equals(req.user._id);

    const isOwner = order.restaurant.owner.equals(req.user._id);

    if (!isCustomer && !isOwner && req.user.role !== 'admin') {
        throw new AppError('You cannot view this order', 403);
    }

    res.json({
        success: true,
        order
    });
});

// PUT /api/orders/:id/status   body: { status }   (restaurant owner)
exports.updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) {
        throw new AppError('status is required');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    await getOwnedRestaurant(order.restaurant, req.user);

    const allowed = NEXT_STATUS[order.status] || [];
    if (!allowed.includes(status)) {
        throw new AppError(`Cannot change status from "${order.status}" to "${status}"`);
    }

    order.status = status;
    // cash on delivery ka payment delivery par hota hai
    if (status === 'Delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
    }

    await order.save();
    res.json({
        success: true,
        order
    });
});

// PUT /api/orders/:id/cancel   (customer, sirf Placed status par)
exports.cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (order.status !== 'Placed') {
        throw new AppError('Order can be cancelled only before the restaurant accepts it');
    }

    order.status = 'Cancelled';
    await order.save();
    res.json({
        success: true,
        order
    });
});