import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * 🩺 GET all patient records for a freelance veterinarian
 * @route GET /freelance-vet/patient-records/:vetId
 * @desc Fetch all patient records belonging to a specific veterinarian
 * @access Private (Freelance Vet)
 */
router.get("/patient-records/:vetId", async (req, res) => {
  const { vetId } = req.params;

  // ✅ Basic input validation
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
        v.name AS veterinarian_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.client_id
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN veterinarians v ON a.vet_id = v.vet_id
      JOIN appointmenttypes at ON a.type_id = at.type_id
      WHERE a.vet_id = $1
      ORDER BY a.date DESC, a.start_time ASC;
    `;

    const result = await pool.query(query, [vetId]);

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "❌ Error fetching freelance vet patient records:",
      error.message
    );
    res.status(500).json({
      message: "Database query failed while retrieving patient records.",
      error: error.message,
    });
  }
});

export default router;
