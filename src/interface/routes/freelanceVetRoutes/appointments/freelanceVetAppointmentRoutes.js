// src/interface/routes/freelanceVetAppointmentRoutes.js
import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /appointments/freelancer/:vetId
 * @desc    Fetch all appointments for a freelance veterinarian
 */
router.get("/freelancer/:vetId", async (req, res) => {
  try {
    const { vetId } = req.params;
    const { date, month, year } = req.query;

    let query = `
      SELECT 
        a.appointment_id,
        a.date,
        a.start_time,
        a.end_time,
        a.status,
        c.client_name AS customer_name,
        p.name AS pet_name,
        p.pet_id,
        v.name AS veterinarian_name,
        at.name AS type_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.client_id
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN veterinarians v ON a.vet_id = v.vet_id
      JOIN appointmenttypes at ON a.type_id = at.type_id
      WHERE a.vet_id = $1
    `;
    const params = [vetId];
    let i = 2;

    if (date) {
      query += ` AND a.date = $${i++}`;
      params.push(date);
    } else if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date) = $${i++}`;
      params.push(month);
      query += ` AND EXTRACT(YEAR FROM a.date) = $${i++}`;
      params.push(year);
    } else if (year) {
      query += ` AND EXTRACT(YEAR FROM a.date) = $${i++}`;
      params.push(year);
    }

    query += ` ORDER BY a.date DESC, a.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching freelancer appointments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   PUT /appointments/:appointmentId/schedule
 * @desc    Mark appointment as Scheduled
 */
router.put("/:appointmentId/schedule", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'Scheduled'
       WHERE appointment_id = $1
       RETURNING *`,
      [appointmentId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Appointment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error scheduling appointment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   PUT /appointments/:appointmentId/reject
 * @desc    Mark appointment as Rejected
 */
router.put("/:appointmentId/reject", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'Rejected'
       WHERE appointment_id = $1
       RETURNING *`,
      [appointmentId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Appointment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error rejecting appointment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   PUT /appointments/:appointmentId/complete
 * @desc    Mark appointment as Complete
 */
router.put("/:appointmentId/complete", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'Complete'
       WHERE appointment_id = $1
       RETURNING *`,
      [appointmentId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Appointment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error completing appointment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
