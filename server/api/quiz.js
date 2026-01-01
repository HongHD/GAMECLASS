// quiz.js - Express router for quiz registration, listing, and updating
const express = require('express');
const router = express.Router();
const pool = require('../db');
const sse = require('../sse');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper to insert a single quiz record
async function insertQuiz(question) {
    const {
        group,
        title,
        contents,
        option_type,
        answer,
        option1,
        option2,
        option3,
        option4,
        imageUrl
    } = question;

    const sql = `INSERT INTO QUIZ (\`GROUP\`, TITLE, CONTENTS, OPTION_DISTINC, OPTION1, OPTION2, OPTION3, OPTION4, ANSWER, ADMIN_ID, IMAGE_URL)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        group,
        title,
        contents,
        option_type,
        option_type === 'multiple' ? option1 : null,
        option_type === 'multiple' ? option2 : null,
        option_type === 'multiple' ? option3 : null,
        option_type === 'multiple' ? option4 : null,
        answer,
        question.adminId,
        imageUrl || null
    ];
    await pool.execute(sql, params);
}

// ... (Caching Logic remains same) ...
// --- Caching Logic ---
let quizCache = {
    list: null,      // Full list of quizzes (Heavy)
    structure: null, // Map: GroupName -> [QuizID, QuizID, ...] (Light)
    groups: null     // List of distinct groups (Light)
};

// Refresh only the lightweight structure (for dashboard)
async function refreshStructureCache() {
    try {
        // Fetch only necessary columns
        const [rows] = await pool.query('SELECT NO, `GROUP` FROM QUIZ ORDER BY `GROUP` ASC, NO ASC');

        // Build structure and groups
        const structure = {};
        const groupsSet = new Set();

        rows.forEach(q => {
            if (!structure[q.GROUP]) {
                structure[q.GROUP] = [];
            }
            structure[q.GROUP].push(q.NO);
            groupsSet.add(q.GROUP);
        });

        quizCache.structure = structure;
        quizCache.groups = Array.from(groupsSet).sort(); // Sort alphabetically

        console.log('Quiz structure cache refreshed.');
    } catch (err) {
        console.error('Failed to refresh quiz structure cache:', err);
    }
}

// Refresh the full list (for admin/details)
async function refreshListCache() {
    try {
        const [rows] = await pool.query('SELECT * FROM QUIZ ORDER BY `GROUP` ASC, NO ASC');
        quizCache.list = rows;
        console.log('Quiz list cache refreshed.');
    } catch (err) {
        console.error('Failed to refresh quiz list cache:', err);
    }
}

// Initialize structure cache on startup (List cache is lazy)
refreshStructureCache();

// POST /api/quiz/register - register multiple quizzes
// Now supports multipart/form-data for single quiz registration with image
router.post('/register', upload.single('image'), async (req, res) => {
    // Check if admin is logged in
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized: Admin login required' });
    }
    const adminId = req.session.admin.id;

    let questions = [];

    // Handle multipart/form-data (Single Quiz)
    if (req.is('multipart/form-data')) {
        const q = req.body;
        if (req.file) {
            q.imageUrl = `/uploads/${req.file.filename}`;
        }
        questions.push(q);
    } else {
        // Handle JSON (Multiple Quizzes, Legacy support if needed, but primarily for bulk)
        // Note: JSON request cannot upload files easily without Base64.
        // Assuming frontend sends FormData for new quizzes now.
        if (req.body.questions) {
            questions = req.body.questions;
        }
    }

    if (questions.length === 0) {
        return res.status(400).json({ message: 'No questions provided' });
    }

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            for (const q of questions) {
                q.adminId = adminId;
                await insertQuiz(q);
            }
            await conn.commit();
        } finally {
            conn.release();
        }

        // Invalidate/Refresh cache
        await refreshStructureCache();
        await refreshListCache();

        res.json({ message: 'Quiz registration successful' });
    } catch (err) {
        console.error('Quiz registration error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/quiz/list - retrieve all quizzes for logged-in admin
router.get('/list', async (req, res) => {
    // 1. Enforce Admin Login
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized: Admin login required' });
    }

    const adminId = req.session.admin.id;

    try {
        // 2. Direct DB Query (No Cache for Admin List to ensure isolation)
        // Only fetch quizzes belonging to this admin
        console.log('GET /list for admin:', adminId);
        const sql = 'SELECT * FROM QUIZ WHERE ADMIN_ID = ? ORDER BY `GROUP` ASC, NO ASC';
        const [rows] = await pool.query(sql, [adminId]);
        console.log('Quizzes found:', rows.length);

        res.json(rows);
    } catch (err) {
        console.error('Quiz list error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/quiz/:id - update a quiz by primary key NO
router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const {
        group,
        title,
        contents,
        option_type,
        answer,
        option1,
        option2,
        option3,
        option4,
    } = req.body;

    let imageUrl = req.body.imageUrl; // If keeping existing URL
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    // Construct SQL dynamically based on whether image is updated
    let sql = `UPDATE QUIZ SET \`GROUP\` = ?, TITLE = ?, CONTENTS = ?, OPTION_DISTINC = ?, OPTION1 = ?, OPTION2 = ?, OPTION3 = ?, OPTION4 = ?, ANSWER = ?`;
    let params = [
        group,
        title,
        contents,
        option_type,
        option_type === 'multiple' ? option1 : null,
        option_type === 'multiple' ? option2 : null,
        option_type === 'multiple' ? option3 : null,
        option_type === 'multiple' ? option4 : null,
        answer
    ];

    if (imageUrl !== undefined) {
        sql += `, IMAGE_URL = ?`;
        params.push(imageUrl);
    }

    sql += ` WHERE NO = ? AND ADMIN_ID = ?`;
    params.push(id, req.session.admin ? req.session.admin.id : null);

    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const [result] = await pool.execute(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Invalidate/Refresh cache
        await refreshStructureCache();
        await refreshListCache();

        res.json({ message: 'Quiz updated successfully' });
    } catch (err) {
        console.error('Quiz update error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/quiz/solve - Record a solved quiz
router.post('/solve', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const { quizNo } = req.body;
    const userId = req.session.user.id;

    if (!quizNo) {
        return res.status(400).json({ message: 'Missing quizNo' });
    }

    try {
        // Optimistic insertion: Try to insert directly.
        // If it fails due to duplicate key (ID, QUIZ_NO), we catch it.
        // This avoids the initial SELECT query, reducing DB round-trips by 50%.
        await pool.execute(
            'INSERT INTO QUIZ_HISTORY (ID, QUIZ_NO, SOLVED_DATE) VALUES (?, ?, NOW())',
            [userId, quizNo]
        );

        res.json({ message: 'Quiz solved recorded' });
    } catch (err) {
        // Check for duplicate entry error (MySQL/MariaDB error code 1062)
        if (err.code === 'ER_DUP_ENTRY') {
            // Already solved, return success as if it was just recorded (idempotent)
            return res.json({ message: 'Quiz solved recorded (already exists)' });
        }
        console.error('Quiz solve error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Helper to get Admin ID from Game Code
async function getAdminIdByGameCode(gameCode) {
    const [rows] = await pool.query('SELECT ID FROM USER_MNG WHERE GAME_CODE = ?', [gameCode]);
    return rows.length > 0 ? rows[0].ID : null;
}

// GET /api/quiz/dashboard - Consolidated data for main page
router.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.session.user.id;
    const gameCode = req.session.user.gameCode;

    if (!gameCode) {
        return res.status(400).json({ message: 'No game code found. Please verify code first.' });
    }

    try {
        const adminId = await getAdminIdByGameCode(gameCode);
        if (!adminId) {
            return res.status(404).json({ message: 'Invalid Game Code' });
        }

        // Fetch quizzes for this admin
        const [quizzes] = await pool.query('SELECT NO, `GROUP` FROM QUIZ WHERE ADMIN_ID = ? ORDER BY `GROUP` ASC, NO ASC', [adminId]);

        // Build structure and groups
        const structure = {};
        const groupsSet = new Set();

        quizzes.forEach(q => {
            if (!structure[q.GROUP]) {
                structure[q.GROUP] = [];
            }
            structure[q.GROUP].push(q.NO);
            groupsSet.add(q.GROUP);
        });

        const groups = Array.from(groupsSet).sort().map(g => ({ GROUP: g }));

        // Fetch user progress
        const [rows] = await pool.query(
            'SELECT QUIZ_NO FROM QUIZ_HISTORY WHERE ID = ?',
            [userId]
        );
        const solvedQuizIds = rows.map(r => r.QUIZ_NO);

        // Prepare response
        const response = {
            groups: groups,
            structure: structure,
            progress: { solvedQuizIds }
        };

        res.json(response);
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/quiz/structure - retrieve lightweight structure (Group -> IDs)
router.get('/structure', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
    const gameCode = req.session.user.gameCode;
    if (!gameCode) return res.status(400).json({ message: 'No game code' });

    try {
        const adminId = await getAdminIdByGameCode(gameCode);
        const [quizzes] = await pool.query('SELECT NO, `GROUP` FROM QUIZ WHERE ADMIN_ID = ? ORDER BY `GROUP` ASC, NO ASC', [adminId]);

        const structure = {};
        quizzes.forEach(q => {
            if (!structure[q.GROUP]) structure[q.GROUP] = [];
            structure[q.GROUP].push(q.NO);
        });
        res.json(structure);
    } catch (err) {
        console.error('Quiz structure error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/quiz/groups - retrieve distinct quiz groups
router.get('/groups', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
    const gameCode = req.session.user.gameCode;
    if (!gameCode) return res.status(400).json({ message: 'No game code' });

    try {
        const adminId = await getAdminIdByGameCode(gameCode);
        const [rows] = await pool.query('SELECT DISTINCT `GROUP` FROM QUIZ WHERE ADMIN_ID = ? ORDER BY `GROUP` ASC', [adminId]);
        res.json(rows);
    } catch (err) {
        console.error('Quiz groups error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/quiz/progress - Get user's solved quizzes
router.get('/progress', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.session.user.id;

    try {
        const [rows] = await pool.query(
            'SELECT QUIZ_NO FROM QUIZ_HISTORY WHERE ID = ?',
            [userId]
        );
        const solvedQuizIds = rows.map(r => r.QUIZ_NO);
        res.json({ solvedQuizIds });
    } catch (err) {
        console.error('Quiz progress error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/quiz/group/:groupName - retrieve quizzes by group
router.get('/group/:groupName', async (req, res) => {
    const { groupName } = req.params;
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
    const gameCode = req.session.user.gameCode;
    if (!gameCode) return res.status(400).json({ message: 'No game code' });

    try {
        const adminId = await getAdminIdByGameCode(gameCode);
        const [rows] = await pool.query('SELECT * FROM QUIZ WHERE `GROUP` = ? AND ADMIN_ID = ? ORDER BY NO ASC', [groupName, adminId]);
        res.json(rows);
    } catch (err) {
        console.error('Quiz by group error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/quiz/history - Reset all user progress
router.delete('/history', async (req, res) => {
    // Admin only
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Scope to admin's game code
    try {
        const adminId = req.session.admin.id;
        const [rows] = await pool.query('SELECT GAME_CODE FROM USER_MNG WHERE ID = ?', [adminId]);
        const gameCode = rows.length > 0 ? rows[0].GAME_CODE : null;

        if (gameCode) {
            // Delete history only for users with this game code
            const deleteHistorySql = `
                DELETE qh FROM QUIZ_HISTORY qh
                JOIN USER u ON qh.ID = u.ID
                WHERE u.GAME_CODE = ?
            `;
            await pool.query(deleteHistorySql, [gameCode]);

            const deleteMissionSql = `
                DELETE mc FROM MISSION_COMPLETE mc
                JOIN USER u ON mc.ID = u.ID
                WHERE u.GAME_CODE = ?
            `;
            await pool.query(deleteMissionSql, [gameCode]);

            sse.broadcast('reset', { message: 'Progress Reset' }, gameCode);
            res.json({ message: 'Quiz history reset for your session.' });
        } else {
            res.json({ message: 'No active game code found.' });
        }

    } catch (err) {
        console.error('Reset history error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/quiz/:id - Delete a quiz
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const [result] = await pool.execute('DELETE FROM QUIZ WHERE NO = ? AND ADMIN_ID = ?', [id, req.session.admin.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        await refreshStructureCache();
        await refreshListCache();
        res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        console.error('Quiz delete error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
