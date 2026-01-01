// mission.js - Express router for mission completion and ranking
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Clients waiting for ranking updates
// Removed local clients array in favor of shared sse.js
const sse = require('../sse');

// Helper to send events to all connected clients
async function broadcastRanking(gameCode) {
    try {
        const ranking = await getRankingData(gameCode);
        sse.broadcast('ranking', ranking, gameCode);
    } catch (err) {
        console.error('Broadcast ranking error:', err);
    }
}

async function getRankingData(gameCode) {
    // Filter by GAME_CODE
    const sql = `
        SELECT mc.ID, mc.COMPLETE_DATE, u.TEL 
        FROM MISSION_COMPLETE mc
        JOIN USER u ON mc.ID = u.ID
        WHERE u.GAME_CODE = ?
        ORDER BY mc.COMPLETE_DATE ASC
    `;
    const [rows] = await pool.query(sql, [gameCode]);
    return rows;
}

// GET /api/mission/events - SSE endpoint
router.get('/events', async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Determine Game Code
    // If Admin: fetch from USER_MNG
    // If User: fetch from Session (not implemented here yet, but assuming Admin for monitoring)

    let gameCode = null;
    if (req.session.admin) {
        const adminId = req.session.admin.id;
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        if (rows.length > 0) gameCode = rows[0].GAME_CODE;
    } else if (req.session.user) {
        // If user connects to this endpoint (unlikely, but possible)
        gameCode = req.session.user.gameCode;
    }

    // Add client to shared list
    sse.addClient(res, gameCode);

    if (gameCode) {
        // Send initial ranking
        getRankingData(gameCode).then(ranking => {
            res.write(`event: ranking\n`);
            res.write(`data: ${JSON.stringify(ranking)}\n\n`);
        });

        // Send initial connected users
        pool.query('SELECT ID FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL AND GAME_CODE = ? ORDER BY LAST_LOGIN_DATE ASC', [gameCode])
            .then(([rows]) => {
                const users = rows.map(r => r.ID);
                res.write(`event: connected_users\n`);
                res.write(`data: ${JSON.stringify(users)}\n\n`);
            })
            .catch(err => console.error('Initial connected users error:', err));
    }
});

// POST /api/mission/complete - Record mission completion
router.post('/complete', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.session.user.id;
    const gameCode = req.session.user.gameCode;

    if (!gameCode) {
        return res.status(400).json({ message: 'No game code found.' });
    }

    try {
        // 1. Verify all quizzes are solved
        // Get total quiz count (filtered by Admin ID)
        const [adminRows] = await pool.query('SELECT ID FROM USER_MNG WHERE GAME_CODE = ?', [gameCode]);
        if (adminRows.length === 0) return res.status(404).json({ message: 'Invalid Game Code' });
        const adminId = adminRows[0].ID;

        const [quizCountRows] = await pool.query('SELECT COUNT(*) as count FROM QUIZ WHERE ADMIN_ID = ?', [adminId]);
        const totalQuizzes = quizCountRows[0].count;

        // Get user solved count
        // We should ensure we only count quizzes that belong to this admin? 
        // QUIZ_HISTORY just links ID and QUIZ_NO. 
        // If user solved quizzes from other sessions, they might be counted?
        // Ideally QUIZ_HISTORY should be cleared on new session or we filter by joining QUIZ table.
        const [solvedCountRows] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM QUIZ_HISTORY qh
            JOIN QUIZ q ON qh.QUIZ_NO = q.NO
            WHERE qh.ID = ? AND q.ADMIN_ID = ?
        `, [userId, adminId]);
        const solvedQuizzes = solvedCountRows[0].count;

        if (solvedQuizzes < totalQuizzes) {
            return res.status(400).json({ message: 'Not all quizzes are solved yet.' });
        }

        // 2. Insert into MISSION_COMPLETE
        // Use INSERT IGNORE to prevent duplicates if user clicks multiple times
        await pool.execute(
            'INSERT IGNORE INTO MISSION_COMPLETE (ID, COMPLETE_DATE) VALUES (?, NOW())',
            [userId]
        );

        // 3. Broadcast update
        await broadcastRanking(gameCode);

        res.json({ message: 'Mission Complete recorded!' });
    } catch (err) {
        console.error('Mission complete error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/mission/ranking - Get current ranking (JSON)
router.get('/ranking', async (req, res) => {
    let gameCode = null;
    if (req.session.admin) {
        const adminId = req.session.admin.id;
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        if (rows.length > 0) gameCode = rows[0].GAME_CODE;
    } else if (req.session.user) {
        gameCode = req.session.user.gameCode;
    }

    if (!gameCode) return res.json([]);

    try {
        const ranking = await getRankingData(gameCode);
        res.json(ranking);
    } catch (err) {
        console.error('Get ranking error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
