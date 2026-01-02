const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM posts ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        // If table doesn't exist yet, return empty array
        if (err.code === '42P01') {
            return res.json([]);
        }
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ message: 'Error fetching post' });
    }
});

module.exports = router;
