const express = require('express');
const sql = require('mssql');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const dbConfig = { database: 'EcommerceDB', ... };
sql.connect(dbConfig);

app.get('/api/products', async (req, res) => {
    const { category, sort } = req.query;
    let query = 'SELECT * FROM Products';
    if (category) query += ` WHERE category = '${category}'`;
    if (sort === 'price_asc') query += ' ORDER BY price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY price DESC';
    const result = await sql.query(query);
    res.json(result.recordset);
});

app.listen(3002, () => console.log('Ecommerce on 3002'));