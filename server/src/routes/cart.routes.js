const router = require('express').Router();
const { getCart, addToCart, updateCart, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('customer'));

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCart);
router.delete('/clear', clearCart);
router.delete('/remove/:menuItemId', removeFromCart);

module.exports = router;