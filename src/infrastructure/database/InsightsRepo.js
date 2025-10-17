// src/infrastructure/database/AppointmentsRepo.js
export default class InsightsRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getPetTypeDistribution(clinicId) {
    const query = `
    SELECT 
      INITCAP(LOWER(p.species)) AS species,  -- normalize case (Dog, Cat, etc.)
      COUNT(*)::int AS total
    FROM appointments a
    JOIN pets p ON a.pet_id = p.pet_id
    WHERE a.clinic_id = $1
      AND p.species IS NOT NULL
      AND TRIM(p.species) <> ''                -- exclude empty strings
      AND LOWER(p.species) NOT LIKE '%food%'   -- exclude unwanted entries like 'dogfood'
    GROUP BY INITCAP(LOWER(p.species))
    ORDER BY total DESC;
  `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }

  async getVisitPurposeDistribution(clinicId) {
    const query = `
      SELECT at.name AS type, COUNT(*)::int AS total
      FROM appointments a
      JOIN appointmenttypes at ON a.type_id = at.type_id
      WHERE a.clinic_id = $1
      GROUP BY at.name
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }

  async getStats(clinicId) {
    const query = `
    SELECT
      -- New patients = number of clients with their first appointment in the last 7 days
      COUNT(DISTINCT CASE 
        WHEN a.date >= CURRENT_DATE - INTERVAL '7 days' 
             AND a.date <= CURRENT_DATE
             AND a.client_id IN (
                SELECT client_id 
                FROM appointments 
                WHERE clinic_id = $1
                GROUP BY client_id 
                HAVING MIN(date) >= CURRENT_DATE - INTERVAL '7 days'
             )
        THEN a.client_id END
      )::int AS new_patients,

      -- Transferees = clients who already had appointments in another clinic before
      COUNT(DISTINCT CASE 
        WHEN a.date >= CURRENT_DATE - INTERVAL '7 days'
             AND a.client_id IN (
                SELECT client_id 
                FROM appointments 
                WHERE clinic_id != $1
             )
        THEN a.client_id END
      )::int AS transferees,

      -- Total visitors this week
      COUNT(*)::int AS week_visitors
    FROM appointments a
    WHERE a.clinic_id = $1
      AND a.date >= CURRENT_DATE - INTERVAL '7 days';
  `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows[0];
  }

  async getAttendanceStats(clinicId) {
    const query = `
    SELECT
      TO_CHAR(a.date, 'Day') AS day,
      SUM(CASE WHEN a.attendance_status = 'showed_up' THEN 1 ELSE 0 END)::int AS showed_up,
      SUM(CASE WHEN a.attendance_status = 'no_show' THEN 1 ELSE 0 END)::int AS no_show
    FROM appointments a
    WHERE a.clinic_id = $1
      AND a.date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY a.date
    ORDER BY a.date;
  `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
