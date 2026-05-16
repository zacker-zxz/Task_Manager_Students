const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Mini Database Helpers ───────────────────────────────────────────
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        const seed = { users: [], tasks: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
        return seed;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Auth Routes ─────────────────────────────────────────────────────
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

    const db = readDB();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ error: 'Username already taken.' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const token = crypto.randomBytes(32).toString('hex');
    const user = { id: Date.now().toString(), username, password: hash, token };
    db.users.push(user);
    writeDB(db);
    res.status(201).json({ token, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const db = readDB();
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hash);
    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    // Rotate token on each login
    user.token = crypto.randomBytes(32).toString('hex');
    writeDB(db);
    res.json({ token: user.token, username: user.username });
});

// ── Auth Middleware ──────────────────────────────────────────────────
function auth(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const db = readDB();
    const user = db.users.find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.userId = user.id;
    next();
}

// ── Task CRUD Routes ────────────────────────────────────────────────
app.get('/api/tasks', auth, (req, res) => {
    const db = readDB();
    const tasks = db.tasks.filter(t => t.userId === req.userId);
    res.json(tasks);
});

app.post('/api/tasks', auth, (req, res) => {
    const { title, category, deadline } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const db = readDB();
    const task = {
        id: Date.now().toString(),
        userId: req.userId,
        title,
        category: category || 'personal',
        deadline: deadline || '',
        completed: false,
        createdAt: new Date().toISOString()
    };
    db.tasks.push(task);
    writeDB(db);
    res.status(201).json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
    const db = readDB();
    const task = db.tasks.find(t => t.id === req.params.id && t.userId === req.userId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.deadline !== undefined) task.deadline = req.body.deadline;
    if (req.body.completed !== undefined) task.completed = req.body.completed;

    writeDB(db);
    res.json(task);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id && t.userId === req.userId);
    if (idx === -1) return res.status(404).json({ error: 'Task not found.' });

    db.tasks.splice(idx, 1);
    writeDB(db);
    res.status(204).send();
});

// ── Fallback: serve index.html for any non-API routes ───────────────
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n  NexusTask Server is live at  →  http://localhost:${PORT}\n`);
});
