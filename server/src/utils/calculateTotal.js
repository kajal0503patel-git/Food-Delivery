// items: [{ price, quantity }] se total nikalta hai
module.exports = (items) => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return Math.round(total * 100) / 100;
};