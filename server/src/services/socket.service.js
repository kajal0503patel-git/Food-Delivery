const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

exports.initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL || '*' },
    });

    // connect karte waqt token check hota hai (REST jaisa hi)
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth && socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Login required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user || user.isBlocked) {
                return next(new Error('Not allowed'));
            }

            socket.user = user;
            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        // har user ka apna room, usi mein uske events aate hain
        socket.join(`user:${socket.user._id}`);
        socket.emit('connected', {
            userId: socket.user._id,
            role: socket.user.role
        });
    });

    return io;
};

// kisi ek user ko event bhejta hai (socket na chal raha ho to chupchap skip)
exports.emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};