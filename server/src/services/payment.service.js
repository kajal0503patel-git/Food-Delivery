const crypto = require('crypto');
const Razorpay = require('razorpay');
const AppError = require('../utils/AppError');

let client;

// keys na hon to server start hone par crash na ho, payment API par saaf error mile
const getClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new AppError('Online payment is not configured', 503);
    }
    if (!client) {
        client = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return client;
};

// amountInRupees -> Razorpay paise mein leta hai
exports.createRazorpayOrder = async (amountInRupees, receipt) => {
    try {
        return await getClient().orders.create({
            amount: Math.round(amountInRupees * 100),
            currency: 'INR',
            receipt: String(receipt).slice(0, 40),
        });
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        console.error('Razorpay error:', err.error || err.message);
        throw new AppError('Could not start the payment. Please try again', 502);
    }
};

exports.verifySignature = (razorpayOrderId, razorpayPaymentId, signature) => {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new AppError('Online payment is not configured', 503);

    }
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};