// routes/paymongoWebhook.js
import crypto from "crypto";
import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();
const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

// ✅ Middleware for raw body (only on this route)
router.use(
  express.raw({
    type: "*/*",
  })
);

/**
 * ✅ PayMongo Live Webhook (Production-safe)
 */
router.post("/webhook", async (req, res) => {
  try {
    // 🧾 Step 1: Signature Validation
    const sigHeader = req.headers["paymongo-signature"];
    if (!sigHeader) {
      console.warn("⚠️ Missing PayMongo signature header");
      return res.status(400).send("Missing signature header");
    }

    const payload =
      req.body instanceof Buffer
        ? req.body.toString("utf8")
        : JSON.stringify(req.body);

    const parts = sigHeader.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
    const liveSig = parts.find((p) => p.startsWith("li="))?.split("=")[1];

    if (!timestamp || !liveSig) {
      console.warn("⚠️ Malformed signature header:", sigHeader);
      return res.status(400).send("Malformed signature header");
    }

    const expectedSig = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    if (expectedSig !== liveSig) {
      console.warn("⚠️ Invalid PayMongo signature");
      return res.status(400).send("Invalid signature");
    }

    console.log("✅ Signature verified successfully");

    // 🧠 Step 2: Parse JSON safely
    let event;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      return res.status(400).send("Invalid JSON payload");
    }

    const attr = event?.data?.attributes;
    if (!attr) {
      return res.status(400).send("Missing attributes");
    }

    const status = attr.status;
    const amount = attr.amount / 100;
    const meta = attr.metadata || {};
    const { user_id, plan_id, subscription_id } = meta;

    if (!user_id || !plan_id || !subscription_id) {
      console.warn("⚠️ Missing metadata:", meta);
      return res.status(400).json({ error: "Missing metadata" });
    }

    console.log("💬 Verified event:", {
      status,
      user_id,
      plan_id,
      subscription_id,
    });

    // 🟢 Step 3: Process Subscription
    if (status === "succeeded") {
      const planRes = await pool.query(
        "SELECT billing_cycle FROM subscription_plans WHERE plan_id = $1",
        [plan_id]
      );
      const plan = planRes.rows[0];
      const interval = plan?.billing_cycle === "yearly" ? "1 year" : "1 month";

      await pool.query(
        `UPDATE user_subscriptions
         SET status = 'active',
             start_date = CURRENT_DATE,
             end_date = CURRENT_DATE + $2::interval
         WHERE subscription_id = $1`,
        [subscription_id, interval]
      );

      await pool.query(
        `INSERT INTO payments (user_id, subscription_id, amount, status, payment_date)
         VALUES ($1, $2, $3, 'paid', CURRENT_TIMESTAMP)`,
        [user_id, subscription_id, amount]
      );

      console.log("✅ Payment succeeded:", {
        user_id,
        plan_id,
        subscription_id,
      });
    } else if (["failed", "cancelled"].includes(status)) {
      await pool.query(
        `UPDATE user_subscriptions SET status = 'pending' WHERE subscription_id = $1`,
        [subscription_id]
      );
      console.log("⚠️ Payment failed or cancelled:", subscription_id);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
