const pool = require('./server/db');

async function checkMission02() {
    try {
        const [rows] = await pool.query('SELECT * FROM QUIZ WHERE `GROUP` = ?', ['Mission02']);
        console.log(`Count: ${rows.length}`);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkMission02();
