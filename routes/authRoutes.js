const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Create User
        // Storing as plain text for this prototype as per original code. USE BCRYPT IN PRODUCTION.
        await sql`
            INSERT INTO users (id, name, email, password, role)
            VALUES (${Date.now().toString()}, ${name}, ${email}, ${password}, 'user')
        `;

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        if (err.code === '23505') { // Unique violation for email
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Auto-fix: Table doesn't exist (Vercel Postgres common issue)
        if (err.code === '42P01') {
            try {
                console.log('Table "users" missing. Creating now...');
                await sql`
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `;
                // Retry creation
                await sql`
                    INSERT INTO users (id, name, email, password, role)
                    VALUES (${Date.now().toString()}, ${name}, ${email}, ${password}, 'user')
                `;
                return res.status(201).json({ message: 'User registered successfully!' });
            } catch (retryErr) {
                console.error('Auto-creation failed:', retryErr);
                // Fall through to error response
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
        const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
        const user = rows[0];

        if (user && user.password === password) {
            // Return user info (success)
            // In a real app, we would issue a JWT token here.
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
        // Update User
        // We use COALESCE or just passed value if we want to overwrite.
        // If password is plain text, handle carefully.

        let result;
        if (password) {
            result = await sql`
                UPDATE users 
                SET name = ${name}, email = ${email}, password = ${password}
                WHERE id = ${id}
                RETURNING id, name, email, role
            `;
        } else {
            result = await sql`
                UPDATE users 
                SET name = ${name}, email = ${email}
                WHERE id = ${id}
                RETURNING id, name, email, role
            `;
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updatedUser = result.rows[0];

        res.json({
            message: 'Profile updated successfully.',
            user: updatedUser
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Email already in use.' });
        }
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }
});

module.exports = router;
