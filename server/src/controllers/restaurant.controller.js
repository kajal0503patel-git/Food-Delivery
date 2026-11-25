const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const getOwnedRestaurant = require('../utils/getOwnedRestaurant');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/restaurants?q=&cuisine=&open=true
exports.getRestaurants = asyncHandler(async (req, res) => {
    const { q, cuisine, open } = req.query;
    const filter = {};
    if (q) {
        filter.name = new RegExp(escapeRegex(q), 'i');
    }
    if (cuisine) {
        filter.cuisine = new RegExp(`^${escapeRegex(cuisine)}$`, 'i');
    }
    if (open === 'true') {
        filter.isOpen = true;
    }

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: restaurants.length, restaurants });
});

// GET /api/restaurants/my  (owner ke apne restaurants)
exports.getMyRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: restaurants.length, restaurants });
});

// GET /api/restaurants/:id
exports.getRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
    }
    res.json({ success: true, restaurant });
});

// POST /api/restaurants
exports.createRestaurant = asyncHandler(async (req, res) => {
    const { name, description, address, cuisine, image } = req.body;
    const restaurant = await Restaurant.create({
        owner: req.user._id,
        name,
        description,
        address,
        cuisine,
        image,
    });
    res.status(201).json({ success: true, restaurant });
});

// PUT /api/restaurants/:id
exports.updateRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req.params.id, req.user);

    const fields = ['name', 'description', 'address', 'cuisine', 'image'];
    fields.forEach((f) => {
        if (req.body[f] !== undefined) {
            restaurant[f] = req.body[f];
        }
    });

    await restaurant.save();
    res.json({ success: true, restaurant });
});

// PUT /api/restaurants/:id/toggle-openo
exports.toggleOpen = asyncHandler(async (req, res) => {
    const restaurant = await getOwnedRestaurant(req.params.id, req.user);
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();
    res.json({ success: true, isOpen: restaurant.isOpen, restaurant });
});