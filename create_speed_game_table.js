const pool = require('./server/db');

async function createSpeedGameTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS SPEED_GAME_RESULT (
            ID VARCHAR(50) NOT NULL,
            GAME_CODE VARCHAR(50) NOT NULL,
            CLICK_TIME DATETIME(3) NOT NULL,
            RANK_NUM INT NOT NULL,
            PRIMARY KEY (ID, GAME_CODE),
            FOREIGN KEY (ID) REFERENCES USER(ID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
    `;

    try {
        const connection = await pool.getConnection();
        await connection.query(createTableQuery);
        console.log('SPEED_GAME_RESULT table created successfully.');
        connection.release();
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
}

createSpeedGameTable();
