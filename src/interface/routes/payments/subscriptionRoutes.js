import { Router } from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = Router();

/**
 * 🟢 Get active subscription for user
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const r = await pool.query(
      `SELECT * FROM v_user_subscription
       WHERE user_id = $1
       ORDER BY subscription_id DESC
       LIMIT 1;`,
      [userId]
    );
    res.json({ subscription: r.rows[0] || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load subscription" });
  }
});

/**
 * 🟣 Toggle Auto-Renew
 * PUT /subscriptions/:subscriptionId/auto-renew
 * Body: { value: boolean }
 */
router.put("/:subscriptionId/auto-renew", async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { value } = req.body;

    if (typeof value === "undefined") {
      return res.status(400).json({ error: "Missing value (true/false)" });
    }

    await pool.query(
      "UPDATE user_subscriptions SET auto_renew = $1 WHERE subscription_id = $2",
      [!!value, subscriptionId]
    );

    res.json({ success: true, auto_renew: value });
  } catch (err) {
    console.error("Auto-renew error:", err);
    res.status(500).json({ error: "Failed to update auto-renew" });
  }
});

/**
 * Cancel subscription
 * PUT /subscriptions/:subscriptionId/cancel
 * Body: { mode: 'now' | 'period_end' }
 */
router.put("/:subscriptionId/cancel", async (req, res) => {
  const { subscriptionId } = req.params;
  const { mode = "period_end" } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_subscriptions WHERE subscription_id = $1`,
      [subscriptionId]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Subscription not found" });
    const sub = rows[0];

    if (mode === "now") {
      await pool.query(
        `
        UPDATE user_subscriptions
        SET status = 'cancelled',
            auto_renew = FALSE,
            cancel_at_period_end = FALSE,
            end_date = CURRENT_DATE
        WHERE subscription_id = $1
        `,
        [subscriptionId]
      );
      return res.json({
        success: true,
        message: "Subscription cancelled immediately.",
      });
    }

    await pool.query(
      `
      UPDATE user_subscriptions
      SET auto_renew = FALSE,
          cancel_at_period_end = TRUE
      WHERE subscription_id = $1
      `,
      [subscriptionId]
    );

    res.json({
      success: true,
      message: "Subscription will cancel at the end of the period.",
    });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;
