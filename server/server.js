const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const stripe = require('stripe')('sk_test_51QpPl1P5QJGXjtwec81RyJRwoJAiHUKpS7huYCxJ6DTpWnT50q5XoGI2HHP6ohYRqY5qtrqC2YxY3lKmBn04Fw8D00pEzhLRiL');

app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency || 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (err) {
        res.status(500).json({ 
            error: err.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 