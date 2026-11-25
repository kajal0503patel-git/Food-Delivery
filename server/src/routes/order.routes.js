const router = require('express').Router();
const {
    placeOrder,
    getMyOrders,
    getRestaurantOrders,
    getOrder,
    updateStatus,
    cancelOrder,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('customer'), placeOrder);
router.get('/', authorize('customer'), getMyOrders);
router.get('/restaurant/:restaurantId', authorize('owner', 'admin'), getRestaurantOrders); // /:id se pehle
router.get('/:id', getOrder);
router.put('/:id/status', authorize('owner', 'admin'), updateStatus);
router.put('/:id/cancel', authorize('customer'), cancelOrder);

module.exports = router;