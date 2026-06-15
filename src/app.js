const express = require("express");
const authRoutes = require("./routes/authRoutes");
const { apiRouter: productRoutes, viewRouter: productViewRoutes } = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { apiRouter: userRoutes, viewRouter: userViewRoutes } = require("./routes/userRoutes");
const supportRoutes = require("./routes/supportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public", { extensions: ["html"] }));

app.use("/", authRoutes);
app.use("/", productViewRoutes);
app.use("/", userViewRoutes);

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