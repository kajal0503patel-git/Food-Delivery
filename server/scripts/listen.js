const { io } = require('socket.io-client');

const token = process.argv[2];
if (!token) {
    console.log('Use: node scripts/listen.js TOKEN');
    process.exit(1);
}

const socket = io('http://localhost:5000', { auth: { token } });

socket.on('connected', (d) => console.log('Connected as', d));
socket.on('connect_error', (e) => console.log('Error:', e.message));
['order:new', 'order:status', 'order:cancelled'].forEach((ev) =>
    socket.on(ev, (d) => console.log(ev, d))
);