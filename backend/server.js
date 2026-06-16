require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");
const socketConfig = require("./src/config/socket");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : "*";

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production"
            ? allowedOrigins
            : "*",
        methods: ["GET", "POST"]
    }
});

// Initialize Socket.io logic
socketConfig(io);

const logger = require("./src/utils/logger");

server.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT} [${process.env.NODE_ENV || "development"}]`);
});