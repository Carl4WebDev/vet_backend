// src/repositories/PatientRecordRepo.js
export default class PatientRecordRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getPatients(clinicId) {
    const query = `
      SELECT 
        a.appointment_id,
        a.date,
        a.start_time,
        a.end_time,
        at.name AS reason,
        a.status,
        c.client_name AS customer_name,
        p.name AS pet_name,
        p.pet_id,
        p.breed,
        v.name AS veterinarian_name,

        -- ✅ Include contagious info if exists
        COALESCE(m.is_contagious, false) AS is_contagious,
        m.contagious_disease

      FROM appointments a
      JOIN clients c ON a.client_id = c.client_id
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN veterinarians v ON a.vet_id = v.vet_id
      JOIN appointmenttypes at ON a.type_id = at.type_id

      -- ✅ Link to pet’s medical record (not vet)
      LEFT JOIN medical_records m 
        ON m.pet_id = p.pet_id
        AND m.is_contagious = true
        AND m.contagious_disease IS NOT NULL
        AND m.created_at = (
          SELECT MAX(m2.created_at)
          FROM medical_records m2
          WHERE m2.pet_id = p.pet_id
            AND m2.is_contagious = true
            AND m2.contagious_disease IS NOT NULL
        )

      WHERE a.clinic_id = $1
      ORDER BY a.date DESC, a.start_time ASC;
    `;

    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
