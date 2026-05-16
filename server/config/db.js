const mysql = require('mysql2/promise');
require('dotenv').config();

// 🚨 FIX: Pass the single MYSQL_URI directly to the pool
const db = mysql.createPool(process.env.MYSQL_URI);

module.exports = db;