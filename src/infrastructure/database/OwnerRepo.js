export default class OwnerRepo {
  constructor(pool) {
    this.pool = pool;
  }
  async getClinicPetOwners(clinicId) {
    const query = `
    SELECT 
      c.client_id AS id,
      c.client_name AS name,
      c.phone AS contact,
      u.email,
      c.gender,
      a.street || ', ' || a.city || ', ' || a.province AS address,
      u.created_at AS member_since,

      -- stats from appointments
      MAX(ap.date) AS last_visit,
      COUNT(DISTINCT ap.appointment_id) AS times_visited_clinic,
      SUM(CASE WHEN ap.status = 'missed' THEN 1 ELSE 0 END) AS missed_appointments,
      SUM(CASE WHEN ap.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,

      COUNT(DISTINCT p.pet_id) AS pet_count,

      json_agg(DISTINCT
        jsonb_build_object(
          'pet_id', p.pet_id,
          'name', p.name,
          'species', p.species,
          'age', p.age,
          'notes', p.bio
        )
      ) FILTER (WHERE p.pet_id IS NOT NULL) AS pets

    FROM clients c
    JOIN users u ON c.user_id = u.user_id
    LEFT JOIN addresses a ON c.address_id = a.address_id
    LEFT JOIN pets p ON c.client_id = p.client_id
    LEFT JOIN appointments ap ON ap.client_id = c.client_id AND ap.clinic_id = $1

    WHERE c.client_id IS NOT NULL
    GROUP BY c.client_id, c.client_name, c.phone, u.email, c.gender, a.street, a.city, a.province, u.created_at
  `;

    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
