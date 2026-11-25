const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const getOwnedRestaurant = require('../utils/getOwnedRestaurant');

// GET /api/restaurants/:restaurantId/menu?veg=true&category=Starters&available=true
exports.getMenu = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
    }

    const filter = { restaurant: restaurant._id };
    if (req.query.veg === 'true') {
        filter.isVeg = true;
    }
    if (req.query.available === 'true') {
        filter.isAvailable = true;
    }
    if (req.query.category) {
        filter.category = String(req.query.category);
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({
        success: true,
        count: items.length,
        items
    });
});

// POST /api/menu
exports.addItem = asyncHandler(async (req, res) => {
    const { restaurantId, name, description, price, category, isVeg, image } = req.body;
    if (!restaurantId) {
        throw new AppError('restaurantId is required');
    }

    await getOwnedRestaurant(restaurantId, req.user);

    const item = await MenuItem.create({
        restaurant: restaurantId,
        name,
        description,
        price,
        category,
        isVeg,
        image,
    });
    res.status(201).json({
        success: true,
        item
    });
});

// PUT /api/menu/:id
exports.updateItem = asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
        throw new AppError('Menu item not found', 404);
    }

    await getOwnedRestaurant(item.restaurant, req.user);

    const fields = ['name', 'description', 'price', 'category', 'isVeg', 'image', 'isAvailable'];
    fields.forEach((f) => {
        if (req.body[f] !== undefined) {
            item[f] = req.body[f];
        }
    });

    await item.save();
    res.json({
        success: true,
        item
    });
});

// DELETE /api/menu/:id
exports.deleteItem = asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
        throw new AppError('Menu item not found', 404);
    }

    await getOwnedRestaurant(item.restaurant, req.user);

    await item.deleteOne();
    res.json({
        success: true,
        message: 'Menu item deleted'
    });
});