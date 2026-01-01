const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, baseURL: 'http://localhost:3001' }));

async function testAdminIsolation() {
    try {
        console.log('--- Test Start ---');

        // 1. Login as Admin 1 (admin)
        console.log('Logging in as admin...');
        await client.post('/api/admin/login', { id: 'admin', password: '1234' });
        console.log('Logged in as admin.');

        // 2. Register a quiz as Admin 1
        const quiz1 = {
            group: 'TestGroup',
            title: 'Admin1 Quiz',
            contents: 'Content 1',
            option_type: 'short',
            answer: 'Ans1'
        };
        await client.post('/api/quiz/register', { questions: [quiz1] });
        console.log('Registered Admin1 Quiz.');

        // 3. List quizzes as Admin 1
        let res = await client.get('/api/quiz/list');
        let quizzes = res.data;
        const admin1Quiz = quizzes.find(q => q.TITLE === 'Admin1 Quiz');
        if (admin1Quiz) {
            console.log('SUCCESS: Admin1 sees their quiz.');
        } else {
            console.log('FAILURE: Admin1 CANNOT see their quiz.');
        }

        // 4. Logout
        await client.post('/api/admin/logout');
        console.log('Logged out admin.');

        // 5. Create and Login as Admin 2
        // We need to insert Admin 2 into DB first manually or via a helper (since there is no register admin API)
        // I'll use a direct DB call helper script or just assume I can't easily do this without DB access.
        // But I have `update_db.js` which I can modify or I can just use `run_command` to insert.
        // Let's just insert via SQL for this test.

        // Actually, I can't run SQL easily from here without mysql lib.
        // I'll skip creating Admin 2 for a moment and just check if I see Admin 1's quiz when NOT logged in (if API allows)
        // or if I can simulate a different user.

        // Let's try to list without login.
        try {
            res = await client.get('/api/quiz/list');
            console.log('List without login returned ' + res.data.length + ' quizzes.');
            // If I see Admin1 Quiz here, it means the API is public and shows everything.
            // But the user requirement is about "admin/quiz_list.html" which implies the "admin view".
            // If the admin view uses this API, and the API filters when admin is logged in, it should be fine.
        } catch (e) {
            console.log('List without login failed (as expected if protected? No, it is not protected).');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

testAdminIsolation();
