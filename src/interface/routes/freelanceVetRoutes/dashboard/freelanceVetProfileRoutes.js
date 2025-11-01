import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /freelance/vet/user/:userId
 * @desc    Get veterinarian info (users + veterinarians) + optional image
 * @access  Private
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  try {
    const query = `
      SELECT 
        v.vet_id,
        v.name AS vet_name,
        v.specialization,
        v.contact_number,
        u.user_id,
        u.email,
        u.role,
        vi.file_path AS image_path
      FROM users u
      JOIN veterinarians v ON v.user_id = u.user_id
      LEFT JOIN veterinarian_images vi ON vi.user_id = u.user_id
      WHERE u.user_id = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Veterinarian not found" });
    }

    const vet = rows[0];
    const imageUrl = vet.image_path
      ? `${BASE_URL.replace(/\/$/, "")}/${vet.image_path.replace(/^\/?/, "")}`
      : null;

    return res.status(200).json({
      ...vet,
      image_url: imageUrl, // return full image URL
    });
  } catch (err) {
    console.warn("⚠️ get veterinarian info failed:", err.message);
    return res.status(200).json({});
  }
});

export default router;
