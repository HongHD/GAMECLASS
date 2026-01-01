const pool = require('./db');

async function initDB() {
    try {
        const conn = await pool.getConnection();
        try {
            console.log('Checking USER table PK...');
            const [indexes] = await conn.query('SHOW INDEX FROM USER WHERE Key_name = "PRIMARY"');
            if (indexes.length === 0) {
                console.log('Adding PRIMARY KEY to USER(ID)...');
                await conn.query('ALTER TABLE USER ADD PRIMARY KEY (ID)');
                console.log('PRIMARY KEY added.');
            } else {
                console.log('USER table already has PRIMARY KEY.');
            }

            console.log('Creating QUIZ_HISTORY table...');
            await conn.query('DROP TABLE IF EXISTS QUIZ_HISTORY');

            await conn.query(`
                CREATE TABLE QUIZ_HISTORY (
                    ID VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NOT NULL,
                    QUIZ_NO INT(11) NOT NULL,
                    SOLVED_DATE DATETIME NOT NULL,
                    PRIMARY KEY (ID, QUIZ_NO),
                    FOREIGN KEY (ID) REFERENCES USER(ID),
                    FOREIGN KEY (QUIZ_NO) REFERENCES QUIZ(NO)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
            `);
            console.log('QUIZ_HISTORY table created successfully.');

            console.log('Creating SYSTEM_SETTINGS table...');
            await conn.query(`
                CREATE TABLE IF NOT EXISTS SYSTEM_SETTINGS (
                    \`KEY\` VARCHAR(50) NOT NULL PRIMARY KEY,
                    \`VALUE\` VARCHAR(255)
                )
            `);
            // Insert default if not exists
            await conn.query(`
                INSERT IGNORE INTO SYSTEM_SETTINGS (\`KEY\`, \`VALUE\`) VALUES ('GAME_STARTED', 'N')
            `);
            console.log('SYSTEM_SETTINGS table created successfully.');
        } catch (err) {
            console.error('Error initializing DB:', err);
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        process.exit();
    }
}

initDB();
