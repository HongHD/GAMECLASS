const mysql = require('mysql2/promise');
// require('dotenv').config();

const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: 'root', // Assuming default from db.sql comments or common setup
    database: 'app',
    multipleStatements: true
};

async function updateDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const sql = `
            CREATE TABLE IF NOT EXISTS \`USER_MNG\` (
                \`ID\` varchar(50) NOT NULL,
                \`PASSWORD\` varchar(50) DEFAULT NULL,
                \`NAME\` varchar(50) DEFAULT NULL,
                \`CREATE_DATE\` datetime DEFAULT NULL,
                \`USE_YN\` char(1) DEFAULT 'Y',
                PRIMARY KEY (\`ID\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

            -- Check if ADMIN_ID column exists in quiz table
            SELECT count(*) INTO @exist FROM information_schema.columns 
            WHERE table_schema = 'app' AND table_name = 'quiz' AND column_name = 'ADMIN_ID';

            -- Add ADMIN_ID if it doesn't exist (using a stored procedure approach or just try/catch in node)
            -- Simpler: just try to add it, if it fails it might already exist. 
            -- But better to check. 
            -- Actually, I'll just run the ALTER TABLE and catch error if it exists.
        `;

        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`USER_MNG\` (
                \`ID\` varchar(50) NOT NULL,
                \`PASSWORD\` varchar(50) DEFAULT NULL,
                \`NAME\` varchar(50) DEFAULT NULL,
                \`CREATE_DATE\` datetime DEFAULT NULL,
                \`USE_YN\` char(1) DEFAULT 'Y',
                PRIMARY KEY (\`ID\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
        `);
        console.log('USER_MNG table created or already exists.');

        try {
            await connection.query(`ALTER TABLE \`quiz\` ADD COLUMN \`ADMIN_ID\` varchar(50) DEFAULT NULL`);
            console.log('Added ADMIN_ID column to quiz table.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ADMIN_ID column already exists.');
            } else {
                throw err;
            }
        }

        try {
            await connection.query(`ALTER TABLE \`quiz\` ADD CONSTRAINT \`fk_quiz_admin\` FOREIGN KEY (\`ADMIN_ID\`) REFERENCES \`USER_MNG\` (\`ID\`)`);
            console.log('Added foreign key constraint.');
        } catch (err) {
            if (err.code === 'ER_DUP_KEY' || err.code === 'ER_CANT_CREATE_TABLE') {
                console.log('Foreign key likely already exists or cannot be created (maybe index missing?). Ignoring.');
            } else {
                // Often throws if constraint name exists
                console.log('Error adding foreign key (might already exist):', err.message);
            }
        }

        // Insert a default admin user for testing
        const [rows] = await connection.query('SELECT * FROM `USER_MNG` WHERE ID = ?', ['admin']);
        if (rows.length === 0) {
            await connection.query('INSERT INTO `USER_MNG` (ID, PASSWORD, NAME, CREATE_DATE, USE_YN) VALUES (?, ?, ?, NOW(), ?)', ['admin', '1234', 'Administrator', 'Y']);
            console.log('Default admin user created (ID: admin, PW: 1234).');
        }

    } catch (err) {
        console.error('Database update failed:', err);
    } finally {
        if (connection) connection.end();
    }
}

updateDb();
