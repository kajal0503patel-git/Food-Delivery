const router = require('express').Router();
const {
    getRestaurants,
    getMyRestaurants,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    toggleOpen,
} = require('../controllers/restaurant.controller');
const { getMenu } = require('../controllers/menu.controller');
const { getRestaurantReviews } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getRestaurants);
router.get('/my', protect, authorize('owner', 'admin'), getMyRestaurants); // /:id se pehle hi rakhna
router.get('/:id', getRestaurant);
router.get('/:restaurantId/menu', getMenu);
router.get('/:restaurantId/reviews', getRestaurantReviews);

router.post('/', protect, authorize('owner', 'admin'), createRestaurant);
router.put('/:id', protect, authorize('owner', 'admin'), updateRestaurant);
router.put('/:id/toggle-open', protect, authorize('owner', 'admin'), toggleOpen);

module.exports = router;