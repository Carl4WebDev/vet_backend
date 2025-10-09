// routes/localPayRoutes.js
import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * 1️⃣ Create a pending subscription
 * Simulates clicking "Pay" from the frontend.
 * Returns a fake checkout URL (you’ll just call webhook manually later)
 */
router.post("/create", async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId)
      return res.status(400).json({ error: "Missing userId or planId" });

    // find plan info
    const planRes = await pool.query(
      "SELECT price FROM subscription_plans WHERE plan_id = $1",
      [planId]
    );
    const plan = planRes.rows[0];
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // create pending subscription
    const subRes = await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING subscription_id`,
      [userId, planId]
    );
    const subscriptionId = subRes.rows[0].subscription_id;

    // return info so frontend knows what to test next
    res.json({
      message: "Subscription created. Now simulate payment via webhook.",
      subscriptionId,
      amount: plan.price,
    });
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

/**
 * 2️⃣ Simulated Webhook (test via Postman)
 * Pretend this was sent by PayMongo.
 */
router.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;
    const attr = data?.attributes;
    const meta = attr?.metadata || {};

    const userId = parseInt(meta.user_id);
    const planId = parseInt(meta.plan_id);
    const subscriptionId = parseInt(meta.subscription_id);
    const status = attr?.status || "pending";
    const amount = attr?.amount / 100 || 0; // PayMongo gives centavos

    // 🧮 Get plan to compute correct end_date
    const planRes = await pool.query(
      `SELECT billing_cycle FROM subscription_plans WHERE plan_id = $1`,
      [planId]
    );
    const plan = planRes.rows[0];
    if (!plan) throw new Error("Plan not found");

    const daysToAdd = plan.billing_cycle === "yearly" ? 365 : 30;

    // 🧾 Update subscription dates
    const subRes = await pool.query(
      `
      UPDATE user_subscriptions
      SET start_date = CURRENT_DATE,
          end_date = CURRENT_DATE + INTERVAL '${daysToAdd} days',
          status = 'active',
          auto_renew = TRUE,
          cancel_at_period_end = FALSE
      WHERE subscription_id = $1
      RETURNING *;
      `,
      [subscriptionId]
    );

    // 💰 Record payment
    await pool.query(
      `
      INSERT INTO payments (user_id, subscription_id, amount, status, payment_date)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *;
      `,
      [userId, subscriptionId, amount, status]
    );

    res.json({
      success: true,
      message: "Payment processed",
      sub: subRes.rows[0],
    });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

/**
 * 3️⃣ Get billing history
 */
router.get("/billing/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const r = await pool.query(
      `SELECT 
         TO_CHAR(payment_date, 'YYYY-MM-DD') AS date,
         sp.name AS details,
         p.amount,
         p.status
       FROM payments p
       LEFT JOIN user_subscriptions us ON us.subscription_id = p.subscription_id
       LEFT JOIN subscription_plans sp ON sp.plan_id = us.plan_id
       WHERE p.user_id = $1
       ORDER BY p.payment_date DESC`,
      [userId]
    );

    res.json({ history: r.rows });
  } catch (err) {
    console.error("Billing history error:", err);
    res.status(500).json({ error: "Failed to fetch billing history" });
  }
});

export default router;
