import express from "express";
import { pool } from "../../../infrastructure/config/db.js";
const router = express.Router();
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

function buildPublicUrl(base, path) {
  if (!path) return null;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/**
 * ✅ GET /api/pets/full/:petId
 * Fetch full pet info + image URLs + medical records
 */
router.get("/full/:petId", async (req, res) => {
  const { petId } = req.params;

  try {
    // 🐾 Fetch pet info + images
    const petQuery = `
      SELECT 
        p.pet_id,
        p.name AS pet_name,
        p.age AS pet_age,
        p.weight AS pet_weight,
        p.gender AS pet_gender,
        p.birthday AS pet_birthday,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.bio AS pet_bio,
        -- Images (main + background)
        (SELECT file_path FROM images WHERE entity_type='pet' AND entity_id=p.pet_id AND image_role='main' LIMIT 1) AS main_image_path,
        (SELECT file_path FROM images WHERE entity_type='pet' AND entity_id=p.pet_id AND image_role='background' LIMIT 1) AS background_image_path
      FROM pets p
      WHERE p.pet_id = $1
    `;
    const petResult = await pool.query(petQuery, [petId]);

    if (!petResult.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Pet not found", data: null });

    const pet = petResult.rows[0];

    // 🩺 Fetch medical records
    const recordsQuery = `
      SELECT 
        mr.record_id,
        mr.description,
        mr.test_results,
        mr.notes,
        mr.key_action,
        v.visit_date,
        vt.name AS veterinarian_name,
        d.primary_diagnosis,
        m.medication_given
      FROM medical_records mr
      JOIN visits v ON v.visit_id = mr.visit_id
      JOIN veterinarians vt ON vt.vet_id = mr.vet_id
      LEFT JOIN diagnosis_and_assessment d ON d.diagnosis_id = mr.diagnosis_id
      LEFT JOIN test_and_medication m ON m.medications_id = mr.medications_id
      WHERE mr.pet_id = $1
      ORDER BY v.visit_date DESC, mr.created_at DESC;
    `;
    const recordResult = await pool.query(recordsQuery, [petId]);

    // 🧩 Clean + fallback output
    const cleanPet = {
      pet_id: pet.pet_id,
      name: pet.pet_name || "Unnamed Pet",
      age: pet.pet_age ?? null,
      weight: pet.pet_weight ?? null,
      gender: pet.pet_gender || "unknown",
      birthday: pet.pet_birthday || null,
      species: pet.pet_species || "N/A",
      breed: pet.pet_breed || "N/A",
      bio: pet.pet_bio || "No bio available",
      main_image_url:
        buildPublicUrl(BASE_URL, pet.main_image_path) ||
        `${BASE_URL}/defaults/pet-main.png`,
      background_image_url:
        buildPublicUrl(BASE_URL, pet.background_image_path) ||
        `${BASE_URL}/defaults/pet-bg.png`,
      medical_records:
        recordResult.rows.length > 0
          ? recordResult.rows.map((r) => ({
              record_id: r.record_id,
              date: r.visit_date || null,
              description: r.description || "No description",
              veterinarian: r.veterinarian_name || "Unknown",
              diagnosis: r.primary_diagnosis || "N/A",
              medication: r.medication_given || "N/A",
              notes: r.notes || "N/A",
              key_action: r.key_action || "N/A",
              test_results: r.test_results || "N/A",
            }))
          : [],
    };

    res.json({
      success: true,
      message: "Pet profile retrieved successfully",
      data: cleanPet,
    });
  } catch (error) {
    console.error("❌ Error fetching pet full profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pet profile",
      error: error.message,
    });
  }
});

export default router;
