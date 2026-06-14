const rateLimit = require("express-rate-limit");

// 1. Strict rate limiter for authentication endpoints (login, register, reset-password, verify-email)
// 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: "Too many login/registration attempts from this IP. Please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the legacy `X-RateLimit-*` headers
});

// 2. Strict rate limiter for support ticket submission
// 5 submissions per hour per IP
const supportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        message: "Too many support requests submitted. Please try again after an hour."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. General API rate limiter for overall API resource usage (/api/*)
// 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        success: false,
        message: "Too many API requests from this IP. Please slow down."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    supportLimiter,
    apiLimiter
};
