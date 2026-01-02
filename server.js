require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sql } = require('@vercel/postgres');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve public assets (CSS, Images) if moved there, but for now we serve root

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posts', require('./routes/blogRoutes'));

// Serve static files from root
// Note: In a production app, we'd structure this better (e.g., all static in /public)
// For now, we serve specific directories to keep the existing structure working
app.use(express.static(path.join(__dirname, 'html')));   // Serve HTML files at root
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Temporary route to initialize DB from browser
const db = require('./db');
// ... imports

// Temporary route to initialize DB from browser
app.get('/api/init-db', async (req, res) => {
    try {
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
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                status TEXT NOT NULL,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data JSONB
            )
        `);
        res.send('Database initialized successfully! Users and Orders tables created.');
        const fs = require('fs');

        // Temporary route to seed products from JSON to DB
        app.get('/api/seed-products', async (req, res) => {
            try {
                const dataPath = path.join(__dirname, 'data/products.json');
                if (!fs.existsSync(dataPath)) {
                    return res.status(404).send('products.json not found');
                }

                const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

                let count = 0;

                // Ensure table exists first (in case it wasn't created yet)
                await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMERIC NOT NULL,
                image TEXT,
                category TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

                for (const p of products) {
                    // Check if exists
                    const check = await db.query('SELECT id FROM products WHERE id = $1', [p.id]);
                    if (check.rowCount === 0) {
                        await db.query(
                            'INSERT INTO products (id, name, price, image, category, description) VALUES ($1, $2, $3, $4, $5, $6)',
                            [p.id, p.name, p.price, p.image, p.category, p.description]
                        );
                        count++;
                    }
                }

                res.send(`Seeding complete! Added ${count} new products to the database.`);
            } catch (err) {
                console.error('Seed error:', err);
                res.status(500).send('Error seeding products: ' + err.message);
            }
        });

        // Fallback to index.html for any other route (SPA behavior, though this is MPA)
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'html', 'index.html'));
        });

        // Start Server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
