export default class MedicalRecordRepo {
  constructor(pool) {
    this.pool = pool;
  }
  async findByPetId(petId) {
    try {
      const query = `
      SELECT 
        record_id,
        pet_id,
        visit_date,
        veterinarian,
        description,
        diagnosis,
        procedures,
        tests_performed,
        test_results,
        medications,
        notes,
        created_at
      FROM medical_records 
      WHERE pet_id = $1 
      ORDER BY visit_date DESC, created_at DESC
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
}
