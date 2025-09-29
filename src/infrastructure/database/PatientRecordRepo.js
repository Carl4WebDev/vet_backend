// src/repositories/PatientRecordRepo.js
export default class PatientRecordRepo {
  constructor(pool) {
    this.pool = pool;
  }

  // src/infrastructure/database/PatientRepository.js
  async getPatients(clinicId) {
    const query = `
    SELECT 
      a.appointment_id,
      a.date,
      a.start_time,
      a.end_time,
      at.name AS reason,              -- comes from appointmenttypes
      a.status,
      c.client_name AS customer_name,
      p.name AS pet_name,
      p.breed,
      v.name AS veterinarian_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.client_id
    JOIN pets p ON a.pet_id = p.pet_id
    JOIN veterinarians v ON a.vet_id = v.vet_id
    JOIN appointmenttypes at ON a.type_id = at.type_id
    WHERE a.clinic_id = $1
    ORDER BY a.date DESC, a.start_time ASC;
  `;
    console.log(clinicId);
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
