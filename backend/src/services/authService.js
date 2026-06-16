const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = (name, username, email, password) => {
    return new Promise((resolve, reject) => {

        bcrypt.hash(password, 10, (err, hashedPassword) => {

            if (err) return reject(new Error("Error hashing password: " + err.message));

            const sql =
                "INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)";

            db.query(
                sql,
                [name, username, email, hashedPassword],
                (err, result) => {

                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            return reject(new Error("User already exists"));
                        }
                        return reject(new Error("Error registering user: " + err.message));
                    }

                    resolve("User registered successfully");
                }
            );
        });
    });
};

exports.loginUser = (username, password) => {
    return new Promise((resolve, reject) => {

        const sql = "SELECT * FROM users WHERE username = ?";

        db.query(sql, [username], (err, results) => {

            if (err) return reject(new Error("Database error during login: " + err.message));

            if (results.length === 0)
                return reject("Invalid username or password");

            const user = results[0];

            bcrypt.compare(password, user.password, (err, isMatch) => {

                if (!isMatch)
                    return reject(new Error("Invalid username or password"));

                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                resolve({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    }
                });
            });
        });
    });
};

exports.saveOTP = (email, otp) => {
    return new Promise((resolve, reject) => {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const deleteSql = "DELETE FROM password_resets WHERE email = ?";
        db.query(deleteSql, [email], (err) => {
            if (err) return reject(new Error("Database error cleaning old OTPs"));

            const insertSql = "INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)";
            db.query(insertSql, [email, otp, expiresAt], (err) => {
                if (err) return reject(new Error("Database error saving OTP"));
                resolve();
            });
        });
    });
};

exports.verifyOTP = (email, otp) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM password_resets WHERE email = ? AND otp = ?";
        db.query(sql, [email, otp], (err, results) => {
            if (err) return reject(new Error("Database error verifying OTP"));

            if (results.length === 0) return reject("Invalid or expired OTP");

            const resetRecord = results[0];
            if (new Date() > new Date(resetRecord.expires_at)) {
                return reject("OTP has expired");
            }
            resolve(true);
        });
    });
};

exports.updatePassword = (email, newPassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return reject(new Error("Error hashing password"));

            const sql = "UPDATE users SET password = ? WHERE email = ?";
            db.query(sql, [hashedPassword, email], (err, result) => {
                if (err) return reject(new Error("Database error updating password"));
                if (result.affectedRows === 0) return reject("User not found");

                db.query("DELETE FROM password_resets WHERE email = ?", [email], () => {
                    resolve("Password updated successfully");
                });
            });
        });
    });
};

exports.findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email = ?";
        db.query(sql, [email], (err, results) => {
            if (err) return reject(new Error("Database error"));
            if (results.length === 0) return reject("User not found");
            resolve(results[0]);
        });
    });
};

exports.saveEmailVerificationOTP = (email, otp) => {
    return new Promise((resolve, reject) => {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
        const deleteSql = "DELETE FROM email_verifications WHERE email = ?";
        db.query(deleteSql, [email], (err) => {
            if (err) return reject(new Error("Database error cleaning old verification OTPs"));
            
            const insertSql = "INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?)";
            db.query(insertSql, [email, otp, expiresAt], (err) => {
                if (err) return reject(new Error("Database error saving verification OTP"));
                resolve();
            });
        });
    });
};

exports.verifyEmailOTP = (email, otp) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM email_verifications WHERE email = ? AND otp = ?";
        db.query(sql, [email, otp], (err, results) => {
            if (err) return reject(new Error("Database error verifying OTP"));
            if (results.length === 0) return reject("Invalid or expired OTP");
            
            const record = results[0];
            if (new Date() > new Date(record.expires_at)) {
                return reject("OTP has expired");
            }
            resolve(true);
        });
    });
};

exports.markUserVerified = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE users SET is_verified = TRUE WHERE email = ?";
        db.query(sql, [email], (err, result) => {
            if (err) return reject(new Error("Database error updating verification status"));
            db.query("DELETE FROM email_verifications WHERE email = ?", [email], () => resolve());
        });
    });
};