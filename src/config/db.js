const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function testConnection() {
    try {
        const [rows] = await pool.execute('SELECT 1');
        console.log('Database connection successful');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

testConnection();

module.exports = pool;
