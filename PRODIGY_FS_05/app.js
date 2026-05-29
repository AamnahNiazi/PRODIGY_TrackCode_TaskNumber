const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const JWT_SECRET = 'social_secret';
const dbConfig = {
    user: 'sa',
    password: 'YourStrongPassword',
    server: 'localhost',
    database: 'SocialDB',
    options: { encrypt: false, trustServerCertificate: true }
};
sql.connect(dbConfig).then(() => console.log('✅ SocialDB connected'));

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Authentication
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

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid' });
    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, profile_pic: user.profile_pic, bio: user.bio } });
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

// Profile & upload profile picture
app.post('/api/profile/pic', authenticate, upload.single('profilePic'), async (req, res) => {
    const picUrl = `/uploads/${req.file.filename}`;
    await sql.query`UPDATE Users SET profile_pic = ${picUrl} WHERE id = ${req.user.id}`;
    res.json({ profile_pic: picUrl });
});

app.put('/api/profile/bio', authenticate, async (req, res) => {
    const { bio } = req.body;
    await sql.query`UPDATE Users SET bio = ${bio} WHERE id = ${req.user.id}`;
    res.json({ message: 'Bio updated' });
});

// Create post (with optional media)
app.post('/api/posts', authenticate, upload.single('media'), async (req, res) => {
    const { content } = req.body;
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
    await sql.query`INSERT INTO Posts (user_id, content, media_url) VALUES (${req.user.id}, ${content}, ${mediaUrl})`;
    res.status(201).json({ message: 'Post created' });
});

// Get feed (posts from users you follow + your own)
app.get('/api/feed', authenticate, async (req, res) => {
    const feedQuery = `
        SELECT p.*, u.username, u.profile_pic,
               (SELECT COUNT(*) FROM Likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM Comments WHERE post_id = p.id) as comment_count,
               (SELECT CASE WHEN EXISTS (SELECT 1 FROM Likes WHERE user_id = ${req.user.id} AND post_id = p.id) THEN 1 ELSE 0 END) as liked_by_me
        FROM Posts p
        JOIN Users u ON p.user_id = u.id
        LEFT JOIN Follows f ON f.followee_id = p.user_id
        WHERE p.user_id = ${req.user.id} OR f.follower_id = ${req.user.id}
        GROUP BY p.id, p.user_id, p.content, p.media_url, p.created_at, u.username, u.profile_pic
        ORDER BY p.created_at DESC
    `;
    const result = await sql.query(feedQuery);
    res.json(result.recordset);
});

// Like/unlike post
app.post('/api/posts/:postId/like', authenticate, async (req, res) => {
    const postId = req.params.postId;
    const existing = await sql.query`SELECT * FROM Likes WHERE user_id = ${req.user.id} AND post_id = ${postId}`;
    if (existing.recordset.length) {
        await sql.query`DELETE FROM Likes WHERE user_id = ${req.user.id} AND post_id = ${postId}`;
        res.json({ message: 'Unliked' });
    } else {
        await sql.query`INSERT INTO Likes (user_id, post_id) VALUES (${req.user.id}, ${postId})`;
        res.json({ message: 'Liked' });
    }
});

// Add comment
app.post('/api/posts/:postId/comments', authenticate, async (req, res) => {
    const { comment } = req.body;
    await sql.query`INSERT INTO Comments (user_id, post_id, comment) VALUES (${req.user.id}, ${req.params.postId}, ${comment})`;
    res.status(201).json({ message: 'Comment added' });
});

// Get comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
    const result = await sql.query`
        SELECT c.*, u.username, u.profile_pic
        FROM Comments c
        JOIN Users u ON c.user_id = u.id
        WHERE c.post_id = ${req.params.postId}
        ORDER BY c.created_at
    `;
    res.json(result.recordset);
});

// Follow/unfollow user
app.post('/api/users/:userId/follow', authenticate, async (req, res) => {
    const followId = req.params.userId;
    if (followId == req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
    const existing = await sql.query`SELECT * FROM Follows WHERE follower_id = ${req.user.id} AND followee_id = ${followId}`;
    if (existing.recordset.length) {
        await sql.query`DELETE FROM Follows WHERE follower_id = ${req.user.id} AND followee_id = ${followId}`;
        res.json({ message: 'Unfollowed' });
    } else {
        await sql.query`INSERT INTO Follows (follower_id, followee_id) VALUES (${req.user.id}, ${followId})`;
        res.json({ message: 'Followed' });
    }
});

// Search users
app.get('/api/users/search', authenticate, async (req, res) => {
    const { q } = req.query;
    const result = await sql.query`SELECT id, username, profile_pic FROM Users WHERE username LIKE '%${q}%' AND id != ${req.user.id}`;
    res.json(result.recordset);
});

const PORT = 3004;
app.listen(PORT, () => console.log(`📱 Social Media server on http://localhost:${PORT}`));