// 📂 routes/dashboard/freelanceDashboardRoutes.js
import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /freelance/dashboard/:vetId
 * @desc    Fetch chart + summary data for the freelance veterinarian dashboard
 * @access  Private
 */
router.get("/:vetId", async (req, res) => {
  const { vetId } = req.params;

  const responseData = {
    petTypes: [],
    contagiousDiseases: [],
    visitPurpose: [],
    summary: { new_patients: 0, transferees: 0, week_visitors: 0 },
  };

  try {
    // 🐾 Type of pet admitted
    try {
      const petTypeQuery = `
        SELECT 
          p.species AS name,
          COUNT(*)::int AS value
        FROM visits v
        JOIN pets p ON v.pet_id = p.pet_id
        WHERE v.vet_id = $1
        GROUP BY p.species;
      `;
      const { rows } = await pool.query(petTypeQuery, [vetId]);
      responseData.petTypes = rows;
    } catch (err) {
      console.warn("⚠️ petTypes query failed:", err.message);
    }

    // 🧫 Contagious diseases by pet type
    try {
      const contagiousQuery = `
        SELECT 
          p.species AS name,
          COUNT(*)::int AS value
        FROM medical_records mr
        JOIN pets p ON mr.pet_id = p.pet_id
        WHERE mr.vet_id = $1
          AND mr.is_contagious = true
        GROUP BY p.species;
      `;
      const { rows } = await pool.query(contagiousQuery, [vetId]);
      responseData.contagiousDiseases = rows;
    } catch (err) {
      console.warn("⚠️ contagiousDiseases query failed:", err.message);
    }

    // 💉 Purpose of visit (last 4 weeks)
    try {
      const visitPurposeQuery = `
        SELECT 
          COALESCE(v.visit_reason, 'Unspecified') AS name,
          COUNT(*)::int AS value
        FROM visits v
        WHERE v.vet_id = $1
          AND v.visit_date >= CURRENT_DATE - INTERVAL '4 weeks'
        GROUP BY v.visit_reason
        ORDER BY value DESC
        LIMIT 5;
      `;
      const { rows } = await pool.query(visitPurposeQuery, [vetId]);
      responseData.visitPurpose = rows;
    } catch (err) {
      console.warn("⚠️ visitPurpose query failed:", err.message);
    }

    // 📈 Summary stats (safe defaults)
    try {
      const summaryQuery = `
        SELECT
          COUNT(DISTINCT CASE WHEN v.visit_date = CURRENT_DATE THEN v.pet_id END)::int AS new_patients,
          COUNT(DISTINCT CASE WHEN v.visit_date >= CURRENT_DATE - INTERVAL '7 days' THEN v.pet_id END)::int AS week_visitors,
          COUNT(DISTINCT CASE WHEN c.clinic_id IS NULL THEN v.pet_id END)::int AS transferees
        FROM visits v
        JOIN pets p ON v.pet_id = p.pet_id
        JOIN clients c ON p.client_id = c.client_id
        WHERE v.vet_id = $1;
      `;
      const { rows } = await pool.query(summaryQuery, [vetId]);
      responseData.summary = rows[0] || responseData.summary;
    } catch (err) {
      console.warn("⚠️ summary query failed:", err.message);
    }

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("❌ Dashboard route unexpected error:", err.message);
    // Never throw global — return safe empty data instead
    return res.status(200).json(responseData);
  }
});

export default router;
