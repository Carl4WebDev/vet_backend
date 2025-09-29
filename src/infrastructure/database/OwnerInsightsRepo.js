// src/infrastructure/database/OwnerInsightsRepo.js
export default class OwnerInsightsRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getOwnerStats(clientId) {
    const query = `
      SELECT 
        c.client_id,
        c.client_name,
        c.phone,
        u.email,
        c.gender,
        COUNT(DISTINCT p.pet_id)::int AS number_of_pets,
        COUNT(a.appointment_id)::int AS times_visited_clinic,
        MAX(a.date)::date AS last_visited,
        SUM(CASE WHEN a.status = 'scheduled' THEN 1 ELSE 0 END)::int AS missed_appointments,
        SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled_appointments
      FROM clients c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN pets p ON c.client_id = p.client_id
      LEFT JOIN appointments a ON c.client_id = a.client_id
      WHERE c.client_id = $1
      GROUP BY c.client_id, c.client_name, c.phone, u.email, c.gender
    `;
    const result = await this.pool.query(query, [clientId]);
    return result.rows[0];
  }
}
