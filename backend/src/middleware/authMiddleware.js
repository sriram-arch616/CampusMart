const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers["authorization"];

    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token missing" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        if (err) {

            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired" });
            }

            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = decoded;

        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ success: false, message: "Forbidden: Admin access required." });
    }
};

module.exports = { authenticateToken, isAdmin };