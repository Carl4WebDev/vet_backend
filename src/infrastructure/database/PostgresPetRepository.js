import { query } from "express-validator";
import IPetRepository from "../../domain/repositories/IPetRepository.js";

export default class PostgresPetRepository extends IPetRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }
  async addPet(pet) {
    const query = `
      INSERT INTO pets (client_id, name, age, weight, gender, birthday, species, breed, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      pet.clientId,
      pet.name,
      pet.age,
      pet.weight,
      pet.gender,
      pet.birthday,
      pet.species,
      pet.breed,
      pet.bio,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async getAllPets(clientId) {
    const BASE_URL = process.env.BASE_URL;

    const query = `
    SELECT 
      p.*,
      i.file_path AS image_path,
      COUNT(mr.record_id) AS medical_record_count
    FROM pets p
    LEFT JOIN images i 
      ON i.entity_type = 'pet' AND i.entity_id = p.pet_id
    LEFT JOIN medical_records mr 
      ON mr.pet_id = p.pet_id
    WHERE p.client_id = $1
    GROUP BY p.pet_id, i.file_path
  `;

    const { rows } = await this.pool.query(query, [clientId]);

    if (!rows || rows.length === 0) return [];

    // 🐾 Map pets with image URL and record count
    return rows.map((r) => ({
      pet_id: r.pet_id,
      client_id: r.client_id,
      name: r.name,
      species: r.species,
      breed: r.breed,
      age: r.age,
      weight: r.weight,
      gender: r.gender,
      birthday: r.birthday,
      bio: r.bio,
      medical_record_count: Number(r.medical_record_count) || 0,
      image_url: r.image_path
        ? `${BASE_URL || "http://localhost:5000"}${r.image_path}`
        : null,
    }));
  }

  async updatePet(petId, updates) {
    console.log("UPDATE PET CALLED WITH:", { petId, updates }); // ← Add this

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Check if pet exists first
      const checkQuery = "SELECT * FROM pets WHERE pet_id = $1";
      const checkResult = await client.query(checkQuery, [petId]);
      console.log("PET EXISTS CHECK:", checkResult.rows.length > 0); // ← Add this

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      // Build dynamic update query
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        "name",
        "age",
        "weight",
        "gender",
        "birthday",
        "species",
        "breed",
        "bio",
      ];

      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      console.log("SET CLAUSES:", setClauses); // ← Add this
      console.log("VALUES:", values); // ← Add this

      if (setClauses.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("No valid fields to update");
      }

      // Add petId as the last parameter
      values.push(petId);

      const updateQuery = `
      UPDATE pets 
      SET ${setClauses.join(", ")}
      WHERE pet_id = $${paramCount}
      RETURNING *
    `;

      console.log("FINAL QUERY:", updateQuery); // ← Add this

      const result = await client.query(updateQuery, values);
      await client.query("COMMIT");

      console.log("UPDATE RESULT:", result.rows[0]); // ← Add this
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database error in update:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async findById(petId) {
    const BASE_URL = process.env.BASE_URL;

    const query = `
    SELECT 
      -- 🐾 Pet Info
      p.pet_id,
      p.client_id,
      p.name,
      p.species,
      p.breed,
      p.age,
      p.weight,
      p.gender,
      p.birthday,
      p.bio,
      i.file_path AS pet_image_path,

      -- 🩺 Visit Info
      v.visit_id,
      v.visit_date,
      v.visit_time,
      v.duration,
      v.visit_type,
      v.chief_complaint,
      v.visit_reason,

      -- 🧾 Medical Record
      mr.record_id,
      mr.description,
      mr.test_results,
      mr.notes,
      mr.key_action,
      mr.created_at AS record_created_at,

      -- 🧠 Diagnosis
      d.primary_diagnosis,
      d.body_condition,
      d.overall_health,

      -- 🧪 Tests
      t.fecal_examination,
      t.physical_examination,

      -- 💊 Medication
      med.medication_given,
      med.prescriptions,
      med.treatment,

      -- ❤️ Vital Signs
      vs.weight AS vital_weight,
      vs.temperature,
      vs.heart_rate,
      vs.resp_rate,

      -- 📄 Documents
      doc.images AS document_image,

      -- 👩‍⚕️ Veterinarian Info
      vet.vet_id,
      vet.name AS vet_name,
      vet.specialization AS vet_specialization,
      vet.email AS vet_email,
      vet.contact_number AS vet_contact

    FROM pets p
    LEFT JOIN images i 
      ON i.entity_type = 'pet' AND i.entity_id = p.pet_id
    LEFT JOIN visits v 
      ON v.pet_id = p.pet_id
    LEFT JOIN medical_records mr 
      ON mr.visit_id = v.visit_id
    LEFT JOIN diagnosis_and_assessment d 
      ON d.visit_id = v.visit_id
    LEFT JOIN tests_and_procedures t 
      ON t.visit_id = v.visit_id
    LEFT JOIN test_and_medication med 
      ON med.visit_id = v.visit_id
    LEFT JOIN vital_signs vs 
      ON vs.visit_id = v.visit_id
    LEFT JOIN documents doc 
      ON doc.visit_id = v.visit_id
    LEFT JOIN veterinarians vet 
      ON v.vet_id = vet.vet_id
    WHERE p.pet_id = $1
    ORDER BY v.visit_date DESC;
  `;

    try {
      const result = await this.pool.query(query, [petId]);
      if (result.rows.length === 0) return null;

      const first = result.rows[0];

      // 🐶 Pet Info
      const pet = {
        pet_id: first.pet_id,
        client_id: first.client_id,
        name: first.name,
        species: first.species,
        breed: first.breed,
        age: first.age,
        weight: first.weight,
        gender: first.gender,
        birthday: first.birthday,
        bio: first.bio,
        image_url: first.pet_image_path
          ? `${BASE_URL || "http://localhost:5000"}${first.pet_image_path}`
          : null,
      };

      // 📜 Medical History
      const medical_history = result.rows
        .filter((r) => r.visit_id)
        .map((r) => ({
          visit_id: r.visit_id,
          visit_date: r.visit_date,
          visit_time: r.visit_time,
          duration: r.duration,
          visit_type: r.visit_type,
          chief_complaint: r.chief_complaint,
          visit_reason: r.visit_reason,
          record_id: r.record_id,
          description: r.description,
          test_results: r.test_results,
          notes: r.notes,
          key_action: r.key_action,
          record_created_at: r.record_created_at,
          diagnosis: {
            primary_diagnosis: r.primary_diagnosis,
            body_condition: r.body_condition,
            overall_health: r.overall_health,
          },
          tests: {
            fecal_examination: r.fecal_examination,
            physical_examination: r.physical_examination,
          },
          medication: {
            medication_given: r.medication_given,
            prescriptions: r.prescriptions,
            treatment: r.treatment,
          },
          vital_signs: {
            weight: r.vital_weight,
            temperature: r.temperature,
            heart_rate: r.heart_rate,
            resp_rate: r.resp_rate,
          },
          veterinarian: r.vet_id
            ? {
                vet_id: r.vet_id,
                name: r.vet_name,
                specialization: r.vet_specialization,
                email: r.vet_email,
                contact_number: r.vet_contact,
              }
            : null,
          documents: r.document_image
            ? [`${BASE_URL || "http://localhost:5000"}${r.document_image}`]
            : [],
        }));

      return { ...pet, medical_history };
    } catch (error) {
      console.error("Database error in findById:", error);
      throw error;
    }
  }
}
