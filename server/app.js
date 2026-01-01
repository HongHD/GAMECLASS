// app.js - Express server entry point
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const session = require('express-session');
app.use(session({
    secret: 'secret-key', // In production, use a secure random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    // Allow access to login page and static assets without session
    // Allow access to login page and static assets without session
    // Paths are relative to the mount point '/user'
    const publicPaths = ['/index.html', '/login.js', '/user.css', '/register.html', '/register.js', '/app.html'];
    if (publicPaths.includes(req.path) || req.path === '/') {
        return next();
    }

    // Check if user is logged in
    if (req.session && req.session.user) {
        return next();
    }

    // Redirect to login page if not authenticated
    res.redirect('/user/index.html');
};

// Admin Authentication Middleware
const adminAuthMiddleware = (req, res, next) => {
    const publicPaths = ['/login.html', '/login.js', '/login.css'];
    if (publicPaths.includes(req.path) || req.path === '/login.html') {
        return next();
    }

    if (req.session && req.session.admin) {
        return next();
    }

    res.redirect('/admin/login.html');
};

// Serve static admin pages
app.use('/admin', adminAuthMiddleware, express.static(path.join(__dirname, '..', 'admin')));
// Serve static user pages with auth check
app.use('/user', authMiddleware, express.static(path.join(__dirname, '..', 'user')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
const quizRouter = require('./api/quiz');
app.use('/api/quiz', quizRouter);
const userRouter = require('./api/user');
app.use('/api/user', userRouter);
const adminRouter = require('./api/admin');
app.use('/api/admin', adminRouter);
const gameRouter = require('./api/game');
app.use('/api/game', gameRouter);
const missionRouter = require('./api/mission');
app.use('/api/mission', missionRouter);

app.get('/', (req, res) => {
    res.send('Quiz Admin Server is running');
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
