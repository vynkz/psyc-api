// auth.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(409).json({ error: 'user_exists' });

    const hash = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user']);
    res.status(201).json({ success: true, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const [rows] = await db.execute('SELECT id, password, role FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'invalid_credentials' });

    res.json({ success: true, username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
