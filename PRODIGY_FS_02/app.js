const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'employee_jwt_secret';
const dbConfig = {
    user: 'sa',
    password: 'YourStrongPassword',
    server: 'localhost',
    database: 'EmployeeDB',
    options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(dbConfig).then(() => console.log('✅ Connected to EmployeeDB')).catch(console.error);

// ---------- Authentication (same as Task1) ----------
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (username, email, password_hash, role) VALUES (${username}, ${email}, ${hashed}, ${role || 'user'})`;
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

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

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
}

// ---------- Employee CRUD (only admin) ----------
app.post('/api/employees', authenticate, requireAdmin, async (req, res) => {
    const { name, position, salary, hire_date } = req.body;
    try {
        await sql.query`INSERT INTO Employees (name, position, salary, hire_date) VALUES (${name}, ${position}, ${salary}, ${hire_date})`;
        res.status(201).json({ message: 'Employee added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/employees', authenticate, requireAdmin, async (req, res) => {
    const result = await sql.query`SELECT * FROM Employees`;
    res.json(result.recordset);
});

app.put('/api/employees/:id', authenticate, requireAdmin, async (req, res) => {
    const { name, position, salary, hire_date } = req.body;
    try {
        await sql.query`UPDATE Employees SET name=${name}, position=${position}, salary=${salary}, hire_date=${hire_date} WHERE id=${req.params.id}`;
        res.json({ message: 'Employee updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await sql.query`DELETE FROM Employees WHERE id=${req.params.id}`;
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Employee CRUD on http://localhost:${PORT}`));