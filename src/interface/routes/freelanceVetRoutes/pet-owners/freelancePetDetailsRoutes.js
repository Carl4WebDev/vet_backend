import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /vet-freelance/pet-details/:petId
 * @desc    Get detailed pet info + complete medical records (freelance vet)
 * @access  Private
 */
router.get("/:petId", async (req, res) => {
  const { petId } = req.params;
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  try {
    // 🩺 FULL MEDICAL RECORD DATA
    const query = `
      SELECT 
        mr.record_id,
        mr.pet_id,
        mr.vet_id,
        mr.description,
        mr.test_results,
        mr.notes,
        mr.key_action,
        mr.is_contagious,
        mr.contagious_disease,
        mr.created_at,

        -- 🐾 Pet Info
        p.name AS pet_name,
        p.age AS pet_age,
        p.weight AS pet_weight,
        p.gender AS pet_gender,
        p.birthday AS pet_birthday,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.bio AS pet_bio,

        -- 🖼️ Pet Image
        pet_img.file_path AS pet_image_path,

        -- 👩‍🦰 Client Info
        c.client_name,
        c.phone AS client_phone,
        addr.street, addr.city, addr.province,
        client_img.file_path AS client_image_path,

        -- 🧭 Visit Info
        v.visit_id,
        v.visit_date,
        v.visit_time,
        v.duration,
        v.visit_type,
        v.chief_complaint,
        v.visit_reason,

        -- 🧑‍⚕️ Vet Info
        vt.name AS veterinarian_name,
        vt.specialization AS veterinarian_specialization,

        -- 🩺 Diagnosis and Assessment
        d.primary_diagnosis,
        d.body_condition,
        d.overall_health,

        -- 🔬 Tests and Procedures
        t.fecal_examination,
        t.physical_examination,

        -- 💊 Medication and Treatment
        m.medication_given,
        m.prescriptions,
        m.treatment,

        -- ❤️ Vital Signs
        vs.weight AS vital_weight,
        vs.temperature AS vital_temperature,
        vs.heart_rate AS vital_heart_rate,
        vs.resp_rate AS vital_resp_rate

      FROM medical_records mr
      JOIN visits v ON v.visit_id = mr.visit_id
      JOIN veterinarians vt ON vt.vet_id = mr.vet_id
      JOIN pets p ON p.pet_id = mr.pet_id
      JOIN clients c ON c.client_id = p.client_id
      LEFT JOIN addresses addr ON c.address_id = addr.address_id

      LEFT JOIN diagnosis_and_assessment d ON d.record_id = mr.record_id
      LEFT JOIN tests_and_procedures t ON t.record_id = mr.record_id
      LEFT JOIN test_and_medication m ON m.record_id = mr.record_id
      LEFT JOIN vital_signs vs ON vs.visit_id = v.visit_id

      LEFT JOIN images pet_img 
        ON pet_img.entity_type = 'pet' 
        AND pet_img.entity_id = p.pet_id
        AND pet_img.image_role = 'main'

      LEFT JOIN images client_img 
        ON client_img.entity_type = 'client' 
        AND client_img.entity_id = c.client_id
        AND client_img.image_role = 'main'

      WHERE mr.pet_id = $1
      ORDER BY v.visit_date DESC, mr.created_at DESC;
    `;

    const result = await pool.query(query, [petId]);

    // ✅ No medical record found → still return pet + owner info
    if (result.rows.length === 0) {
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
          i.file_path AS pet_image_path,
          c.client_name,
          c.phone AS client_phone,
          addr.street, addr.city, addr.province,
          ci.file_path AS client_image_path
        FROM pets p
        JOIN clients c ON c.client_id = p.client_id
        LEFT JOIN addresses addr ON c.address_id = addr.address_id
        LEFT JOIN images i
          ON i.entity_type = 'pet' 
          AND i.entity_id = p.pet_id
          AND i.image_role = 'main'
        LEFT JOIN images ci
          ON ci.entity_type = 'client'
          AND ci.entity_id = c.client_id
          AND ci.image_role = 'main'
        WHERE p.pet_id = $1;
      `;
      const petRes = await pool.query(petQuery, [petId]);
      const pet = petRes.rows[0];

      return res.status(200).json({
        pet: {
          ...pet,
          pet_image_url: pet?.pet_image_path
            ? `${BASE_URL.replace(/\/$/, "")}/${pet.pet_image_path.replace(
                /^\/?/,
                ""
              )}`
            : null,
          client_image_url: pet?.client_image_path
            ? `${BASE_URL.replace(/\/$/, "")}/${pet.client_image_path.replace(
                /^\/?/,
                ""
              )}`
            : null,
        },
        medical: [],
      });
    }

    // ✅ Get documents per visit
    const recordsWithDocuments = await Promise.all(
      result.rows.map(async (r, idx) => {
        const docsQuery = `
          SELECT document_id, visit_id, file_name, file_path, mime_type, created_at
          FROM documents
          WHERE visit_id = $1
          ORDER BY created_at DESC;
        `;
        const docsRes = await pool.query(docsQuery, [r.visit_id]);

        const documents = docsRes.rows.map((doc) => ({
          ...doc,
          document_url: doc.file_path
            ? `${BASE_URL.replace(/\/$/, "")}/${doc.file_path.replace(
                /^\/?/,
                ""
              )}`
            : null,
        }));

        return {
          ...r,
          label: `Medical History ${idx + 1}`,
          visit_date: r.visit_date
            ? new Date(r.visit_date).toISOString().split("T")[0]
            : "N/A",
          pet_image_url: r.pet_image_path
            ? `${BASE_URL.replace(/\/$/, "")}/${r.pet_image_path.replace(
                /^\/?/,
                ""
              )}`
            : null,
          client_image_url: r.client_image_path
            ? `${BASE_URL.replace(/\/$/, "")}/${r.client_image_path.replace(
                /^\/?/,
                ""
              )}`
            : null,
          documents,
        };
      })
    );

    return res.status(200).json({
      pet: recordsWithDocuments[0], // 🐶 basic info from first record
      medical: recordsWithDocuments,
    });
  } catch (err) {
    console.error("❌ get freelance pet details failed:", err.message);
    return res.status(500).json({ error: "Failed to fetch pet details" });
  }
});

export default router;
