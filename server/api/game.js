// game.js - Express router for game start synchronization
const express = require('express');
const router = express.Router();
const pool = require('../db');
const sse = require('../sse');

// Helper to send events to all connected clients
function broadcast(event, data, gameCode) {
    sse.broadcast(event, data, gameCode);
}

// GET /api/game/events - SSE endpoint
router.get('/events', async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Determine Game Code
    let gameCode = null;
    if (req.session.user) {
        gameCode = req.session.user.gameCode;
    } else if (req.session.admin) {
        // Admin might want to listen too?
        const adminId = req.session.admin.id;
        try {
            const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
            if (rows.length > 0) gameCode = rows[0].GAME_CODE;
        } catch (err) {
            console.error('Error fetching admin game code for SSE:', err);
        }
    }

    // Add client to list
    const clientId = sse.addClient(res, gameCode);
    // console.log(`SSE Client connected. Total clients: ${sse.clients.length}`);

    // Remove client on close
    // sse.js handles removal on 'close' event inside addClient, 
    // but express might need explicit handling if sse.js doesn't cover all cases.
    // sse.js implementation: res.on('close', ...) - this is sufficient.
});

// POST /api/game/start - Admin triggers game start
router.post('/start', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const adminId = req.session.admin.id;

    try {
        // Update DB
        await pool.query('UPDATE USER_MNG SET GAME_STARTED = "Y" WHERE ID = ?', [adminId]);

        // Get Game Code to broadcast
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            // Broadcast event
            broadcast('start', { message: 'Game Started' }, gameCode);
            res.json({ message: 'Game started successfully' });
        } else {
            res.status(400).json({ message: 'No active game code found' });
        }
    } catch (err) {
        console.error('Game start error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/game/stop - Admin triggers game stop
router.post('/stop', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const adminId = req.session.admin.id;

    try {
        // Update DB
        await pool.query('UPDATE USER_MNG SET GAME_STARTED = "N" WHERE ID = ?', [adminId]);

        // Get Game Code to broadcast
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            // Broadcast event
            broadcast('stop', { message: 'Game Stopped' }, gameCode);
            res.json({ message: 'Game stopped successfully' });
        } else {
            res.status(400).json({ message: 'No active game code found' });
        }
    } catch (err) {
        console.error('Game stop error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/game/status - Check current status
router.get('/status', async (req, res) => {
    let isStarted = false;
    let gameCode = null;

    try {
        if (req.session.user) {
            gameCode = req.session.user.gameCode;
            if (gameCode) {
                const [rows] = await pool.query('SELECT GAME_STARTED FROM USER_MNG WHERE GAME_CODE = ?', [gameCode]);
                if (rows.length > 0) {
                    isStarted = rows[0].GAME_STARTED === 'Y';
                }
            }
        } else if (req.session.admin) {
            const adminId = req.session.admin.id;
            const [rows] = await pool.query('SELECT GAME_STARTED FROM USER_MNG WHERE ID = ?', [adminId]);
            if (rows.length > 0) {
                isStarted = rows[0].GAME_STARTED === 'Y';
            }
        }

        res.json({ isStarted });
    } catch (err) {
        console.error('Game status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Speed Game Endpoints ---

// POST /api/game/speed/enter - Admin enters Speed Game page (Broadcast event)
router.post('/speed/enter', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const adminId = req.session.admin.id;
    try {
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            broadcast('SPEED_GAME_ENTER', { message: 'Enter Speed Game' }, gameCode);
            res.json({ message: 'Speed Game Enter event broadcasted' });
        } else {
            res.status(400).json({ message: 'No active game code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/game/mission/enter - Admin enters Mission Game page (Broadcast event)
router.post('/mission/enter', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const adminId = req.session.admin.id;
    try {
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            broadcast('MISSION_GAME_ENTER', { message: 'Enter Mission Game' }, gameCode);
            res.json({ message: 'Mission Game Enter event broadcasted' });
        } else {
            res.status(400).json({ message: 'No active game code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/game/speed/start - Start Speed Game (Broadcast event)
router.post('/speed/start', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const adminId = req.session.admin.id;
    try {
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            // Optional: Reset previous results for this game code automatically?
            // For now, let's just broadcast start.
            broadcast('SPEED_GAME_START', { message: 'Speed Game Started' }, gameCode);
            res.json({ message: 'Speed Game started' });
        } else {
            res.status(400).json({ message: 'No active game code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/game/speed/buzz - User clicks buzzer
router.post('/speed/buzz', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id, gameCode } = req.session.user;

    try {
        // Check if user already buzzed
        const [existing] = await pool.query('SELECT * FROM SPEED_GAME_RESULT WHERE ID = ? AND GAME_CODE = ?', [id, gameCode]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already buzzed', rank: existing[0].RANK_NUM });
        }

        // Get current max rank
        const [rankRows] = await pool.query('SELECT MAX(RANK_NUM) as maxRank FROM SPEED_GAME_RESULT WHERE GAME_CODE = ?', [gameCode]);
        const nextRank = (rankRows[0].maxRank || 0) + 1;

        // Insert result
        await pool.query('INSERT INTO SPEED_GAME_RESULT (ID, GAME_CODE, CLICK_TIME, RANK_NUM) VALUES (?, ?, NOW(3), ?)', [id, gameCode, nextRank]);

        // Broadcast update to admin (and users if needed)
        broadcast('SPEED_GAME_RANKING_UPDATE', { message: 'Ranking Updated' }, gameCode);

        res.json({ message: 'Buzzed!', rank: nextRank });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/game/speed/reset - Reset Speed Game
router.post('/speed/reset', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const adminId = req.session.admin.id;
    try {
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            await pool.query('DELETE FROM SPEED_GAME_RESULT WHERE GAME_CODE = ?', [gameCode]);
            broadcast('SPEED_GAME_RESET', { message: 'Speed Game Reset' }, gameCode);
            res.json({ message: 'Speed Game reset' });
        } else {
            res.status(400).json({ message: 'No active game code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/game/speed/ranking - Get Ranking
router.get('/speed/ranking', async (req, res) => {
    // Admin or User can check ranking? Let's allow both if they have the code.
    let gameCode = null;
    if (req.session.admin) {
        const adminId = req.session.admin.id;
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        if (rows.length > 0) gameCode = rows[0].GAME_CODE;
    } else if (req.session.user) {
        gameCode = req.session.user.gameCode;
    }

    if (!gameCode) return res.status(400).json({ message: 'No game code' });

    try {
        // Join with USER table to get names/details if needed. 
        // Assuming USER table has ID.
        const query = `
            SELECT r.RANK_NUM, r.ID, r.CLICK_TIME 
            FROM SPEED_GAME_RESULT r
            WHERE r.GAME_CODE = ?
            ORDER BY r.RANK_NUM ASC
        `;
        const [rows] = await pool.query(query, [gameCode]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
