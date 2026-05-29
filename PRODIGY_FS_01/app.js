const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'your_jwt_secret_key_change_in_production';
const dbConfig = {
    user: 'sa',
    password: 'YourStrongPassword',
    server: 'localhost',
    database: 'AuthDB',
    options: { encrypt: false, trustServerCertificate: true }
};

// Connect to DB
sql.connect(dbConfig).then(() => console.log('✅ Connected to AuthDB')).catch(err => console.error(err));

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    try {
        const hashed = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (username, email, password_hash) VALUES (${username}, ${email}, ${hashed})`;
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.message.includes('Violation of UNIQUE KEY')) res.status(400).json({ error: 'Username or email already exists' });
        else res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
        if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to verify token
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Protected profile route
app.get('/api/profile', authenticate, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}! Your user ID is ${req.user.id}` });
});

// Admin-only route
app.get('/api/admin', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admin only.' });
    res.json({ message: 'Admin dashboard - sensitive data here' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Auth server running on http://localhost:${PORT}`));