const mongoose = require('mongoose');
const restaurantSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: [true, 'Restaurant name is required'],
            trim: true,
            maxlength: 80
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true
        },
        cuisine: {
            type: [String],
            default: []
        },
        image: {
            type: String
        },
        avgRating: {
            type: Number,
            default: 0
        },
        isOpen: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);