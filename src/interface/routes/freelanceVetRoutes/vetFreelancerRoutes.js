import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/**
 * @route GET /vets/freelancers/all
 * @desc  Fetch all veterinarians with user_id (for chat)
 */
router.get("/all", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.email,
        u.role,
        v.vet_id,
        v.name AS vet_name,
        v.specialization,
        v.contact_number,
        v.clinic_id,
        vi.file_path AS image_path
      FROM veterinarians v
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN veterinarian_images vi 
        ON vi.user_id = u.user_id  -- ✅ correct table for vet images
      WHERE u.role = 'veterinarian'
      ORDER BY v.name ASC;
    `;

    const result = await pool.query(query);

    const vets = result.rows.map((r) => ({
      user_id: r.user_id, // ✅ this is what chat uses (matches messages FK)
      vet_id: r.vet_id,
      vet_name: r.vet_name,
      specialization: r.specialization,
      contact_number: r.contact_number,
      email: r.email,
      role: r.role,
      clinic_id: r.clinic_id,
      image_url: r.image_path
        ? `${BASE_URL.replace(/\/$/, "")}/${r.image_path.replace(/^\/?/, "")}`
        : `${BASE_URL}/defaults/vet-profile.png`, // ✅ default fallback
    }));

    res.json({
      success: true,
      message: "✅ Veterinarians fetched successfully",
      data: vets,
    });
  } catch (err) {
    console.error("❌ Error fetching veterinarians:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
