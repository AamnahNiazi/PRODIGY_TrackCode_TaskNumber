const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const dbConfig = { /* same as before, database: 'EmployeeDB' */ };
sql.connect(dbConfig);

const JWT_SECRET = 'secret';
function authenticate(req, res, next) { /* same as Task1 */ }
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
}

// CRUD endpoints
app.post('/api/employees', authenticate, requireAdmin, async (req, res) => {
    const { name, position, salary, hire_date } = req.body;
    await sql.query`INSERT INTO Employees (name, position, salary, hire_date) VALUES (${name}, ${position}, ${salary}, ${hire_date})`;
    res.status(201).json({ message: 'Employee added' });
});
app.get('/api/employees', authenticate, requireAdmin, async (req, res) => {
    const result = await sql.query`SELECT * FROM Employees`;
    res.json(result.recordset);
});
app.put('/api/employees/:id', authenticate, requireAdmin, async (req, res) => {
    const { name, position, salary, hire_date } = req.body;
    await sql.query`UPDATE Employees SET name=${name}, position=${position}, salary=${salary}, hire_date=${hire_date} WHERE id=${req.params.id}`;
    res.json({ message: 'Updated' });
});
app.delete('/api/employees/:id', authenticate, requireAdmin, async (req, res) => {
    await sql.query`DELETE FROM Employees WHERE id=${req.params.id}`;
    res.json({ message: 'Deleted' });
});
// Also add login/register endpoints from Task1 to get admin token.

app.listen(3001, () => console.log('Employee CRUD on port 3001'));