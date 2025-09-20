// infrastructure/db/PostgresVetScheduleRepository.js
export default class PostgresVetScheduleRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Get vet schedule for a specific date
   * @param {number} vetId
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<{start_time: string, end_time: string} | null>}
   */
  async getSchedule(vetId, date) {
    const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 6=Saturday

    const res = await this.pool.query(
      `SELECT start_time, end_time
       FROM VetSchedules
       WHERE vet_id=$1 AND day_of_week=$2
       ORDER BY schedule_id
       LIMIT 1`,
      [vetId, dayOfWeek]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0]; // { start_time: '08:00:00', end_time: '17:00:00' }
  }

  async upsertSchedule(vetId, dayOfWeek, startTime, endTime) {
    const existing = await this.pool.query(
      "SELECT * FROM VetSchedules WHERE vet_id=$1 AND day_of_week=$2",
      [vetId, dayOfWeek]
    );

    if (existing.rows.length > 0) {
      const res = await this.pool.query(
        "UPDATE VetSchedules SET start_time=$1, end_time=$2 WHERE vet_id=$3 AND day_of_week=$4 RETURNING *",
        [startTime, endTime, vetId, dayOfWeek]
      );
      return res.rows[0];
    } else {
      const res = await this.pool.query(
        "INSERT INTO VetSchedules (vet_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4) RETURNING *",
        [vetId, dayOfWeek, startTime, endTime]
      );
      return res.rows[0];
    }
  }
}
