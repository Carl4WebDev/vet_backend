import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

// 🧩 Ensure directory exists
const uploadDir = "./uploads/vets";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ⚙️ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `vet_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/* ============================================================
   🧩 1️⃣ Update Veterinarian Info + Image
   PUT /vets/settings/:vetId
============================================================ */
router.put("/:vetId", upload.single("image"), async (req, res) => {
  const { vetId } = req.params;
  const { name, specialization, contact_number } = req.body;
  const file = req.file;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Update veterinarian info
    await client.query(
      `UPDATE veterinarians
       SET name = $1, specialization = $2, contact_number = $3
       WHERE vet_id = $4`,
      [name, specialization, contact_number, vetId]
    );

    // ✅ Handle new profile image (overwrite or insert)
    if (file) {
      const imagePath = path
        .join("uploads/vets", file.filename)
        .replace(/\\/g, "/");

      // Check if vet already has an image
      const existing = await client.query(
        `SELECT image_id FROM veterinarian_images WHERE user_id = (
           SELECT user_id FROM veterinarians WHERE vet_id = $1
         )`,
        [vetId]
      );

      if (existing.rows.length > 0) {
        // Update existing
        await client.query(
          `UPDATE veterinarian_images
           SET file_path = $1, uploaded_at = CURRENT_TIMESTAMP
           WHERE user_id = (
             SELECT user_id FROM veterinarians WHERE vet_id = $2
           )`,
          [imagePath, vetId]
        );
      } else {
        // Insert new
        await client.query(
          `INSERT INTO veterinarian_images (user_id, file_path, uploaded_at)
           VALUES (
             (SELECT user_id FROM veterinarians WHERE vet_id = $1),
             $2,
             CURRENT_TIMESTAMP
           )`,
          [vetId, imagePath]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "✅ Veterinarian info updated successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Vet info update error:", err);
    res.status(500).json({ error: "Failed to update veterinarian info." });
  } finally {
    client.release();
  }
});

/* ============================================================
   🧩 2️⃣ Change Veterinarian Password
   PUT /vets/settings/change-password/:vetId
============================================================ */
router.put("/change-password/:vetId", async (req, res) => {
  const { vetId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const userRes = await pool.query(
      `SELECT u.user_id, u.password
       FROM users u
       JOIN veterinarians v ON v.user_id = u.user_id
       WHERE v.vet_id = $1`,
      [vetId]
    );

    if (!userRes.rows.length)
      return res.status(404).json({ error: "Veterinarian not found." });

    const user = userRes.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(401).json({ error: "Incorrect old password." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE user_id = $2`, [
      hashed,
      user.user_id,
    ]);

    res.json({ message: "✅ Password updated successfully!" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ error: "Failed to change password." });
  }
});

export default router;
