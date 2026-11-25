const router = require('express').Router();
const { addItem, updateItem, deleteItem } = require('../controllers/menu.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('owner', 'admin'), addItem);
router.put('/:id', protect, authorize('owner', 'admin'), updateItem);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteItem);

module.exports = router;