require('dotenv').config();
const crypto = require('crypto');

const [orderId, paymentId = 'pay_test1234567890'] = process.argv.slice(2);
if (!orderId) {
    console.log('Use: node scripts/fakeSignature.js order_XXXXXXXX');
    process.exit(1);
}

const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

console.log(JSON.stringify(
    { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature },
    null, 2
));