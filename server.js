import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imagesRoutes.js';
import Stripe from 'stripe';

const PORT = process.env.PORT || 10000;
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", 'https://promptopia0105.vercel.app/',
    methods : ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));


app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        console.log("Received Payment Request for Amount:", amount); // Debugging log

        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(amount), // Ensure it's an integer
            currency: 'usd',
            payment_method_types: ['card'],
        });

        res.json({ success: true, clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Stripe Payment Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const startServer = async () => {
    try {
        await connectDB();
        console.log("Database connected successfully");

        app.use('/api/user', userRouter);
        app.use('/api/image', imageRouter);

        app.get('/', (req, res) => res.send("API Working"));

        app.listen(PORT, () => console.log('Server running on port ' + PORT));
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

startServer();
