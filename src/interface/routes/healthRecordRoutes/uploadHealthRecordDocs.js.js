import express from "express";
import { pool } from "../../../infrastructure/config/db.js";
import { uploadDocument } from "../../../infrastructure/config/multer.js";

const router = express.Router();

// POST /api/health-records/:visitId/documents
router.post(
  "/:visitId/documents",
  uploadDocument.array("files", 10),
  async (req, res) => {
    const { visitId } = req.params;

    try {
      if (!visitId)
        return res.status(400).json({ message: "Missing visit ID." });
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ message: "No files uploaded." });

      const insertPromises = req.files.map((file) => {
        const { filename, mimetype, path: filePath } = file;
        const query = `
        INSERT INTO documents (visit_id, file_name, mime_type, file_path)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
        return pool.query(query, [visitId, filename, mimetype, filePath]);
      });

      const results = await Promise.all(insertPromises);
      res.status(201).json({
        message: "Documents uploaded successfully.",
        files: results.map((r) => r.rows[0]),
      });
    } catch (error) {
      console.error("❌ Error uploading documents:", error);
      res
        .status(500)
        .json({ message: "Server error while uploading documents." });
    }
  }
);

export default router;
