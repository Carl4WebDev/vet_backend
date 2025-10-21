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
    const dir = "./uploads/evidence";
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

/* 🌍 BASE URL for full image links */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const toPublicUrl = (filePath) =>
  `${BASE_URL.replace(/\/$/, "")}/${filePath.replace(/^\/?/, "")}`;

/* 🧱 1️⃣ Add report */
router.post("/", upload.array("evidence_images", 5), async (req, res) => {
  const client = await pool.connect();
  try {
    const { reported_user_id, reporter_user_id, evidence_text } = req.body;

    if (!reported_user_id || !reporter_user_id || !evidence_text)
      return res
        .status(400)
        .json({ message: "All fields are required (IDs + evidence_text)" });

    const date_reported = new Date();
    const evidence_images = req.files?.map((f) =>
      toPublicUrl(f.path.replace(/\\/g, "/"))
    );

    const insertQuery = `
      INSERT INTO user_reports (reported_user_id, reporter_user_id, date_reported, evidence_text, evidence_image)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING report_id
    `;
    const { rows } = await client.query(insertQuery, [
      reported_user_id,
      reporter_user_id,
      date_reported,
      evidence_text,
      JSON.stringify(evidence_images || []),
    ]);

    res.json({
      message: "✅ Report submitted successfully",
      report_id: rows[0].report_id,
    });
  } catch (err) {
    console.error("Report insert error:", err);
    res.status(500).json({ message: "Insert failed", error: err.message });
  } finally {
    client.release();
  }
});

export default router;
