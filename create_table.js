const pool = require('./server/db');

async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS \`mission_complete\` (
              \`ID\` varchar(50) NOT NULL,
              \`COMPLETE_DATE\` datetime NOT NULL,
              PRIMARY KEY (\`ID\`),
              CONSTRAINT \`mission_complete_ibfk_1\` FOREIGN KEY (\`ID\`) REFERENCES \`user\` (\`ID\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
        `;
        await pool.query(sql);
        console.log('Table MISSION_COMPLETE created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
}

createTable();
