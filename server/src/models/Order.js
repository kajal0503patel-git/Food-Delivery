const mongoose = require('mongoose');
const { STATUSES } = require('../utils/orderStatus');

// order ke time ka naam aur price save hota hai, taaki menu badalne par purana order na badle
const orderItemSchema = new mongoose.Schema(
    {
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true
        },
        items: {
            type: [orderItemSchema],
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        deliveryAddress: {
            type: String,
            required: [true, 'Delivery address is required'],
            trim: true
        },
        status: {
            type: String,
            enum: STATUSES,
            default: 'Placed'
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'online'],
            default: 'cod'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);