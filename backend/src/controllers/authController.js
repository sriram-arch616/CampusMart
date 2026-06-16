const authService = require("../services/authService");
const emailService = require("../services/emailService");
const { isValidEmail, isValidPassword, isValidUsername, isValidString } = require("../utils/validators");

exports.register = async (req, res, next) => {
    const { name, username, email, password } = req.body;

    // Manual Validation
    if (!isValidString(name, 2, 100)) {
        return res.status(400).json({ success: false, message: "Invalid name. Must be 2-100 characters." });
    }
    if (!isValidUsername(username)) {
        return res.status(400).json({ success: false, message: "Invalid username. 3-30 characters, alphanumeric or underscores." });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character." 
        });
    }

    try {
        const message = await authService.registerUser(
            name,
            username,
            email,
            password
        );

        // Generate and send verification OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await authService.saveEmailVerificationOTP(email, otp);
        await emailService.sendOTP(email, otp, "verification");

        res.json({ success: true, requireOTP: true, message: "OTP sent to your email", email });
    } catch (error) {
        // Customize error status for specific cases if needed
        if (error.message === "User already exists") {
            return res.status(409).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    try {
        await authService.verifyEmailOTP(email, otp);
        await authService.markUserVerified(email);
        res.json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: typeof error === "string" ? error : error.message });
    }
};

exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    try {
        const { token, user } = await authService.loginUser(username, password);

        // Set HttpOnly, Secure, SameSite cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3600000 // 1 hour in ms
        });

        res.json({
            success: true,
            message: "Login successful",
            user
        });
    } catch (error) {
        // For security, login errors should generally return 401
        res.status(401).json({ success: false, message: typeof error === "string" ? error : "Invalid credentials" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    res.json({ success: true, message: "Logged out successfully" });
};

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
    }
    
    try {
        await authService.findUserByEmail(email);
        
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await authService.saveOTP(email, otp);
        await emailService.sendOTP(email, otp);
        
        res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        if (error === "User not found") {
            // Generalize message down the line, but for ease of use here we tell user
            return res.status(404).json({ success: false, message: error });
        }
        res.status(500).json({ success: false, message: typeof error === "string" ? error : error.message });
    }
};

exports.resetPassword = async (req, res, next) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
    }
    if (!isValidPassword(newPassword)) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character." 
        });
    }

    try {
        await authService.verifyOTP(email, otp);
        await authService.updatePassword(email, newPassword);
        
        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: typeof error === "string" ? error : error.message });
    }
};