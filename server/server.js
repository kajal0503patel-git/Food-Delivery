const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/services/socket.service');

const PORT = process.env.PORT || 5000;

(async () => {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();