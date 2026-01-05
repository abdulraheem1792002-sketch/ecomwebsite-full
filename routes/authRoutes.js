const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

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
            // Auto-promote to admin if email matches (Self-Healing Admin)
            if (user.email === 'abdul.raheem.17.9.2002@gmail.com' && user.role !== 'admin') {
                console.log('Promoting user to admin...');
                await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
                user.role = 'admin'; // Update local object for response
            }

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // 1. Find User
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rowCount === 0) {
            // Security: Don't reveal user existence
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }
        const user = userResult.rows[0];

        // 2. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        // 3. Save Token to DB
        await db.query(
            'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
            [token, expires, user.id]
        );

        // 4. Send Email
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const resetLink = `${protocol}://${req.headers.host}/reset-password.html?token=${token}`;

        await sendEmail(
            email,
            'Password Reset Request',
            `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
            `<p>Hello ${user.name},</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link will expire in 1 hour.</p>`
        );

        res.json({ message: 'If an account exists with that email, a reset link has been sent.' });

    } catch (err) {
        console.error('Error in forgot-password:', err);
        res.status(500).json({ message: 'Failed to process request.' });
    }
});

// POST /api/auth/reset-password (Verify Token & Update)
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
        // 1. Find User with valid token and expiration
        const result = await db.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > $2',
            [token, new Date()]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token.' });
        }

        const user = result.rows[0];

        // 2. Update Password and Clear Token
        await db.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
            [newPassword, user.id]
        );

        // 3. Notify User
        await sendEmail(
            user.email,
            'Password Changed',
            `Hello ${user.name},\n\nYour password has been successfully changed.`
        );

        res.json({ message: 'Password has been reset successfully. You can now login.' });

    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Failed to reset password.' });
    }
});

module.exports = router;
