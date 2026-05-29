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

const JWT_SECRET = 'your_jwt_secret_key';
const dbConfig = {
    user: 'sa',
    password: 'YourPassword',
    server: 'localhost',
    database: 'AuthDB',
    options: { encrypt: false }
};

// Connect to DB
sql.connect(dbConfig).then(() => console.log('DB connected'));

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (username, email, password_hash) VALUES (${username}, ${email}, ${hashed})`;
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
});

// Middleware to verify token
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Protected route (any authenticated user)
app.get('/api/profile', authenticate, (req, res) => {
    res.json({ message: `Welcome user ${req.user.id}` });
});

// Admin-only route
app.get('/api/admin', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json({ message: 'Admin access granted' });
});

app.listen(3000, () => console.log('Auth app running on port 3000'));