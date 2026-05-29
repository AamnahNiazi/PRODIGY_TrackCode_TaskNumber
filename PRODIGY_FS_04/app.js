const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'chat_jwt_secret';
const dbConfig = {
    user: 'sa',
    password: 'YourStrongPassword',
    server: 'localhost',
    database: 'ChatDB',
    options: { encrypt: false, trustServerCertificate: true }
};
sql.connect(dbConfig).then(() => console.log('✅ ChatDB connected'));

// Authentication endpoints
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (username, password_hash) VALUES (${username}, ${hashed})`;
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid' });
    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username });
});

// Socket.IO authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Invalid token'));
        socket.username = decoded.username;
        next();
    });
});

// Store online users
const onlineUsers = new Set();

io.on('connection', (socket) => {
    console.log(`${socket.username} connected`);
    onlineUsers.add(socket.username);
    io.emit('onlineUsers', Array.from(onlineUsers));

    // Join a room (public or private)
    socket.on('joinRoom', (room) => {
        socket.join(room);
        socket.currentRoom = room;
    });

    // Send message
    socket.on('chatMessage', async ({ to, message }) => {
        const room = to ? [socket.username, to].sort().join('_') : 'general';
        if (!to) socket.join('general');
        io.to(room).emit('message', { from: socket.username, message, time: new Date().toLocaleTimeString() });
        // Save to DB
        await sql.query`INSERT INTO Messages (from_user, to_room, content) VALUES (${socket.username}, ${room}, ${message})`;
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.username);
        io.emit('onlineUsers', Array.from(onlineUsers));
        console.log(`${socket.username} disconnected`);
    });
});

// Get chat history for a room
app.get('/api/history/:room', async (req, res) => {
    const { room } = req.params;
    const result = await sql.query`SELECT from_user, content, timestamp FROM Messages WHERE to_room = ${room} ORDER BY timestamp`;
    res.json(result.recordset);
});

const PORT = 3003;
server.listen(PORT, () => console.log(`💬 Chat server on http://localhost:${PORT}`));