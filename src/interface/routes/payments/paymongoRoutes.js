// routes/paymongoRoutes.js
import { Router } from "express";
import fetch from "node-fetch";
import { pool } from "../../../infrastructure/config/db.js";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL;
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

router.post("/create-payment-intent", async (req, res) => {
  const { userId, planId } = req.body;

  try {
    // 1) Get plan
    const planRes = await pool.query(
      "SELECT plan_id, name, price, billing_cycle FROM subscription_plans WHERE plan_id = $1",
      [planId]
    );
    const plan = planRes.rows[0];
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const centavos = Number(plan.price) * 100;

    // 2) Create or mark "pending" subscription (one per purchase try)
    const pendingSubRes = await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'pending')
       RETURNING subscription_id`,
      [userId, planId]
    );
    const subscriptionId = pendingSubRes.rows[0].subscription_id;

    // 3) PayMongo: auth
    const authHeader = `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString(
      "base64"
    )}`;

    // 4) Payment Intent
    const intentRes = await fetch(
      "https://api.paymongo.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: centavos,
              currency: "PHP",
              description: `${plan.name} Subscription #${subscriptionId}`,
              payment_method_allowed: ["card", "gcash"],
              payment_method_options: {
                card: { request_three_d_secure: "automatic" },
              },
              metadata: {
                user_id: String(userId),
                subscription_id: String(subscriptionId),
                plan_id: String(plan.plan_id),
              },
            },
          },
        }),
      }
    );

    const intentData = await intentRes.json();
    if (!intentRes.ok) {
      console.error("PayMongo Intent error:", intentData);
      return res.status(400).json({ error: "Failed to create payment intent" });
    }

    const intentId = intentData.data.id;

    // 5) Checkout Session
    const checkoutRes = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: true,
              show_line_items: true,
              cancel_url: `${FRONTEND_URL}/subscription/cancel`,
              success_url: `${FRONTEND_URL}/subscription/success`,
              payment_method_types: ["card", "gcash"],
              line_items: [
                {
                  currency: "PHP",
                  amount: centavos,
                  name: `${plan.name} Subscription`,
                  quantity: 1,
                },
              ],
              payment_intent: intentId,
              metadata: {
                user_id: String(userId),
                subscription_id: String(subscriptionId),
                plan_id: String(plan.plan_id),
              },
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      console.error("PayMongo Checkout error:", checkoutData);
      return res
        .status(400)
        .json({ error: "Failed to create checkout session" });
    }

    const checkoutUrl = checkoutData.data.attributes.checkout_url;
    res.json({ checkoutUrl });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;
