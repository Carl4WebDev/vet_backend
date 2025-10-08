const BASE_URL = process.env.BASE_URL;

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

      -- 🆕 Image for the client (1 image per client for simplicity)
      i.file_path AS image_path,

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
          'bio', p.bio,
          'birthday', p.birthday,
          'gender', p.gender,
          'breed', p.breed,
          'weight', p.weight
        )
      ) FILTER (WHERE p.pet_id IS NOT NULL) AS pets

    FROM clients c
    JOIN users u ON c.user_id = u.user_id
    LEFT JOIN addresses a ON c.address_id = a.address_id
    LEFT JOIN pets p ON c.client_id = p.client_id
    LEFT JOIN appointments ap ON ap.client_id = c.client_id AND ap.clinic_id = $1

    -- 🆕 Join the images table for client images
    LEFT JOIN images i 
      ON i.entity_type = 'client' 
      AND i.entity_id = c.client_id

    WHERE c.client_id IS NOT NULL
    GROUP BY 
      c.client_id, c.client_name, c.phone, u.email, c.gender, 
      a.street, a.city, a.province, u.created_at, i.file_path
  `;

    const result = await this.pool.query(query, [clinicId]);

    // 🧠 Attach full URL like in clinic
    return result.rows.map((row) => ({
      ...row,
      image_url: row.image_path
        ? `${BASE_URL || "http://localhost:3000"}${row.image_path}`
        : null,
    }));
  }
}
