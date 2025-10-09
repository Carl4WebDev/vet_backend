// routes/paymongoWebhook.js
import crypto from "crypto";
import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();
const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

/**
 * ✅ PayMongo Live Webhook
 * Verifies signature, updates DB, no PDF generation (frontend handles it)
 */
router.post("/webhook", async (req, res) => {
  try {
    const sigHeader = req.headers["paymongo-signature"];
    const payload = req.body.toString(); // raw body buffer converted to string

    // 🔒 Parse signature values
    const parts = String(sigHeader || "").split(",");
    let timestamp = "",
      liveSig = "";
    for (const p of parts) {
      const [k, v] = p.split("=");
      if (k === "t") timestamp = v;
      if (k === "li") liveSig = v;
    }

    // ✅ Validate signature
    const expectedSig = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    if (expectedSig !== liveSig) {
      console.warn("⚠️ Invalid PayMongo signature");
      return res.status(400).send("Invalid signature");
    }

    // 🧠 Parse verified event
    const event = JSON.parse(payload);
    const attr = event.data.attributes;
    const status = attr.status;
    const amount = attr.amount / 100;
    const meta = attr.metadata || {};
    const { user_id, plan_id, subscription_id } = meta;

    if (!user_id || !plan_id || !subscription_id)
      return res.status(400).json({ error: "Missing metadata" });

    // ✅ Update subscription upon successful payment
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
    } else if (status === "failed" || status === "cancelled") {
      await pool.query(
        `UPDATE user_subscriptions SET status = 'pending' WHERE subscription_id = $1`,
        [subscription_id]
      );
      console.log("⚠️ Payment failed or cancelled:", subscription_id);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
