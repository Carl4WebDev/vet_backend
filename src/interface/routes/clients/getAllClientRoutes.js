import express from "express";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * 🧠 GET /clients/all
 * Returns all clients with their main image URL
 */
router.get("/all", async (req, res) => {
  try {
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    const query = `
      SELECT 
        c.client_id,
        c.client_name,
        c.phone,
        c.tel_num,
        c.gender,
        c.address_id,
        c.user_id,
        c.clinic_id,
        c.bio,
        i.file_path AS image_path,
        CASE
          WHEN i.file_path IS NOT NULL 
          THEN '${BASE_URL}' || i.file_path
          ELSE NULL
        END AS image_url
      FROM clients c
      LEFT JOIN images i 
        ON i.entity_type = 'client' 
        AND i.entity_id = c.client_id 
        AND i.image_role = 'main'
      ORDER BY c.client_id ASC;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("❌ Error fetching clients:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: err.message,
    });
  }
});

export default router;
