// db.js - MySQL connection pool for MariaDB
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'APP',
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
});

module.exports = pool;
