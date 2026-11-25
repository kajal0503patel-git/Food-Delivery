const STATUSES = [
    'Placed',
    'Accepted',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Rejected',
];

// kis status ke baad kaunsa status aa sakta hai
const NEXT_STATUS = {
    Placed: ['Accepted', 'Rejected'],
    Accepted: ['Preparing'],
    Preparing: ['Ready for Pickup'],
    'Ready for Pickup': ['Out for Delivery'],
    'Out for Delivery': ['Delivered'],
};

module.exports = { STATUSES, NEXT_STATUS };