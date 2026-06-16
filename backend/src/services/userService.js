const db = require("../config/db");

exports.getUserProfile = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, name, username, email, mobile_number, student_type, hostel, year_of_study, course, profile_pic, is_verified 
            FROM users 
            WHERE id = ?
        `;
        db.query(sql, [userId], (err, results) => {
            if (err) return reject(new Error("Error fetching user profile: " + err.message));
            if (results.length === 0) return reject(new Error("User not found"));
            resolve(results[0]);
        });
    });
};

exports.updateUserProfile = (userId, profileData) => {
    return new Promise((resolve, reject) => {
        // Map of allowed fields to their values in profileData
        const allowedFields = [
            "mobile_number",
            "student_type",
            "hostel",
            "year_of_study",
            "course",
            "profile_pic"
        ];

        let setClauses = [];
        let params = [];

        allowedFields.forEach(field => {
            if (profileData[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                params.push(profileData[field]);
            }
        });

        if (setClauses.length === 0) {
            return resolve("No changes to update");
        }

        const sql = `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`;
        params.push(userId);

        db.query(sql, params, (err, result) => {
            if (err) return reject(new Error("Error updating user profile: " + err.message));
            resolve("Profile updated successfully");
        });
    });
};

exports.getPublicProfile = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, name, username, student_type, hostel, year_of_study, course, profile_pic, is_verified, created_at 
            FROM users 
            WHERE id = ?
        `;
        db.query(sql, [userId], (err, results) => {
            if (err) return reject(new Error("Error fetching public profile: " + err.message));
            if (results.length === 0) return reject(new Error("User not found"));
            resolve(results[0]);
        });
    });
};

exports.searchUsers = (username, page = 1, limit = 10) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;
        const countSql = "SELECT COUNT(*) as total FROM users WHERE LOWER(username) LIKE LOWER(?) AND role != 'admin'";
        
        db.query(countSql, [`%${username}%`], (err, countResult) => {
            if (err) return reject(new Error("Error counting users: " + err.message));
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit) || 1;
            
            const sql = "SELECT id, name, username, email, role, created_at FROM users WHERE LOWER(username) LIKE LOWER(?) AND role != 'admin' ORDER BY created_at DESC LIMIT ? OFFSET ?";
            db.query(sql, [`%${username}%`, limit, offset], (err, results) => {
                if (err) return reject(new Error("Error searching users: " + err.message));
                resolve({
                    users: results,
                    total: total,
                    totalPages: totalPages,
                    currentPage: parseInt(page)
                });
            });
        });
    });
};

exports.deleteUser = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM users WHERE id = ? AND role != 'admin'";
        db.query(sql, [userId], (err, result) => {
            if (err) return reject(new Error("Error deleting user: " + err.message));
            if (result.affectedRows === 0) return reject(new Error("User not found or cannot delete admin"));
            resolve("User deleted successfully");
        });
    });
};

exports.getStats = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM products) as totalProducts,
                (SELECT COUNT(*) FROM support_messages WHERE status = 'pending') as pendingSupport
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(new Error("Error fetching stats: " + err.message));
            resolve(results[0]);
        });
    });
};
