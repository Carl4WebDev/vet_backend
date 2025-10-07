import express from "express";

const router = express.Router();

// ✅ Webhook endpoint to receive PayMongo payment updates
router.post("/webhook", express.json(), async (req, res) => {
  try {
    const event = req.body;
    console.log("🔔 PayMongo Webhook received:", event);

    if (
      event.data &&
      event.data.attributes.data.attributes.status === "succeeded"
    ) {
      const payment = event.data.attributes.data;
      const amount = payment.attributes.amount / 100;

      // TODO: Mark payment as paid in DB & update subscription status here
      console.log(`✅ Payment of ₱${amount} succeeded`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling PayMongo webhook:", err);
    res.status(500).send("Webhook error");
  }
});

export default router;
