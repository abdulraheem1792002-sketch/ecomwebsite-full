const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/orders
router.get('/', async (req, res) => {
    const userId = req.query.userId;

    try {
        let result;
        if (userId) {
            result = await db.query(
                'SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC',
                [userId]
            );
        } else {
            result = await db.query('SELECT * FROM orders ORDER BY order_date DESC');
        }

        const orders = result.rows.map(row => ({
            ...row.data,
            id: row.id,
            userId: row.user_id,
            status: row.status,
            date: row.order_date
        }));

        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Failed to retrieve orders.', error: err.message });
    }
});

// PATCH /api/orders/:id (Update Status)
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const result = await db.query(`
            UPDATE orders 
            SET status = $1, 
                data = jsonb_set(data, '{status}', $2)
            WHERE id = $3
            RETURNING *
        `, [status, JSON.stringify(status), id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const row = result.rows[0];
        const updatedOrder = {
            ...row.data,
            id: row.id,
            userId: row.user_id,
            status: row.status,
            date: row.order_date
        };

        res.json({ message: 'Order updated', order: updatedOrder });
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ message: 'Error saving order', error: err.message });
    }
});

// POST /api/orders (Place Order)
router.post('/', async (req, res) => {
    const orderData = req.body;

    if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty.' });
    }

    const newOrder = {
        id: 'ORD-' + Date.now(),
        date: new Date().toISOString(),
        status: 'Pending',
        ...orderData
    };

    // Sanitize userId
    let userId = newOrder.userId;
    if (userId === 'guest' || userId === '') {
        userId = null;
    }

    try {
        await db.query(
            'INSERT INTO orders (id, user_id, status, order_date, data) VALUES ($1, $2, $3, $4, $5)',
            [newOrder.id, userId, newOrder.status, newOrder.date, newOrder]
        );

        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder.id });
    } catch (err) {
        // Auto-fix: Table doesn't exist (ERROR: relation "orders" does not exist)
        if (err.code === '42P01') {
            try {
                console.log('Table "orders" missing. Creating now...');
                await db.query(`
                    CREATE TABLE IF NOT EXISTS orders (
                        id TEXT PRIMARY KEY,
                        user_id TEXT REFERENCES users(id),
                        status TEXT NOT NULL,
                        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        data JSONB
                    )
                `);
                // Retry Insert
                await db.query(
                    'INSERT INTO orders (id, user_id, status, order_date, data) VALUES ($1, $2, $3, $4, $5)',
                    [newOrder.id, userId, newOrder.status, newOrder.date, newOrder]
                );
                return res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder.id });
            } catch (retryErr) {
                console.error('Auto-creation of orders table failed:', retryErr);
            }
        }

        // Handle Foreign Key Violation (User ID invalid)
        if (err.code === '23503') {
            return res.status(401).json({ message: 'Your session is invalid or the user no longer exists. Please log out and log in again.' });
        }

        console.error('Error saving order:', err);
        res.status(500).json({ message: 'Failed to save order.', error: err.message });
    }
});

module.exports = router;
