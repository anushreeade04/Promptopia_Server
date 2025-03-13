import express from "express";
import Stripe from "stripe";
import User from "../models/userModel.js"; 

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


router.post("/create-payment-intent", async (req, res) => {
    try {
        const { amount, userId } = req.body;

        if (!amount || !userId) {
            return res.status(400).json({ success: false, message: "Amount and userId are required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, 
            currency: "usd",
            payment_method_types: ["card"],
            metadata: { userId }, 
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Webhook to Listen for Payment Success
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId; // Retrieve userId from metadata

        // Update user's credits in the database
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.credits += 100; // Increase credits (adjust based on plan)
            await user.save();
            console.log(`Credits updated for user ${userId}`);
        } catch (error) {
            console.error("Error updating credits:", error);
        }
    }

    res.json({ received: true });
});

export default router;
