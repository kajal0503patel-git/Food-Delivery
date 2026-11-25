const router = require('express').Router();
const { getUsers, toggleBlock, getOrders, getStats } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/block', toggleBlock);
router.get('/orders', getOrders);
router.get('/stats', getStats);

module.exports = router;