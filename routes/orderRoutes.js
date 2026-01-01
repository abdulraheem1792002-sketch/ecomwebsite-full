const express = require('express');
const router = express.Router();
const { sql } = require('@vercel/postgres');

// GET /api/orders
router.get('/', async (req, res) => {
    const userId = req.query.userId;

    try {
        let result;
        if (userId) {
            result = await sql`
                SELECT * FROM orders 
                WHERE user_id = ${userId}
                ORDER BY order_date DESC
            `;
        } else {
            result = await sql`
                SELECT * FROM orders 
                ORDER BY order_date DESC
            `;
        }

        // Map back to the structure the frontend expects 
        // We stored extra data in the 'data' JSONB column, so we might want to merge it.
        const orders = result.rows.map(row => ({
            ...row.data, // Spread the JSON structure
            id: row.id,
            userId: row.user_id,
            status: row.status,
            date: row.order_date
        }));

        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Failed to retrieve orders.' });
    }
});

// PATCH /api/orders/:id (Update Status)
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // We update the status column AND the status field inside the JSONB data to keep them in sync
        const result = await sql`
            UPDATE orders 
            SET status = ${status}, 
                data = jsonb_set(data, '{status}', ${JSON.stringify(status)})
            WHERE id = ${id}
            RETURNING *
        `;

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
        res.status(500).json({ message: 'Error saving order' });
    }
});

// POST /api/orders (Place Order)
router.post('/', async (req, res) => {
    const orderData = req.body;

    // Basic Validation
    if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty.' });
    }

    const newOrder = {
        id: 'ORD-' + Date.now(),
        date: new Date().toISOString(),
        status: 'Pending',
        ...orderData
    };

    try {
        await sql`
            INSERT INTO orders (id, user_id, status, order_date, data)
            VALUES (
                ${newOrder.id}, 
                ${newOrder.userId || null}, 
                ${newOrder.status}, 
                ${newOrder.date}, 
                ${newOrder}
            )
        `;

        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder.id });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ message: 'Failed to save order.' });
    }
});

module.exports = router;
