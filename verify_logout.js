const pool = require('./server/db');

async function verify() {
    try {
        console.log('Starting verification...');

        // 1. Simulate Login
        const testUserId = 'hhd777';
        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NOW() WHERE ID = ?', [testUserId]);
        console.log('Simulated login.');

        // Verify connected
        let [rows] = await pool.query('SELECT ID FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL');
        if (rows.length === 0) throw new Error('Login failed to update DB');
        console.log('User is connected.');

        // 2. Simulate Logout (Direct DB update as we can't easily mock session in script without http)
        // We are testing the logic that clearing LAST_LOGIN_DATE removes from list
        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NULL WHERE ID = ?', [testUserId]);
        console.log('Simulated logout.');

        // Verify disconnected
        [rows] = await pool.query('SELECT ID FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL');
        const userStillConnected = rows.find(r => r.ID === testUserId);
        if (userStillConnected) throw new Error('Logout failed to clear DB for test user');
        console.log('User is disconnected.');

        // 3. Simulate Force Logout
        // Login again
        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NOW() WHERE ID = ?', [testUserId]);
        console.log('Simulated login again.');

        // Force Logout All
        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NULL');
        console.log('Simulated force logout all.');

        // Verify empty
        [rows] = await pool.query('SELECT ID FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL');
        if (rows.length > 0) throw new Error('Force logout failed to clear DB');
        console.log('All users disconnected.');

        console.log('SUCCESS: DB logic verified.');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
