const express = require("express");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { apiRouter: productRoutes } = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { apiRouter: userRoutes } = require("./routes/userRoutes");
const supportRoutes = require("./routes/supportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


const app = express();

// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true)
        : "*",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically for development
app.use("/uploads", express.static(path.join(__dirname, "../../frontend/uploads")));

app.use("/", authRoutes);

const { apiLimiter } = require("./middleware/rateLimiter");

app.use("/api", apiLimiter);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
    // Normalize: err could be a string, Error object, or anything
    const isErrorObj = err instanceof Error;
    const errMessage = isErrorObj ? err.message : (typeof err === "string" ? err : "Internal Server Error");
    const errStack = isErrorObj ? err.stack : undefined;
    const status = err.status || 500;

    // Log full error for developers in Render/Local console
    console.error("Internal Error Log:", {
        message: errMessage,
        stack: errStack || "No stack trace available",
        status: status
    });

    const clientMessage = (process.env.NODE_ENV === "production" && status === 500)
        ? "Something went wrong on our end. Please try again later."
        : errMessage;

    res.status(status).json({
        success: false,
        message: clientMessage
    });
});

module.exports = app;