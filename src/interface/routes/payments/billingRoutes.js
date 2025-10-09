// routes/billingRoutes.js
import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(p.payment_date, 'YYYY-MM-DD') AS date,
        COALESCE(sp.name, 'Unknown Plan') AS details,
        CAST(p.amount AS FLOAT) AS amount,   -- ✅ FIXED HERE
        p.status,
        COALESCE(p.invoice_url, '') AS invoice_url
      FROM payments p
      LEFT JOIN user_subscriptions us ON us.subscription_id = p.subscription_id
      LEFT JOIN subscription_plans sp ON sp.plan_id = us.plan_id
      WHERE p.user_id = $1
      ORDER BY p.payment_date DESC;
      `,
      [userId]
    );

    // 🧹 Ensure clean numeric values
    const cleanRows = result.rows.map((r) => ({
      ...r,
      amount: Number(r.amount) || 0,
    }));

    res.json({ history: cleanRows });
  } catch (err) {
    console.error("Billing history error:", err);
    res.status(500).json({ error: "Failed to load billing history" });
  }
});

export default router;
