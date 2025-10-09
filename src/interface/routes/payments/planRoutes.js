// routes/planRoutes.js
import { Router } from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT plan_id, name, description, price, billing_cycle FROM subscription_plans ORDER BY price ASC"
    );
    res.json({ plans: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load plans" });
  }
});

export default router;
