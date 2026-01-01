const pool = require('./server/db');

async function migrate() {
    try {
        console.log('Adding IMAGE_URL column to QUIZ table...');
        await pool.query("ALTER TABLE QUIZ ADD COLUMN IMAGE_URL VARCHAR(255) DEFAULT NULL");
        console.log('Migration successful');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        process.exit();
    }
}

migrate();
