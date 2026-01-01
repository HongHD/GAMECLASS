const pool = require('./server/db');

async function migrate() {
    try {
        console.log('Adding GAME_CODE column to USER_MNG table...');
        await pool.query('ALTER TABLE USER_MNG ADD COLUMN GAME_CODE VARCHAR(10) DEFAULT NULL');
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
