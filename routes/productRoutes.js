const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        // If table doesn't exist yet, return empty array instead of error
        if (err.code === '42P01') {
            return res.json([]);
        }
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// POST /api/products (Create)
router.post('/', async (req, res) => {
    const { name, price, image, category, description } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Name and price are required' });
    }

    const newProduct = {
        id: Date.now().toString(),
        name,
        price: parseFloat(price),
        image: image || '../images/placeholder.png',
        category: category || 'Uncategorized',
        description: description || ''
    };

    try {
        await db.query(
            'INSERT INTO products (id, name, price, image, category, description) VALUES ($1, $2, $3, $4, $5, $6)',
            [newProduct.id, newProduct.name, newProduct.price, newProduct.image, newProduct.category, newProduct.description]
        );

        res.status(201).json({ message: 'Product created', product: newProduct });
    } catch (err) {
        // Auto-fix: Table doesn't exist (ERROR: relation "products" does not exist)
        if (err.code === '42P01') {
            try {
                console.log('Table "products" missing. Creating now...');
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
                // Retry Insert
                await db.query(
                    'INSERT INTO products (id, name, price, image, category, description) VALUES ($1, $2, $3, $4, $5, $6)',
                    [newProduct.id, newProduct.name, newProduct.price, newProduct.image, newProduct.category, newProduct.description]
                );
                return res.status(201).json({ message: 'Product created', product: newProduct });
            } catch (retryErr) {
                console.error('Auto-creation of products table failed:', retryErr);
            }
        }

        console.error('Error saving product:', err);
        res.status(500).json({ message: 'Error saving product' });
    }
});

// PUT /api/products/:id (Update)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, image, category, description } = req.body;

    try {
        // We do a dynamic update or just simple update of all fields
        const result = await db.query(`
            UPDATE products 
            SET name = COALESCE($1, name),
                price = COALESCE($2, price),
                image = COALESCE($3, image),
                category = COALESCE($4, category),
                description = COALESCE($5, description)
            WHERE id = $6
            RETURNING *
        `, [name, price ? parseFloat(price) : null, image, category, description, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product updated', product: result.rows[0] });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/products/:id (Delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM products WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
