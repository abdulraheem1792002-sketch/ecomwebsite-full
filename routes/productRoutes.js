const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/products.json');

// Helper to read data
const getProducts = () => {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
};

// Helper to save data
const saveProducts = (products) => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving products:', err);
        return false;
    }
};

// GET /api/products
router.get('/', (req, res) => {
    try {
        const products = getProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
    try {
        const products = getProducts();
        const product = products.find(p => p.id === req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// POST /api/products (Create)
router.post('/', (req, res) => {
    try {
        const { name, price, image, category, description } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        const products = getProducts();
        const newProduct = {
            id: Date.now().toString(),
            name,
            price: parseFloat(price),
            image: image || '../images/placeholder.png', // Default image
            category: category || 'Uncategorized',
            description: description || ''
        };

        products.push(newProduct);

        if (saveProducts(products)) {
            res.status(201).json({ message: 'Product created', product: newProduct });
        } else {
            res.status(500).json({ message: 'Error saving product' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/products/:id (Update)
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, image, category, description } = req.body;

        const products = getProducts();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields
        products[index] = {
            ...products[index],
            name: name || products[index].name,
            price: price ? parseFloat(price) : products[index].price,
            image: image || products[index].image,
            category: category || products[index].category,
            description: description || products[index].description
        };

        if (saveProducts(products)) {
            res.json({ message: 'Product updated', product: products[index] });
        } else {
            res.status(500).json({ message: 'Error saving product' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/products/:id (Delete)
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const products = getProducts();

        const newProducts = products.filter(p => p.id !== id);

        if (products.length === newProducts.length) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (saveProducts(newProducts)) {
            res.json({ message: 'Product deleted' });
        } else {
            res.status(500).json({ message: 'Error deleting product' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
