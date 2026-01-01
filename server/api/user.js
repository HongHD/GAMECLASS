// user.js - Express router for user login and registration
const express = require('express');
const router = express.Router();
const pool = require('../db');
const sse = require('../sse');

// Helper to get connected users
async function getConnectedUsers(gameCode) {
    if (!gameCode) return [];
    // Get users who have logged in AND have the same GAME_CODE
    // Get users who have logged in AND have the same GAME_CODE
    const sql = 'SELECT ID, TEL FROM `USER` WHERE LAST_LOGIN_DATE IS NOT NULL AND GAME_CODE = ? ORDER BY LAST_LOGIN_DATE ASC';
    const [rows] = await pool.query(sql, [gameCode]);
    return rows; // Returns [{ ID: '...', TEL: '...' }, ...]
}

async function broadcastConnectedUsers(gameCode) {
    if (!gameCode) return;
    try {
        const users = await getConnectedUsers(gameCode);
        sse.broadcast('connected_users', users, gameCode);
    } catch (err) {
        console.error('Broadcast connected users error:', err);
    }
}

// Helper to get current date string (YYYY-MM-DD HH:mm:ss)
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

// POST /api/user/register
router.post('/register', async (req, res) => {
    const { id, password, tel } = req.body;

    if (!id || !password || !tel) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Check if ID already exists
        const [existing] = await pool.query('SELECT ID FROM `USER` WHERE ID = ?', [id]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'User ID already exists' });
        }

        const sql = 'INSERT INTO `USER` (ID, PASSWORD, TEL, CREAT_DATE, MODIFY_DATE, USE_YN) VALUES (?, ?, ?, ?, ?, \'Y\')';
        const now = getCurrentDate();
        await pool.execute(sql, [id, password, tel, now, now]);

        res.json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/user/verify-code
router.post('/verify-code', async (req, res) => {
    const { gameCode } = req.body;
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    if (!gameCode) {
        return res.status(400).json({ message: 'Missing game code' });
    }

    try {
        // Check if game code exists in USER_MNG
        const [admins] = await pool.query('SELECT ID FROM USER_MNG WHERE GAME_CODE = ?', [gameCode]);
        if (admins.length === 0) {
            return res.status(404).json({ message: 'Invalid Game Code' });
        }

        // Update USER table
        const userId = req.session.user.id;
        await pool.execute('UPDATE `USER` SET GAME_CODE = ? WHERE ID = ?', [gameCode, userId]);

        // Update Session
        req.session.user.gameCode = gameCode;
        req.session.save();

        // Broadcast update to admins/users in this game code
        await broadcastConnectedUsers(gameCode);

        res.json({ message: 'Game Code Verified', gameCode });
    } catch (err) {
        console.error('Verify code error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    try {
        const sql = 'SELECT * FROM `USER` WHERE ID = ? AND PASSWORD = ? AND USE_YN = \'Y\'';
        const [rows] = await pool.query(sql, [id, password]);

        if (rows.length > 0) {
            // Update LAST_LOGIN_DATE
            await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NOW() WHERE ID = ?', [rows[0].ID]);

            // Set session
            req.session.user = {
                id: rows[0].ID,
                tel: rows[0].TEL,
                gameCode: rows[0].GAME_CODE // Load game code if exists
            };

            // Broadcast update (Only if game code exists, but we might not know it yet)
            if (rows[0].GAME_CODE) {
                await broadcastConnectedUsers(rows[0].GAME_CODE);
            }

            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ message: 'Session error' });
                }
                res.json({ message: 'Login successful', user: req.session.user });
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/user/me (Optional: to check session)
router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

// GET /api/user/connected - Get connected users list
router.get('/connected', async (req, res) => {
    try {
        let gameCode = null;
        if (req.session.admin) {
            const adminId = req.session.admin.id;
            const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
            if (rows.length > 0) gameCode = rows[0].GAME_CODE;
        } else if (req.session.user) {
            gameCode = req.session.user.gameCode;
        }

        if (!gameCode) {
            return res.json([]);
        }

        const users = await getConnectedUsers(gameCode);
        res.json(users);
    } catch (err) {
        console.error('Get connected users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/user/logout
router.post('/logout', async (req, res) => {
    if (req.session.user) {
        const userId = req.session.user.id;
        try {
            // Get Game Code before clearing
            const [userRows] = await pool.query('SELECT GAME_CODE FROM `USER` WHERE ID = ?', [userId]);
            const gameCode = userRows.length > 0 ? userRows[0].GAME_CODE : null;

            // Clear LAST_LOGIN_DATE and GAME_CODE
            await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NULL, GAME_CODE = NULL WHERE ID = ?', [userId]);

            // Destroy session
            req.session.destroy();

            // Broadcast update
            if (gameCode) {
                await broadcastConnectedUsers(gameCode);
            }

            res.json({ message: 'Logged out' });
        } catch (err) {
            console.error('Logout error:', err);
            res.status(500).json({ message: 'Server error' });
        }
    } else {
        res.json({ message: 'Already logged out' });
    }
});

// POST /api/user/force-logout
router.post('/force-logout', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const adminId = req.session.admin.id;

    try {
        // Get Admin's Game Code
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (!gameCode) {
            return res.status(400).json({ message: 'No active game code found' });
        }

        // Clear LAST_LOGIN_DATE only for users with this game code
        await pool.execute('UPDATE `USER` SET LAST_LOGIN_DATE = NULL WHERE GAME_CODE = ?', [gameCode]);
        console.log(`Force logout: Cleared users for gameCode ${gameCode}`);

        // Broadcast empty connected users list to this game code
        await broadcastConnectedUsers(gameCode);
        console.log(`Force logout: Broadcasted connected_users for gameCode ${gameCode}`);

        // Broadcast force_logout event only to clients with this game code
        sse.broadcast('force_logout', {}, gameCode);
        console.log(`Force logout: Broadcasted force_logout event for gameCode ${gameCode}`);

        res.json({ message: 'Users in your session forced to logout' });
    } catch (err) {
        console.error('Force logout error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
