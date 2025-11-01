import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   POST /auth/vet-freelancer/register
 * @desc    Register a freelance veterinarian (not linked to any clinic)
 * @access  Public
 */
router.post("/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, specialization, email, contact_number, password } = req.body;

    // Basic validations
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    // Check if email already exists
    const existingUser = await client.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // 1️⃣ Insert into users table (role = veterinarian)
    const userInsert = await client.query(
      `
      INSERT INTO users (email, password, role, created_at, is_banned, secret_key, role_id)
      VALUES ($1, $2, 'veterinarian', NOW(), false, 'default_key', 4)
      RETURNING user_id;
      `,
      [email, hashedPassword]
    );
    const userId = userInsert.rows[0].user_id;

    // 2️⃣ Ensure employment_type column exists in veterinarians
    await client.query(`
      ALTER TABLE veterinarians 
      ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20)
      DEFAULT 'employed'
      CHECK (employment_type IN ('employed', 'freelancer'));
    `);

    // 3️⃣ Insert into veterinarians table (no clinic_id since freelancer)
    await client.query(
      `
      INSERT INTO veterinarians 
        (name, specialization, clinic_id, "position", email, password, contact_number, department, user_id, employment_type)
      VALUES 
        ($1, $2, NULL, 'Freelance Veterinarian', $3, $4, $5, 'Independent Practice', $6, 'freelancer');
      `,
      [name, specialization, email, hashedPassword, contact_number, userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Freelance veterinarian registered successfully.",
      data: { user_id: userId, email, name },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error registering vet freelancer:", error);
    res.status(500).json({ message: "Server error during registration." });
  } finally {
    client.release();
  }
});

/**
 * @route   POST /auth/vet-freelancer/login
 * @desc    Login for freelance veterinarians
 * @access  Public
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Find user
    const userRes = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'veterinarian'`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: "Account not found." });
    }

    const user = userRes.rows[0];

    // 2️⃣ Check if user is a freelancer vet
    const vetRes = await pool.query(
      `
      SELECT 
        v.vet_id,
        v.name AS vet_name,
        v.specialization,
        v.contact_number,
        v.employment_type,
        v.clinic_id
      FROM veterinarians v
      WHERE v.user_id = $1 AND v.employment_type = 'freelancer'
      `,
      [user.user_id]
    );

    if (vetRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Access denied — not a freelance veterinarian." });
    }

    const vet = vetRes.rows[0];

    // 3️⃣ Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4️⃣ Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        vet_id: vet.vet_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    // 5️⃣ Return combined user + vet info
    res.status(200).json({
      success: true,
      message: "Freelance veterinarian login successful.",
      token,
      user: {
        user_id: user.user_id,
        vet_id: vet.vet_id,
        email: user.email,
        role: user.role,
        vet_name: vet.vet_name,
        specialization: vet.specialization,
        contact_number: vet.contact_number,
        experience_years: vet.experience_years,
        employment_type: vet.employment_type,
        license_number: vet.license_number,
        clinic_id: vet.clinic_id,
        vet_created_at: vet.vet_created_at,
      },
    });
  } catch (error) {
    console.error("❌ Error logging in vet freelancer:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

export default router;
