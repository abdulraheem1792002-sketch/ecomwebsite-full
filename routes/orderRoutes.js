const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, '../data/orders.json');

// Helper to read orders
const getOrders = () => {
    try {
        if (!fs.existsSync(ordersPath)) {
            fs.writeFileSync(ordersPath, '[]');
            return [];
        }
        const data = fs.readFileSync(ordersPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading orders:', err);
        return [];
    }
};

// Helper to save orders
const saveOrders = (orders) => {
    try {
        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving orders:', err);
        return false;
    }
};

// GET /api/orders
router.get('/', (req, res) => {
    const userId = req.query.userId;
    let orders = getOrders();

    // Filter if userId matches
    if (userId) {
        orders = orders.filter(order => order.userId === userId);
    }

    // Sort by newest first
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(orders);
});

// PATCH /api/orders/:id (Update Status)
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Update status
    orders[orderIndex].status = status;
    // Update modified date if desired: orders[orderIndex].updatedAt = new Date().toISOString();

    if (saveOrders(orders)) {
        res.json({ message: 'Order updated', order: orders[orderIndex] });
    } else {
        res.status(500).json({ message: 'Error saving order' });
    }
});

// POST /api/orders (Place Order)
router.post('/', (req, res) => {
    const orderData = req.body;

    // Basic Validation
    if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty.' });
    }

    const orders = getOrders();

    const newOrder = {
        id: 'ORD-' + Date.now(), // Simple ID generation
        date: new Date().toISOString(),
        status: 'Pending', // Pending, Processing, Shipped, Delivered
        ...orderData
    };

    orders.push(newOrder);

    if (saveOrders(orders)) {
        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder.id });
    } else {
        res.status(500).json({ message: 'Failed to save order.' });
    }
});

module.exports = router;
