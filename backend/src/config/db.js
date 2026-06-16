const mysql = require("mysql2");

const dbConfig = {
    host: process.env.DB_HOST ? process.env.DB_HOST.trim() : "",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
    user: process.env.DB_USER ? process.env.DB_USER.trim() : "",
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : "",
    database: process.env.DB_NAME ? process.env.DB_NAME.trim() : "",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
};

if (process.env.DB_SSL !== "false") {
    dbConfig.ssl = {
        minVersion: "TLSv1.2",
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ? false : true
    };
}

const db = mysql.createPool(dbConfig);

// Test the connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.code, err.message);
    } else {
        console.log("MySQL Connected ✅");
        connection.release();
    }
});

module.exports = db;