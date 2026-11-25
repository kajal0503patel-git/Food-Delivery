const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { chat, search, generateDescription } = require('../controllers/ai.controller');
const { protect, authorize } = require('../middleware/auth');

// AI paid hai, isliye har IP se 1 minute mein sirf 15 requests
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, message: 'Too many AI requests. Please wait a minute' },
});

router.use(protect, aiLimiter);

router.post('/chat', authorize('customer'), chat);
router.post('/search', authorize('customer'), search);
router.post('/generate-description', authorize('owner', 'admin'), generateDescription);

module.exports = router;