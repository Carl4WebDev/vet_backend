export default class MedicalRecordRepo {
  constructor(pool) {
    this.pool = pool;
  }
  async findByPetId(petId) {
    try {
      const query = `
     SELECT 
  -- Medical Record info
  mr.record_id,
  mr.pet_id,
  mr.vet_id,
  mr.description,
  mr.test_results,
  mr.notes,
  mr.key_action,
  mr.created_at,

  -- Pet info
  p.name AS pet_name,
  p.age AS pet_age,
  p.weight AS pet_weight,
  p.gender AS pet_gender,
  p.birthday AS pet_birthday,
  p.species AS pet_species,
  p.breed AS pet_breed,
  p.bio AS pet_bio,

  -- Visit info
  v.visit_id,
  v.visit_date,
  v.visit_time,
  v.duration,
  v.visit_type,
  v.chief_complaint,
  v.visit_reason,

  -- Veterinarian info
  vt.name AS veterinarian_name,
  vt.specialization AS veterinarian_specialization,

  -- Diagnosis
  d.primary_diagnosis,
  d.body_condition,
  d.overall_health,

  -- Tests and Procedures
  t.fecal_examination,
  t.physical_examination,

  -- Medications
  m.medication_given,
  m.prescriptions,
  m.treatment,

  -- ✅ Vital Signs (joined by visit_id)
  vs.weight AS vital_weight,
  vs.temperature AS vital_temperature,
  vs.heart_rate AS vital_heart_rate,
  vs.resp_rate AS vital_resp_rate

FROM medical_records mr
JOIN visits v 
  ON v.visit_id = mr.visit_id
JOIN veterinarians vt 
  ON vt.vet_id = mr.vet_id
JOIN pets p 
  ON p.pet_id = mr.pet_id
LEFT JOIN diagnosis_and_assessment d 
  ON d.diagnosis_id = mr.diagnosis_id
LEFT JOIN tests_and_procedures t 
  ON t.test_performed_id = mr.tests_performed_id
LEFT JOIN test_and_medication m 
  ON m.medications_id = mr.medications_id
LEFT JOIN vital_signs vs
  ON vs.visit_id = v.visit_id   -- 👈 join here!

WHERE mr.pet_id = $1
ORDER BY v.visit_date DESC, mr.created_at DESC;

    `;

      const result = await this.pool.query(query, [petId]);
      return result.rows;
    } catch (error) {
      console.error("Database error in findByPetId:", error);
      throw error;
    }
  }

  async getMedicalHistory(petId) {
    const query = `
      SELECT 
      mr.record_id,
      mr.pet_id,
      mr.vet_id,
      mr.description,
      mr.test_results,
      mr.notes,
      mr.key_action,
      mr.created_at,

      -- Visit info
      v.visit_id,
      v.visit_date,
      v.visit_time,
      v.duration,
      v.visit_type,
      v.chief_complaint,
      v.visit_reason,

      -- Veterinarian info (from FK)
      vt.name AS veterinarian_name,
      vt.specialization AS veterinarian_specialization,

      -- Diagnosis
      d.primary_diagnosis,
      d.body_condition,
      d.overall_health,

      -- Tests and Procedures
      t.fecal_examination,
      t.physical_examination,

      -- Medications
      m.medication_given,
      m.prescriptions,
      m.treatment,

      -- Vital Signs
      vs.weight,
      vs.temperature,
      vs.heart_rate,
      vs.resp_rate,

      -- Documents (may be multiple, aggregate them)
      array_agg(doc.images) AS documents

      FROM medical_records mr
      JOIN visits v ON v.visit_id = mr.visit_id
      JOIN veterinarians vt ON vt.vet_id = mr.vet_id   -- ✅ now uses vet_id from medical_records
      LEFT JOIN diagnosis_and_assessment d ON d.diagnosis_id = mr.diagnosis_id
      LEFT JOIN tests_and_procedures t ON t.test_performed_id = mr.tests_performed_id
      LEFT JOIN test_and_medication m ON m.medications_id = mr.medications_id
      LEFT JOIN vital_signs vs ON vs.visit_id = v.visit_id
      LEFT JOIN documents doc ON doc.visit_id = v.visit_id

      WHERE mr.pet_id = $1 -- pass pet_id as parameter

      GROUP BY 
          mr.record_id, mr.pet_id, mr.vet_id, mr.description, mr.test_results,
          mr.notes, mr.key_action, mr.created_at,
          v.visit_id, v.visit_date, v.visit_time, v.duration, v.visit_type, v.chief_complaint, v.visit_reason,
          vt.name, vt.specialization,
          d.primary_diagnosis, d.body_condition, d.overall_health,
          t.fecal_examination, t.physical_examination,
          m.medication_given, m.prescriptions, m.treatment,
          vs.weight, vs.temperature, vs.heart_rate, vs.resp_rate;


      `;
    const { rows } = await this.pool.query(query, [petId]);
    return rows;
  }

  // 🟢 CREATE NEW MEDICAL RECORD
  async createMedicalRecord(petId, data) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const vetId = data.vet_id;
      if (!vetId) {
        throw new Error("vet_id is required");
      }

      // 1️⃣ Insert into visits
      const visitRes = await client.query(
        `
      INSERT INTO visits (
        pet_id, vet_id, visit_date, visit_time, duration, visit_type, chief_complaint, visit_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING visit_id
      `,
        [
          petId,
          vetId,
          data.visit_date,
          data.visit_time,
          data.duration,
          data.visit_type,
          data.chief_complaint,
          data.visit_reason,
        ]
      );
      const visitId = visitRes.rows[0].visit_id;

      // 2️⃣ Insert into medical_records
      const medRes = await client.query(
        `
      INSERT INTO medical_records (
        pet_id, visit_id, vet_id, description, test_results, notes, key_action, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING record_id
      `,
        [
          petId,
          visitId,
          vetId,
          data.description,
          data.test_results,
          data.notes,
          data.key_action,
        ]
      );
      const recordId = medRes.rows[0].record_id;

      // 3️⃣ Diagnosis (use visit_id)
      await client.query(
        `
      INSERT INTO diagnosis_and_assessment (
        visit_id, primary_diagnosis, body_condition, overall_health
      ) VALUES ($1, $2, $3, $4)
      `,
        [
          visitId,
          data.primary_diagnosis,
          data.body_condition,
          data.overall_health,
        ]
      );

      // 4️⃣ Tests and Procedures (use visit_id)
      await client.query(
        `
      INSERT INTO tests_and_procedures (
        visit_id, fecal_examination, physical_examination
      ) VALUES ($1, $2, $3)
      `,
        [visitId, data.fecal_examination, data.physical_examination]
      );

      // 5️⃣ Test and Medication (❌ was using record_id → ✅ use visit_id)
      await client.query(
        `
      INSERT INTO test_and_medication (
        visit_id, medication_given, prescriptions, treatment
      ) VALUES ($1, $2, $3, $4)
      `,
        [visitId, data.medication_given, data.prescriptions, data.treatment]
      );

      // 6️⃣ Vital Signs
      await client.query(
        `
      INSERT INTO vital_signs (
        visit_id, weight, temperature, heart_rate, resp_rate
      ) VALUES ($1, $2, $3, $4, $5)
      `,
        [
          visitId,
          data.weight,
          data.temperature,
          data.heart_rate,
          data.resp_rate,
        ]
      );

      await client.query("COMMIT");
      return { recordId, visitId };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error in createMedicalRecord:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}
