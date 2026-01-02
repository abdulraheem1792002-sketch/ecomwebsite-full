const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Automatically assign 'admin' role to the site owner
        const role = email === 'abdul.raheem.17.9.2002@gmail.com' ? 'admin' : 'user';

        // Create User
        await db.query(
            'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
            [Date.now().toString(), name, email, password, role]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        if (err.code === '23505') { // Unique violation for email
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Auto-fix: Table doesn't exist (ERROR: relation "users" does not exist)
        if (err.code === '42P01') {
            try {
                console.log('Table "users" missing. Creating now...');
                await db.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                // Retry creation
                const role = email === 'abdul.raheem.17.9.2002@gmail.com' ? 'admin' : 'user';
                await db.query(
                    'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
                    [Date.now().toString(), name, email, password, role]
                );
                return res.status(201).json({ message: 'User registered successfully!' });
            } catch (retryErr) {
                console.error('Auto-creation failed:', retryErr);
            }
        }

        console.error('Error signing up:', err);
        res.status(500).json({ message: 'Failed to register user.', error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required.' });
    }

    try {
        // Find User
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (user && user.password === password) {
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
    const { id, name, email, password } = req.body;

    if (!id || !name || !email) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        let result;
        if (password) {
            result = await db.query(
                'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, name, email, role',
                [name, email, password, id]
            );
        } else {
            result = await db.query(
                'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
                [name, email, id]
            );
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updatedUser = result.rows[0];
        res.json({ message: 'Profile updated successfully.', user: updatedUser });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Email already in use.' });
        }
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }
});

module.exports = router;
