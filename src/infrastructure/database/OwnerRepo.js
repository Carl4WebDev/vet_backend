const BASE_URL = process.env.BASE_URL;

export default class OwnerRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getClinicPetOwners(clinicId) {
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    const query = `
    SELECT 
      c.client_id AS id,
      c.client_name AS name,
      c.phone AS contact,
      u.email,
      c.gender,
      a.street || ', ' || a.city || ', ' || a.province AS address,
      u.created_at AS member_since,

      -- ✅ Only main client image
      ci.file_path AS image_path,

      -- 🐾 Pets with DISTINCT images
      json_agg(
        DISTINCT jsonb_build_object(
          'pet_id', p.pet_id,
          'name', p.name,
          'species', p.species,
          'age', p.age,
          'bio', p.bio,
          'birthday', p.birthday,
          'gender', p.gender,
          'breed', p.breed,
          'weight', p.weight,
          'image_url',
            CASE 
              WHEN pi.file_path IS NOT NULL THEN
                CASE 
                  WHEN LEFT(pi.file_path, 1) = '/' 
                  THEN '${BASE_URL}' || pi.file_path
                  ELSE '${BASE_URL}/' || pi.file_path
                END
              ELSE NULL
            END
        )
      ) FILTER (WHERE p.pet_id IS NOT NULL) AS pets,

      -- 🧮 Appointment stats
      MAX(ap.date) AS last_visit,
      COUNT(DISTINCT ap.appointment_id) AS times_visited_clinic,
      SUM(CASE WHEN ap.status = 'missed' THEN 1 ELSE 0 END) AS missed_appointments,
      SUM(CASE WHEN ap.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
      COUNT(DISTINCT p.pet_id) AS pet_count

    FROM clients c
    JOIN users u ON c.user_id = u.user_id
    LEFT JOIN addresses a ON c.address_id = a.address_id
    LEFT JOIN pets p ON c.client_id = p.client_id
    LEFT JOIN appointments ap ON ap.client_id = c.client_id AND ap.clinic_id = $1

    -- ✅ Only main client image
    LEFT JOIN images ci 
      ON ci.entity_type = 'client' 
      AND ci.entity_id = c.client_id
      AND ci.image_role = 'main'

    -- 🐾 Pet images
    LEFT JOIN images pi
      ON pi.entity_type = 'pet'
      AND pi.entity_id = p.pet_id
      AND pi.image_role = 'main'

    WHERE c.clinic_id = $1
    GROUP BY 
      c.client_id, c.client_name, c.phone, u.email, c.gender,
      a.street, a.city, a.province, u.created_at, ci.file_path
    ORDER BY c.client_id ASC;
  `;

    const result = await this.pool.query(query, [clinicId]);

    return result.rows.map((row) => ({
      ...row,
      image_url: row.image_path
        ? row.image_path.startsWith("/")
          ? `${BASE_URL}${row.image_path}`
          : `${BASE_URL}/${row.image_path}`
        : null,
    }));
  }

  async getAllPetOwners() {
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    const query = `
    SELECT 
      c.client_id AS id,
      c.client_name AS name,
      c.phone AS contact,
      u.email,
      c.gender,
      a.street || ', ' || a.city || ', ' || a.province AS address,
      u.created_at AS member_since,

      -- ✅ Only main client image
      ci.file_path AS image_path,

      -- 🐾 Pets with DISTINCT images
      json_agg(
        DISTINCT jsonb_build_object(
          'pet_id', p.pet_id,
          'name', p.name,
          'species', p.species,
          'age', p.age,
          'bio', p.bio,
          'birthday', p.birthday,
          'gender', p.gender,
          'breed', p.breed,
          'weight', p.weight,
          'image_url',
            CASE 
              WHEN pi.file_path IS NOT NULL THEN
                CASE 
                  WHEN LEFT(pi.file_path, 1) = '/' 
                  THEN '${BASE_URL}' || pi.file_path
                  ELSE '${BASE_URL}/' || pi.file_path
                END
              ELSE NULL
            END
        )
      ) FILTER (WHERE p.pet_id IS NOT NULL) AS pets,

      -- 🧮 Appointment stats (across all clinics)
      MAX(ap.date) AS last_visit,
      COUNT(DISTINCT ap.appointment_id) AS times_visited_clinic,
      SUM(CASE WHEN ap.status = 'missed' THEN 1 ELSE 0 END) AS missed_appointments,
      SUM(CASE WHEN ap.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
      COUNT(DISTINCT p.pet_id) AS pet_count

    FROM clients c
    JOIN users u ON c.user_id = u.user_id
    LEFT JOIN addresses a ON c.address_id = a.address_id
    LEFT JOIN pets p ON c.client_id = p.client_id
    LEFT JOIN appointments ap ON ap.client_id = c.client_id

    -- ✅ Only main client image
    LEFT JOIN images ci 
      ON ci.entity_type = 'client' 
      AND ci.entity_id = c.client_id
      AND ci.image_role = 'main'

    -- 🐾 Pet images
    LEFT JOIN images pi
      ON pi.entity_type = 'pet'
      AND pi.entity_id = p.pet_id
      AND pi.image_role = 'main'

    GROUP BY 
      c.client_id, c.client_name, c.phone, u.email, c.gender,
      a.street, a.city, a.province, u.created_at, ci.file_path
    ORDER BY c.client_id ASC;
  `;

    const result = await this.pool.query(query);

    return result.rows.map((row) => ({
      ...row,
      image_url: row.image_path
        ? row.image_path.startsWith("/")
          ? `${BASE_URL}${row.image_path}`
          : `${BASE_URL}/${row.image_path}`
        : null,
    }));
  }
}
