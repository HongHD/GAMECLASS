const pool = require('./server/db');

async function checkStats() {
    try {
        const [quizCount] = await pool.query('SELECT COUNT(*) as count FROM QUIZ');
        const [historyCount] = await pool.query('SELECT COUNT(*) as count FROM QUIZ_HISTORY');
        const [usersCount] = await pool.query('SELECT COUNT(*) as count FROM USER');

        console.log('QUIZ count:', quizCount[0].count);
        console.log('QUIZ_HISTORY count:', historyCount[0].count);
        console.log('USER count:', usersCount[0].count);

        const [groups] = await pool.query('SELECT `GROUP`, COUNT(*) as count FROM QUIZ GROUP BY `GROUP`');
        console.log('Groups:', groups);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkStats();
