// for creating new pet

import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

// 🐾 Multer storage config (save to ./uploads/pets)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/pets"); // ✅ path matches your DB usage (uploads/pets)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// 🧠 Create a new pet with main image (POST /api/pets/create-pet)
router.post("/create-pet", upload.single("main_image"), async (req, res) => {
  const {
    clientId,
    name,
    age,
    weight,
    gender,
    birthdate,
    species,
    breed,
    bio,
  } = req.body;

  const file = req.file;

  try {
    // ✅ Validate required fields
    if (!clientId || !name) {
      return res.status(400).json({
        success: false,
        message: "clientId and name are required fields.",
      });
    }

    // 1️⃣ Insert into pets table
    const insertPetQuery = `
      INSERT INTO pets (client_id, name, age, weight, gender, birthday, species, breed, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING pet_id;
    `;
    const { rows } = await pool.query(insertPetQuery, [
      clientId,
      name,
      age || null,
      weight || null,
      gender?.toLowerCase() || null,
      birthdate || null,
      species || null,
      breed || null,
      bio || null,
    ]);

    const petId = rows[0].pet_id;

    // 2️⃣ Insert image into images table (role = 'main')
    if (file) {
      const insertImageQuery = `
        INSERT INTO images (entity_type, entity_id, file_path, file_name, mime_type, image_role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
      `;
      await pool.query(insertImageQuery, [
        "pet",
        petId,
        `/uploads/pets/${file.filename}`,
        file.originalname,
        file.mimetype,
        "main", // ✅ mark as main image
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Pet created successfully!",
      data: {
        pet_id: petId,
        name,
        image_path: file ? `/uploads/pets/${file.filename}` : null,
      },
    });
  } catch (error) {
    console.error("❌ Error creating pet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pet.",
      error: error.message,
    });
  }
});

export default router;
