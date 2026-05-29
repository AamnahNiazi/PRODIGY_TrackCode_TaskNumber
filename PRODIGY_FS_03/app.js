const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const dbConfig = {
    user: 'sa',
    password: 'YourStrongPassword',
    server: 'localhost',
    database: 'EcommerceDB',
    options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(dbConfig).then(() => console.log('✅ Connected to EcommerceDB')).catch(console.error);

// Get products with optional category filter and sorting
app.get('/api/products', async (req, res) => {
    const { category, sort, search } = req.query;
    let query = 'SELECT * FROM Products';
    const conditions = [];
    if (category) conditions.push(`category = '${category}'`);
    if (search) conditions.push(`name LIKE '%${search}%' OR description LIKE '%${search}%'`);
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    if (sort === 'price_asc') query += ' ORDER BY price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY price DESC';
    else query += ' ORDER BY id';
    const result = await sql.query(query);
    res.json(result.recordset);
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    const result = await sql.query`SELECT DISTINCT category FROM Products WHERE category IS NOT NULL`;
    res.json(result.recordset.map(r => r.category));
});

const PORT = 3002;
app.listen(PORT, () => console.log(`🛒 E-commerce server on http://localhost:${PORT}`));