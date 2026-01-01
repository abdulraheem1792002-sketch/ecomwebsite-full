const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '../data/users.json');

// Helper to read users
const getUsers = () => {
    try {
        if (!fs.existsSync(usersPath)) {
            fs.writeFileSync(usersPath, '[]');
            return [];
        }
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users:', err);
        return [];
    }
};

// Helper to save users
const saveUsers = (users) => {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving users:', err);
        return false;
    }
};

// POST /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const users = getUsers();

    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email already registered.' });
    }

    // Create User
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password // Storing as plain text for this prototype. USE BCRYPT IN PRODUCTION.
    };

    users.push(newUser);

    if (saveUsers(users)) {
        res.status(201).json({ message: 'User registered successfully!' });
    } else {
        res.status(500).json({ message: 'Failed to save user.' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required.' });
    }

    const users = getUsers();

    // Find User
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Return user info (success)
        // In a real app, we would issue a JWT token here.
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role // Critical for frontend permissions
            }
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
    const { id, name, email, password } = req.body;

    if (!id || !name || !email) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const users = getUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Email Uniqueness Check (if email changed)
    if (users[index].email !== email) {
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ message: 'Email already in use.' });
        }
    }

    // Update User
    users[index] = {
        ...users[index],
        name,
        email,
        password: password || users[index].password // Only update password if provided
    };

    if (saveUsers(users)) {
        res.json({
            message: 'Profile updated successfully.',
            user: {
                id: users[index].id,
                name: users[index].name,
                email: users[index].email,
                role: users[index].role
            }
        });
    } else {
        res.status(500).json({ message: 'Failed to update profile.' });
    }
});

module.exports = router;
