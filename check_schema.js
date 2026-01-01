const pool = require('./server/db');

async function checkSchema() {
    try {
        console.log('--- QUIZ TABLE ---');
        const [quizCols] = await pool.query('DESCRIBE QUIZ');
        console.log(quizCols.map(c => c.Field).join(', '));

        console.log('\n--- USER TABLE ---');
        const [userCols] = await pool.query('DESCRIBE USER');
        console.log(userCols.map(c => c.Field).join(', '));

    } catch (err) {
        console.error('Schema check failed:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
