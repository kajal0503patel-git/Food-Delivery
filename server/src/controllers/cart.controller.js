const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const calculateTotal = require('../utils/calculateTotal');

const MAX_QTY = 20;

// cart ko frontend ke layak shape mein badalta hai (current price ke saath)
const formatCart = async (cart) => {
    if (!cart) return {
        restaurant: null,
        items: [],
        totalAmount: 0
    };

    await cart.populate([
        {
            path: 'items.menuItem',
            select: 'name price isVeg isAvailable'
        },
        {
            path: 'restaurant',
            select: 'name isOpen'
        },
    ]);

    const items = cart.items
        .filter((i) => i.menuItem)
        .map((i) => ({
            menuItemId: i.menuItem._id,
            name: i.menuItem.name,
            price: i.menuItem.price,
            isVeg: i.menuItem.isVeg,
            isAvailable: i.menuItem.isAvailable,
            quantity: i.quantity,
            subtotal: i.menuItem.price * i.quantity,
        }));

    return {
        restaurant: cart.restaurant,
        items,
        totalAmount: calculateTotal(items)
    };
};

const checkQuantity = (value, min) => {
    const qty = Number(value);
    if (!Number.isInteger(qty) || qty < min || qty > MAX_QTY) {
        throw new AppError(`Quantity must be a whole number between ${min} and ${MAX_QTY}`);
    }
    return qty;
};

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    res.json({
        success: true,
        cart: await formatCart(cart)
    });
});

// POST /api/cart/add   body: { menuItemId, quantity }
exports.addToCart = asyncHandler(async (req, res) => {
    const { menuItemId, quantity = 1 } = req.body;
    if (!menuItemId) {
        throw new AppError('menuItemId is required');
    }
    const qty = checkQuantity(quantity, 1);

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
        throw new AppError('Menu item not found', 404);
    }
    if (!menuItem.isAvailable) {
        throw new AppError('This item is not available right now');
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant || !restaurant.isOpen) {
        throw new AppError('This restaurant is closed right now');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
    }

    // ek baar mein ek hi restaurant
    if (cart.items.length > 0 && !cart.restaurant.equals(restaurant._id)) {
        throw new AppError('Your cart has items from another restaurant. Clear the cart first.', 409);
    }

    cart.restaurant = restaurant._id;
    const existing = cart.items.find((i) => i.menuItem.equals(menuItem._id));
    if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, MAX_QTY);
    } else {
        cart.items.push({ menuItem: menuItem._id, quantity: qty });
    }

    await cart.save();
    res.status(201).json({
        success: true,
        cart: await formatCart(cart)
    });
});

// PUT /api/cart/update   body: { menuItemId, quantity }   (quantity 0 = item hata do)
exports.updateCart = asyncHandler(async (req, res) => {
    const { menuItemId, quantity } = req.body;
    if (!menuItemId) {
        throw new AppError('menuItemId is required');
    }
    const qty = checkQuantity(quantity, 0);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Your cart is empty', 404);
    }

    const item = cart.items.find((i) => i.menuItem.equals(menuItemId));
    if (!item) {
        throw new AppError('Item not found in your cart', 404);
    }

    if (qty === 0) {
        cart.items = cart.items.filter((i) => !i.menuItem.equals(menuItemId));
    } else {
        item.quantity = qty;
    }
    if (cart.items.length === 0) cart.restaurant = undefined;

    await cart.save();
    res.json({ success: true, cart: await formatCart(cart) });
});

// DELETE /api/cart/remove/:menuItemId
exports.removeFromCart = asyncHandler(async (req, res) => {
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Your cart is empty', 404);

    }
    const item = cart.items.find((i) => i.menuItem.equals(menuItemId));
    if (!item) {
        throw new AppError('Item not found in your cart', 404);
    }

    cart.items = cart.items.filter((i) => !i.menuItem.equals(menuItemId));
    if (cart.items.length === 0) {
        cart.restaurant = undefined;

    }
    await cart.save();
    res.json({
        success: true,
        cart: await formatCart(cart)
    });
});

// DELETE /api/cart/clear
exports.clearCart = asyncHandler(async (req, res) => {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({
        success: true,
        message: 'Cart cleared'
    });
});