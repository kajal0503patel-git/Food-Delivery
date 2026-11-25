const Restaurant = require('../models/Restaurant');
const AppError = require('./AppError');

// restaurant dhoondhta hai aur check karta hai ki user uska owner (ya admin) hai

module.exports = async (restaurantId, user) => {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        throw new AppError('Reataurant not found', 400);
    }
    const isOwner = restaurant.owner.equals(user._id);
    if (!isOwner && user.role !== 'admin') {
        throw new AppError('You can only manage your own restaurant', 403);
    }
    return restaurant;

};