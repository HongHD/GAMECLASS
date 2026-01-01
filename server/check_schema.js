const pool = require('./db');

async function checkSchema() {
    try {
        const [rows] = await pool.query('SHOW INDEX FROM `USER`');
        console.log('USER Indexes:', rows);
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
