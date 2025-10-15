import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/* 🧩 Ensure directory exists */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ⚙️ Multer setup for pet images */
const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/pets";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage: petStorage });

/* 🌍 Public URL helper */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const toPublicUrl = (filePath) =>
  `${BASE_URL.replace(/\/$/, "")}/${filePath.replace(/^\/?/, "")}`;

/* 🐾 PUT /pets/update/:petId
   Updates pet info + uploads main/background images (optional)
*/
router.put(
  "/update/:petId",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "background_image", maxCount: 1 },
  ]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { petId } = req.params;
      const {
        name,
        age,
        weight,
        gender,
        birthday,
        species,
        breed,
        bio,
        client_id, // optional
      } = req.body;

      await client.query("BEGIN");

      // 🧠 1️⃣ Update pet basic info
      const updateQuery = `
      UPDATE pets
      SET name = COALESCE($1, name),
          age = COALESCE($2, age),
          weight = COALESCE($3, weight),
          gender = COALESCE($4, gender),
          birthday = COALESCE($5, birthday),
          species = COALESCE($6, species),
          breed = COALESCE($7, breed),
          bio = COALESCE($8, bio)
      WHERE pet_id = $9
      RETURNING *;
    `;
      const { rows: updatedPet } = await client.query(updateQuery, [
        name || null,
        age || null,
        weight || null,
        gender ? gender.toLowerCase() : null,
        birthday || null,
        species || null,
        breed || null,
        bio || null,
        petId,
      ]);

      // 🐕 2️⃣ Handle images
      const files = req.files || {};

      const insertImage = async (file, role) => {
        const filePath = file.path.replace(/\\/g, "/");

        // delete existing main/background if exists
        await client.query(
          `DELETE FROM images WHERE entity_type='pet' AND entity_id=$1 AND image_role=$2`,
          [petId, role]
        );

        // insert new
        await client.query(
          `INSERT INTO images (file_path, entity_type, entity_id, image_role)
         VALUES ($1, 'pet', $2, $3)`,
          [filePath, petId, role]
        );

        return toPublicUrl(filePath);
      };

      let mainImageUrl = null;
      let bgImageUrl = null;

      if (files.main_image && files.main_image[0]) {
        mainImageUrl = await insertImage(files.main_image[0], "main");
      }

      if (files.background_image && files.background_image[0]) {
        bgImageUrl = await insertImage(files.background_image[0], "background");
      }

      await client.query("COMMIT");

      res.status(200).json({
        success: true,
        message: "Pet updated successfully",
        pet: updatedPet[0],
        main_image_url: mainImageUrl,
        background_image_url: bgImageUrl,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error updating pet:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update pet",
        error: err.message,
      });
    } finally {
      client.release();
    }
  }
);

export default router;
