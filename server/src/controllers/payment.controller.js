const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createRazorpayOrder, verifySignature } = require('../services/payment.service');

// POST /api/payments/create   body: { orderId }
exports.createPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
        throw new AppError('orderId is required');
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    if (order.paymentMethod !== 'online') {
        throw new AppError('This order is not an online payment order');
    }
    if (order.paymentStatus === 'paid') {
        throw new AppError('This order is already paid');
    }
    if (['Cancelled', 'Rejected'].includes(order.status)) {
        throw new AppError('This order is not active');
    }

    // pehle se bana hua pending payment ho to wahi dobara do
    let payment = await Payment.findOne({ order: order._id, status: 'created' });
    if (!payment) {
        const rzpOrder = await createRazorpayOrder(order.totalAmount, order._id);
        payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            amount: order.totalAmount,
            currency: rzpOrder.currency,
            razorpayOrderId: rzpOrder.id,
        });
    }

    res.status(201).json({
        success: true,
        payment: {
            razorpayOrderId: payment.razorpayOrderId,
            amount: Math.round(payment.amount * 100), // paise
            currency: payment.currency,
            keyId: process.env.RAZORPAY_KEY_ID, // sirf Key Id, secret kabhi nahi
        },
    });
});

// POST /api/payments/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError('razorpay_order_id, razorpay_payment_id and razorpay_signature are required');
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    // dobara verify bheja to bhi sahi jawab
    if (payment.status === 'paid') {
        return res.json({
            success: true,
            message: 'Payment already verified'
        });
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        payment.status = 'failed';
        await payment.save();
        throw new AppError('Payment verification failed', 400);
    }

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });

    res.json({
        success: true,
        message: 'Payment verified',
        orderId: payment.order
    });
});