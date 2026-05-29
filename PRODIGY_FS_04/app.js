const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.json());
app.use(express.static('public'));

// DB connect and auth endpoints (register/login) similar to Task1.
// Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Invalid token'));
            socket.user = decoded;
            next();
        });
    } else next(new Error('No token'));
});
io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);
    socket.on('joinRoom', (room) => {
        socket.join(room);
        socket.room = room;
    });
    socket.on('privateMessage', async ({ to, message }) => {
        const room = [socket.user.username, to].sort().join('_');
        io.to(room).emit('message', { from: socket.user.username, message });
        await sql.query`INSERT INTO Messages (from_user, to_room, content) VALUES (${socket.user.username}, ${room}, ${message})`;
    });
    socket.on('disconnect', () => {});
});
server.listen(3003, () => console.log('Chat on 3003'));