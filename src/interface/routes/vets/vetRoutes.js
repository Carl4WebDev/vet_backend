import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/* 🧑‍⚕️ Get all veterinarians for a clinic */
/* 🧑‍⚕️ Get all veterinarians for a clinic */
router.get("/get-veterinarians/:clinicId", async (req, res) => {
  try {
    const { clinicId } = req.params;

    const query = `
      SELECT 
        v.vet_id,
        v.name,
        v.specialization,
        v.contact_number,
        v.email,
        v.department,
        u.created_at
      FROM veterinarians v
      JOIN users u ON v.user_id = u.user_id
      WHERE v.clinic_id = $1
      ORDER BY u.created_at DESC;
    `;

    const { rows } = await pool.query(query, [clinicId]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching veterinarians:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch veterinarians" });
  }
});

/* ➕ Add veterinarian (linked to Users table) */
router.post("/add-veterinarian", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      clinic_id,
      name,
      specialization,
      position,
      email,
      password,
      contact_number,
      department,
    } = req.body;

    if (!clinic_id || !email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // ✅ 1. Create a new user with veterinarian role
    const hashed = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, 'veterinarian')
      RETURNING user_id;
    `,
      [email, hashed]
    );

    const user_id = userRes.rows[0].user_id;

    // ✅ 2. Insert veterinarian linked to that user
    const vetRes = await client.query(
      `
      INSERT INTO veterinarians (
        clinic_id, name, specialization, position, email, password, contact_number, department, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `,
      [
        clinic_id,
        name,
        specialization || null,
        position || "Veterinarian",
        email,
        hashed,
        contact_number || null,
        department || null,
        user_id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Veterinarian added and linked to user account",
      data: vetRes.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error adding veterinarian:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add veterinarian" });
  } finally {
    client.release();
  }
});

/* ✏️ Edit veterinarian info */
router.put("/edit-veterinarian/:vetId", async (req, res) => {
  try {
    const { vetId } = req.params;
    const {
      name,
      specialization,
      position,
      email,
      contact_number,
      department,
    } = req.body;

    const updateQuery = `
      UPDATE veterinarians
      SET 
        name = COALESCE($1, name),
        specialization = COALESCE($2, specialization),
        position = COALESCE($3, position),
        email = COALESCE($4, email),
        contact_number = COALESCE($5, contact_number),
        department = COALESCE($6, department)
      WHERE vet_id = $7
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [
      name,
      specialization,
      position,
      email,
      contact_number,
      department,
      vetId,
    ]);

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Veterinarian not found" });

    res
      .status(200)
      .json({ success: true, message: "Veterinarian updated", data: rows[0] });
  } catch (err) {
    console.error("❌ Error editing veterinarian:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update veterinarian" });
  }
});

/* 🗑️ Delete veterinarian */
router.delete("/delete-veterinarian/:vetId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { vetId } = req.params;

    await client.query("BEGIN");

    // 🔹 Fetch user_id linked to this veterinarian
    const vetRes = await client.query(
      `SELECT user_id FROM veterinarians WHERE vet_id = $1;`,
      [vetId]
    );

    if (vetRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Veterinarian not found" });
    }

    const userId = vetRes.rows[0].user_id;

    // 🔹 Delete veterinarian record
    await client.query(`DELETE FROM veterinarians WHERE vet_id = $1;`, [vetId]);

    // 🔹 Delete linked user record
    await client.query(`DELETE FROM users WHERE user_id = $1;`, [userId]);

    await client.query("COMMIT");

    res
      .status(200)
      .json({ success: true, message: "Veterinarian and linked user deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error deleting veterinarian:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete veterinarian" });
  } finally {
    client.release();
  }
});

export default router;
