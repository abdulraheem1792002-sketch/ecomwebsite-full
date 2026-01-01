const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/posts.json');

const getPosts = () => {
    try {
        if (!fs.existsSync(dataPath)) {
            return [];
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading posts:', err);
        return [];
    }
};

// GET /api/posts - Get all posts
router.get('/', (req, res) => {
    try {
        const posts = getPosts();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// GET /api/posts/:id - Get single post
router.get('/:id', (req, res) => {
    try {
        const posts = getPosts();
        const post = posts.find(p => p.id === req.params.id);

        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching post' });
    }
});

module.exports = router;
