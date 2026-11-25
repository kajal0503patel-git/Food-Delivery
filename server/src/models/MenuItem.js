const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true
        },
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
            maxlength: 80
        },
        description: {
            type: String,
            trim: true,
            maxlength: 300
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        category: {
            type: String,
            trim: true,
            default: 'General'
        },
        isVeg: {
            type: Boolean,
            default: true
        },
        image: {
            type: String

        },
        isAvailable: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);