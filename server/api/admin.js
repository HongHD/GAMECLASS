// admin.js - Express router for admin login
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    try {
        const sql = 'SELECT * FROM `USER_MNG` WHERE ID = ? AND PASSWORD = ? AND USE_YN = \'Y\'';
        const [rows] = await pool.query(sql, [id, password]);

        if (rows.length > 0) {
            // Set session
            req.session.admin = {
                id: rows[0].ID,
                name: rows[0].NAME
            };

            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ message: 'Session error' });
                }
                res.json({ message: 'Login successful', admin: req.session.admin });
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    if (req.session.admin) {
        req.session.destroy(err => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ message: 'Logout error' });
            }
            res.json({ message: 'Logged out' });
        });
    } else {
        res.json({ message: 'Already logged out' });
    }
});

// GET /api/admin/me
router.get('/me', (req, res) => {
    if (req.session.admin) {
        res.json({ admin: req.session.admin });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

// POST /api/admin/generate-code
// POST /api/admin/generate-code
router.post('/generate-code', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        // Generate random 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const adminId = req.session.admin.id;

        // Update USER_MNG table
        await pool.query('UPDATE USER_MNG SET GAME_CODE = ? WHERE ID = ?', [code, adminId]);

        res.json({ code });
    } catch (err) {
        console.error('Generate code error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/code
router.get('/code', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        const adminId = req.session.admin.id;
        console.log('GET /code for admin:', adminId);
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);

        if (rows.length > 0 && rows[0].GAME_CODE) {
            res.json({ code: rows[0].GAME_CODE });
        } else {
            res.json({ code: null });
        }
    } catch (err) {
        console.error('Get code error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
