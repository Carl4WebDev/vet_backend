import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/* ⚙️ Ensure upload directory */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* 🧾 Multer setup for document upload */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/documents";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/**
 * @route POST /vet-freelance/medical-records/add/:petId
 * @desc  Add medical record (freelance veterinarian)
 */
router.post("/add/:petId", upload.array("files", 10), async (req, res) => {
  const client = await pool.connect();
  try {
    const { petId } = req.params;
    const data = req.body;
    const files = req.files;

    if (!data.vet_id)
      return res.status(400).json({ message: "vet_id required" });

    await client.query("BEGIN");

    // 1️⃣ Visits
    const visitRes = await client.query(
      `
      INSERT INTO visits (
        pet_id, vet_id, visit_date, visit_time, duration, visit_type, chief_complaint, visit_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING visit_id
      `,
      [
        petId,
        data.vet_id,
        data.visit_date,
        data.visit_time,
        data.duration,
        data.visit_type,
        data.chief_complaint,
        data.visit_reason,
      ]
    );
    const visitId = visitRes.rows[0].visit_id;

    // 2️⃣ Medical Record
    const medRes = await client.query(
      `
      INSERT INTO medical_records (
        pet_id, visit_id, vet_id, description, test_results, notes, key_action,
        is_contagious, contagious_disease, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING record_id
      `,
      [
        petId,
        visitId,
        data.vet_id,
        data.description,
        data.test_results,
        data.notes,
        data.key_action,
        data.is_contagious === "Yes",
        data.contagious_disease || null,
      ]
    );
    const recordId = medRes.rows[0].record_id;

    // 3️⃣ Diagnosis
    await client.query(
      `
      INSERT INTO diagnosis_and_assessment (
        record_id, primary_diagnosis, body_condition, overall_health
      ) VALUES ($1,$2,$3,$4)
      `,
      [
        recordId,
        data.primary_diagnosis,
        data.body_condition,
        data.overall_health,
      ]
    );

    // 4️⃣ Tests
    await client.query(
      `
      INSERT INTO tests_and_procedures (
        record_id, fecal_examination, physical_examination
      ) VALUES ($1,$2,$3)
      `,
      [recordId, data.fecal_examination, data.physical_examination]
    );

    // 5️⃣ Medication
    await client.query(
      `
      INSERT INTO test_and_medication (
        record_id, medication_given, prescriptions, treatment
      ) VALUES ($1,$2,$3,$4)
      `,
      [recordId, data.medication_given, data.prescriptions, data.treatment]
    );

    // 6️⃣ Vital Signs
    await client.query(
      `
      INSERT INTO vital_signs (
        visit_id, weight, temperature, heart_rate, resp_rate
      ) VALUES ($1,$2,$3,$4,$5)
      `,
      [visitId, data.weight, data.temperature, data.heart_rate, data.resp_rate]
    );

    // 7️⃣ Uploaded documents
    if (files && files.length > 0) {
      for (const file of files) {
        await client.query(
          `
          INSERT INTO documents (visit_id, file_name, mime_type, file_path, created_at)
          VALUES ($1,$2,$3,$4,NOW())
          `,
          [
            visitId,
            file.originalname,
            file.mimetype,
            `uploads/documents/${file.filename}`,
          ]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "✅ Health record added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ add freelance record failed:", err);
    res
      .status(500)
      .json({ message: "Error adding medical record", error: err.message });
  } finally {
    client.release();
  }
});

export default router;
