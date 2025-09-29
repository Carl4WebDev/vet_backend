export default class StaffRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getClinicVeterinarians(clinicId) {
    const query = `
      SELECT vet_id AS staff_id, name, position, contact_number, department, email, clinic_id
      FROM veterinarians
      WHERE clinic_id = $1
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }

  async getClinicStaff(clinicId) {
    const query = `
      SELECT staff_id, name, position, contact_number,department, email, clinic_id
      FROM staff
      WHERE clinic_id = $1
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }

  async getClinicStaffCounts(clinicId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM veterinarians WHERE clinic_id = $1) +
        (SELECT COUNT(*) FROM staff WHERE clinic_id = $1) AS total_staff,
        (SELECT COUNT(*) FROM veterinarians WHERE clinic_id = $1) AS veterinarian_count,
        (SELECT COUNT(*) FROM staff WHERE position ILIKE '%technician%' AND clinic_id = $1) AS technician_count,
        (SELECT COUNT(*) FROM staff WHERE position ILIKE '%support%' AND clinic_id = $1) AS support_staff_count
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows[0];
  }

  async addStaff({
    name,
    position,
    department,
    contact_number,
    email,
    clinic_id,
  }) {
    const query = `
      INSERT INTO staff (name, position, department, contact_number, email, clinic_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      name,
      position,
      department,
      contact_number,
      email,
      clinic_id,
    ]);
    return result.rows[0];
  }

  async editStaff(staffId, data) {
    const { name, position, department, contact_number, email } = data;

    const query = `
  UPDATE staff
  SET 
    name = COALESCE($1, name),
    position = COALESCE($2, position),
    department = COALESCE($3, department),
    contact_number = COALESCE($4, contact_number),
    email = COALESCE($5, email)
  WHERE staff_id = $6
  RETURNING *;
`;

    const result = await this.pool.query(query, [
      name || null,
      position || null,
      department || null,
      contact_number || null,
      email || null,
      staffId,
    ]);

    return result.rows[0];
  }

  async deleteStaff(staffId) {
    const query = `DELETE FROM staff WHERE staff_id = $1 RETURNING *;`;
    const result = await this.pool.query(query, [staffId]);
    return result.rows[0];
  }
}
