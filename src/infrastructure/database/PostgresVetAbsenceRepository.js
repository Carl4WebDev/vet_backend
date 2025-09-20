// infrastructure/database/PostgresVetAbsenceRepository.js
export default class PostgresVetAbsenceRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Get a vet's absence for a specific date.
   * @param {number} vetId
   * @param {string} date - 'YYYY-MM-DD'
   * @returns {object|null} - absence record or null if none
   */
  async getAbsence(vetId, date) {
    const res = await this.pool.query(
      `SELECT * FROM VetAbsences 
       WHERE vet_id = $1 AND date = $2`,
      [vetId, date]
    );
    return res.rows[0] || null;
  }

  /**
   * Optionally, add an absence record
   */
  async createAbsence(vetId, date, reason) {
    const res = await this.pool.query(
      `INSERT INTO VetAbsences (vet_id, date, reason) 
       VALUES ($1, $2, $3) RETURNING *`,
      [vetId, date, reason]
    );
    return res.rows[0];
  }

  /**
   * Optionally, remove an absence record
   */
  async removeAbsence(absenceId) {
    const res = await this.pool.query(
      `DELETE FROM VetAbsences WHERE absence_id = $1 RETURNING *`,
      [absenceId]
    );
    return res.rows[0];
  }
}
