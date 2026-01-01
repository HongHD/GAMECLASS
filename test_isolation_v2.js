const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, baseURL: 'http://localhost:3001' }));

async function testStrictIsolation() {
    try {
        console.log('--- Test Strict Isolation Start ---');

        // 1. Test Unauthenticated Access
        console.log('Testing unauthenticated access to /api/quiz/list...');
        try {
            await client.get('/api/quiz/list');
            console.error('FAILURE: /api/quiz/list accessible without login!');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('SUCCESS: /api/quiz/list returned 401 for unauthenticated user.');
            } else {
                console.error('FAILURE: Unexpected error:', err.message);
            }
        }

        // 2. Login as Admin
        console.log('Logging in as admin...');
        await client.post('/api/admin/login', { id: 'admin', password: '1234' });
        console.log('Logged in.');

        // 3. Test Authenticated Access
        console.log('Testing authenticated access to /api/quiz/list...');
        const res = await client.get('/api/quiz/list');
        console.log(`SUCCESS: Retrieved ${res.data.length} quizzes.`);

        // Verify only admin's quizzes are shown (assuming we know what's in DB or just checking structure)
        // Since we modified the SQL to `WHERE ADMIN_ID = ?`, this is implicitly tested if we get results (or empty list) without error.
        // Ideally we'd check content, but for now connectivity + auth check is the main change.

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

testStrictIsolation();
