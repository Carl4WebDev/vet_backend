// routes/paymongoWebhookTest.js
import express from "express";
const router = express.Router();

router.post("/webhook-test", async (req, res) => {
  try {
    console.log("🧪 PAYMONGO WEBHOOK TEST RECEIVED:");
    console.log(JSON.stringify(req.body, null, 2));

    const attr = req.body?.data?.attributes;
    const status = attr?.status;
    const amount = attr?.amount / 100;
    const meta = attr?.metadata;

    console.log("✅ Parsed test payload:", { status, amount, meta });

    res.status(200).json({
      success: true,
      message: "Webhook test received",
      data: { status, amount, meta },
    });
  } catch (err) {
    console.error("❌ Test webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
