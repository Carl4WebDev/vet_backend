import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * 🩺 GET all patient records for a freelance veterinarian
 */
router.get("/patient-records/:vetId", async (req, res) => {
  const { vetId } = req.params;

  if (!vetId || isNaN(vetId)) {
    return res
      .status(400)
      .json({ message: "Invalid or missing veterinarian ID." });
  }

  try {
    const query = `
      SELECT 
        a.appointment_id,
        a.date,
        a.start_time,
        a.end_time,
        at.name AS reason,
        a.status,
        c.client_name AS customer_name,
        p.name AS pet_name,
        p.pet_id,
        p.breed,
        v.name AS veterinarian_name,

        -- ✅ Only bring latest contagious record per pet
        COALESCE(m.is_contagious, false) AS is_contagious,
        m.contagious_disease

      FROM appointments a
      JOIN clients c ON a.client_id = c.client_id
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN veterinarians v ON a.vet_id = v.vet_id
      JOIN appointmenttypes at ON a.type_id = at.type_id

      -- ✅ link to pet_id, not vet_id
      LEFT JOIN medical_records m ON m.pet_id = p.pet_id
        AND m.is_contagious = true
        AND m.contagious_disease IS NOT NULL
        AND m.created_at = (
          SELECT MAX(m2.created_at)
          FROM medical_records m2
          WHERE m2.pet_id = p.pet_id
            AND m2.is_contagious = true
            AND m2.contagious_disease IS NOT NULL
        )

      WHERE a.vet_id = $1
      ORDER BY a.date DESC, a.start_time ASC;
    `;

    const result = await pool.query(query, [vetId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching freelance vet patient records:", error);
    res.status(500).json({
      message: "Database query failed while retrieving patient records.",
      error: error.message,
    });
  }
});

export default router;
