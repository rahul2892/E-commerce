const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.json());

router.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Payment processing logic here

        res.status(200).json({ message: 'Payment intent created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/confirm-order', async (req, res) => {
    try {
        const { orderId, orderDetails } = req.body;

        // Calculate the total for the order
        const total = orderDetails.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Update the order in the database
        const orders = db.getCollection('orders');
        const orderIndex = orders.findIndex(order => order.id === orderId);

        if (orderIndex !== -1) {
            orders[orderIndex] = { ...orders[orderIndex], ...orderDetails, total, status: 'Confirmed' };
        } else {
            orders.push({ id: orderId, ...orderDetails, total, status: 'Confirmed' });
        }

        db.saveCollection('orders', orders);

        // Trigger real-time updates
        db.triggerChange('orders', orders);

        // Calculate total sales from confirmed orders
        const totalSales = orders.reduce((sum, order) => order.status === 'Confirmed' ? sum + order.total : sum, 0);

        // Emit real-time update to admin dashboards; ensure global.io exists
        if (global.io) {
            global.io.emit('dashboard-update', { orders, totalSales });
        }

        res.status(200).json({ message: 'Order confirmed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;