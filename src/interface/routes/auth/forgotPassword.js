import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * POST /auth/forgot-password
 * Resets user password when secret_key matches.
 */
router.post("/forgot-password", async (req, res) => {
  const { email, secret_key } = req.body;

  try {
    // 1️⃣ Find user with matching secret key
    const findUserQuery = `
      SELECT user_id FROM users WHERE email = $1 AND secret_key = $2
    `;
    const { rows } = await pool.query(findUserQuery, [email, secret_key]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or secret key" });
    }

    const userId = rows[0].user_id;

    // 2️⃣ Generate a readable new password (8–10 chars)
    const newPassword = Math.random().toString(36).slice(-10); // e.g. 'xq9z5b7hpd'

    // 3️⃣ Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4️⃣ Update in database
    await pool.query(`UPDATE users SET password = $1 WHERE user_id = $2`, [
      hashedPassword,
      userId,
    ]);

    // 5️⃣ Return the plaintext password (not the hash)
    res.json({
      message: "Password reset successful",
      password: newPassword, // <— send readable password back
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
