const router = require('express').Router();
const { createReview } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('customer'), createReview);

module.exports = router;