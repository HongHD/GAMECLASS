const pool = require('./server/db');

async function verify() {
    try {
        console.log('Starting verification...');

        // 1. Simulate Login (Update LAST_LOGIN_DATE)
        const testUserId = 'hhd777'; // Existing user from db.sql
        console.log(`Simulating login for user: ${testUserId}`);

        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NOW() WHERE ID = ?', [testUserId]);
        console.log('Updated LAST_LOGIN_DATE.');

        // 2. Fetch Connected Users (Simulate API logic)
        console.log('Fetching connected users...');
        const [rows] = await pool.query('SELECT ID, LAST_LOGIN_DATE FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL ORDER BY LAST_LOGIN_DATE ASC');

        console.log('Connected Users:', rows);

        // 3. Verify
        const userFound = rows.find(r => r.ID === testUserId);
        if (userFound) {
            console.log('SUCCESS: User found in connected users list.');
            console.log(`Last Login: ${userFound.LAST_LOGIN_DATE}`);
        } else {
            console.error('FAILURE: User not found in list.');
            process.exit(1);
        }

        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
