// src/infrastructure/database/AppointmentsRepo.js
export default class InsightsRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async getPetTypeDistribution(clinicId) {
    const query = `
    SELECT 
      INITCAP(TRIM(LOWER(p.species))) AS species,  
      COUNT(*)::int AS total
    FROM appointments a
    JOIN pets p ON a.pet_id = p.pet_id
    WHERE 
      a.clinic_id = $1
      AND p.species IS NOT NULL
      AND TRIM(p.species) <> ''
      AND LOWER(p.species) NOT IN (
        'food', 'dogfood', 'catfood', 'unknown', 'test', 'sample', 'n/a', 'na'
      )
      AND p.species ~ '^[A-Za-z ]+$'
      AND LENGTH(TRIM(p.species)) > 2
    GROUP BY INITCAP(TRIM(LOWER(p.species)))
    ORDER BY total DESC;
  `;

    try {
      const result = await this.pool.query(query, [clinicId]);

      // 🧠 Fuzzy merge dictionary
      const normalizeMap = {
        dog: ["dog", "dogs", "puppy", "puppies", "doggo", "doggy"],
        cat: ["cat", "cats", "kitty", "kitten", "kittens"],
        rabbit: ["rabbit", "bunny", "hare"],
        bird: ["bird", "parrot", "canary"],
      };

      // Helper to find canonical species name
      const normalize = (name) => {
        const lower = name.toLowerCase();
        for (const [canonical, aliases] of Object.entries(normalizeMap)) {
          if (aliases.includes(lower)) return canonical;
        }
        return name; // keep original if no match
      };

      // 🧩 Merge totals by normalized species
      const merged = {};
      for (const row of result.rows) {
        const norm = normalize(row.species);
        if (!merged[norm]) merged[norm] = 0;
        merged[norm] += row.total;
      }

      // Convert to clean chart data
      return Object.entries(merged).map(([species, total]) => ({
        species: species.charAt(0).toUpperCase() + species.slice(1),
        total,
      }));
    } catch (err) {
      console.error("❌ Error fetching pet type distribution:", err.message);
      throw new Error("Database error while fetching pet type distribution.");
    }
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
