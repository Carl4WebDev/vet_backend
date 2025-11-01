// 📂 routes/dashboard/freelanceScheduleRoutes.js
import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /freelance/schedule/:vetId
 * @desc    Fetch today's appointments for a freelance veterinarian
 * @access  Private
 */
router.get("/:vetId", async (req, res) => {
  const { vetId } = req.params;

  const defaultResponse = { schedule: [] };

  try {
    const query = `
      SELECT 
        a.appointment_id,
        a.date,
        a.start_time,
        a.end_time,
        a.status,
        p.name AS pet_name,
        c.client_name,
        at.name AS appointment_type
      FROM appointments a
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN clients c ON a.client_id = c.client_id
      JOIN appointmenttypes at ON a.type_id = at.type_id
      WHERE a.vet_id = $1
        AND a.date = CURRENT_DATE
      ORDER BY a.start_time ASC;
    `;

    const { rows } = await pool.query(query, [vetId]);
    return res.status(200).json({ schedule: rows });
  } catch (err) {
    console.warn("⚠️ get today's schedule query failed:", err.message);
    return res.status(200).json(defaultResponse); // safe fallback
  }
});

export default router;
