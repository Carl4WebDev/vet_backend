import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/* 🧩 Ensure upload folders exist */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* 📸 Multer setup */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entity = req.body.entity_type || "misc";
    const dir = `./uploads/${entity}`;
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

/* 🌍 Build full URL */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const toPublicUrl = (filePath) =>
  `${BASE_URL.replace(/\/$/, "")}/${filePath.replace(/^\/?/, "")}`;

/* 🧱 1️⃣ Upload or replace image */
router.post("/", upload.single("image"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { entity_type, entity_id, image_role } = req.body;
    if (!req.file)
      return res.status(400).json({ message: "No image file uploaded." });
    if (!entity_type || !entity_id || !image_role)
      return res
        .status(400)
        .json({ message: "entity_type, entity_id, image_role are required." });

    const filePath = req.file.path.replace(/\\/g, "/"); // normalize
    const role = image_role.toLowerCase();

    await client.query("BEGIN");

    // if main/background: replace existing
    if (role === "main" || role === "background") {
      await client.query(
        `DELETE FROM images WHERE entity_type=$1 AND entity_id=$2 AND image_role=$3`,
        [entity_type, entity_id, role]
      );
    }

    const insert = `
      INSERT INTO images (file_path, entity_type, entity_id, image_role)
      VALUES ($1, $2, $3, $4)
      RETURNING image_id, file_path, image_role
    `;
    const { rows } = await client.query(insert, [
      filePath,
      entity_type,
      entity_id,
      role,
    ]);

    await client.query("COMMIT");

    const saved = rows[0];
    return res.json({
      message: "✅ Image uploaded successfully",
      image: {
        ...saved,
        url: toPublicUrl(saved.file_path),
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Upload error:", err);
    return res
      .status(500)
      .json({ message: "Upload failed", error: err.message });
  } finally {
    client.release();
  }
});

/* 🧱 2️⃣ Get all images of an entity (with optional role filter) */
router.get("/:entity_type/:entity_id", async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const { role } = req.query;

    let q = `
      SELECT image_id, file_path, image_role
      FROM images
      WHERE entity_type=$1 AND entity_id=$2
    `;
    const params = [entity_type, entity_id];

    if (role) {
      q += ` AND image_role=$3`;
      params.push(role);
    }

    q += ` ORDER BY image_id DESC`;

    const { rows } = await pool.query(q, params);

    if (!role) {
      const main = rows.find((r) => r.image_role === "main");
      const background = rows.find((r) => r.image_role === "background");
      const gallery = rows.filter((r) => r.image_role === "gallery");

      return res.json({
        main: main ? { ...main, url: toPublicUrl(main.file_path) } : null,
        background: background
          ? { ...background, url: toPublicUrl(background.file_path) }
          : null,
        gallery: gallery.map((g) => ({
          ...g,
          url: toPublicUrl(g.file_path),
        })),
      });
    }

    return res.json(
      rows.map((r) => ({
        ...r,
        url: toPublicUrl(r.file_path),
      }))
    );
  } catch (err) {
    console.error("Fetch error:", err);
    return res
      .status(500)
      .json({ message: "Fetch failed", error: err.message });
  }
});

/* 🧱 3️⃣ Optional: Delete an image by ID */
router.delete("/:image_id", async (req, res) => {
  try {
    const { image_id } = req.params;
    const q = `DELETE FROM images WHERE image_id=$1 RETURNING *`;
    const { rows } = await pool.query(q, [image_id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Image not found" });

    res.json({ message: "🗑️ Image deleted successfully", deleted: rows[0] });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

export default router;
