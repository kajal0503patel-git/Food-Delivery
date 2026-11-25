const router = require('express').Router();
const { createPayment, verifyPayment } = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('customer'));

router.post('/create', createPayment);
router.post('/verify', verifyPayment);

module.exports = router;