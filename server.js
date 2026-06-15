require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");
const socketConfig = require("./src/config/socket");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production"
            ? process.env.CLIENT_URL || true
            : "*",
        methods: ["GET", "POST"]
    }
});

// Initialize Socket.io logic
socketConfig(io);

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} [${process.env.NODE_ENV || "development"}]`);
});