// async controllers ke errors ko error middleware tak pahunchata hai
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);