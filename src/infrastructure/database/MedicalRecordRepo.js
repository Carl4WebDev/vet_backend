const BASE_URL = process.env.BASE_URL;
// helper to normalize slashes between base and path
function buildPublicUrl(base, path) {
  if (!path) return null;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
export default class MedicalRecordRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async findByPetId(petId) {
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    try {
      const query = `
      SELECT 
        mr.record_id,
        mr.pet_id,
        mr.vet_id,
        mr.description,
        mr.test_results,
        mr.notes,
        mr.key_action,
        mr.created_at,

        -- 🐾 Pet Info
        p.name AS pet_name,
        p.age AS pet_age,
        p.weight AS pet_weight,
        p.gender AS pet_gender,
        p.birthday AS pet_birthday,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.bio AS pet_bio,

        -- 🖼️ Main Pet Image
        pet_img.file_path AS pet_image_path,

        -- 👩‍🦰 Client Info
        c.client_name,
        client_img.file_path AS client_image_path,

        -- 🧭 Visit Info
        v.visit_id,
        v.visit_date,
        v.visit_time,
        v.duration,
        v.visit_type,
        v.chief_complaint,
        v.visit_reason,

        -- 🧑‍⚕️ Vet Info
        vt.name AS veterinarian_name,
        vt.specialization AS veterinarian_specialization,

        -- 🩺 Diagnosis and Assessment (linked by record_id)
        d.primary_diagnosis,
        d.body_condition,
        d.overall_health,

        -- 🔬 Tests and Procedures (linked by record_id)
        t.fecal_examination,
        t.physical_examination,

        -- 💊 Medication and Treatment (linked by record_id)
        m.medication_given,
        m.prescriptions,
        m.treatment,

        -- ❤️ Vital Signs (linked by visit_id)
        vs.weight AS vital_weight,
        vs.temperature AS vital_temperature,
        vs.heart_rate AS vital_heart_rate,
        vs.resp_rate AS vital_resp_rate

      FROM medical_records mr
      JOIN visits v ON v.visit_id = mr.visit_id
      JOIN veterinarians vt ON vt.vet_id = mr.vet_id
      JOIN pets p ON p.pet_id = mr.pet_id
      JOIN clients c ON c.client_id = p.client_id

      LEFT JOIN diagnosis_and_assessment d ON d.record_id = mr.record_id
      LEFT JOIN tests_and_procedures t ON t.record_id = mr.record_id
      LEFT JOIN test_and_medication m ON m.record_id = mr.record_id
      LEFT JOIN vital_signs vs ON vs.visit_id = v.visit_id

      LEFT JOIN images pet_img 
        ON pet_img.entity_type = 'pet' 
        AND pet_img.entity_id = p.pet_id
        AND pet_img.image_role = 'main'

      LEFT JOIN images client_img 
        ON client_img.entity_type = 'client' 
        AND client_img.entity_id = c.client_id
        AND client_img.image_role = 'main'

      WHERE mr.pet_id = $1
      ORDER BY v.visit_date DESC, mr.created_at DESC;
    `;

      const result = await this.pool.query(query, [petId]);

      // ✅ If no medical record found
      if (result.rows.length === 0) {
        const petQuery = `
        SELECT 
          p.pet_id,
          p.name AS pet_name,
          p.age AS pet_age,
          p.weight AS pet_weight,
          p.gender AS pet_gender,
          p.birthday AS pet_birthday,
          p.species AS pet_species,
          p.breed AS pet_breed,
          p.bio AS pet_bio,
          i.file_path AS pet_image_path,
          c.client_name,
          ci.file_path AS client_image_path
        FROM pets p
        JOIN clients c ON c.client_id = p.client_id
        LEFT JOIN images i
          ON i.entity_type = 'pet' 
          AND i.entity_id = p.pet_id
          AND i.image_role = 'main'
        LEFT JOIN images ci
          ON ci.entity_type = 'client'
          AND ci.entity_id = c.client_id
          AND ci.image_role = 'main'
        WHERE p.pet_id = $1;
      `;
        const petResult = await this.pool.query(petQuery, [petId]);
        return petResult.rows.map((row) => ({
          ...row,
          pet_image_url: row.pet_image_path
            ? row.pet_image_path.startsWith("/")
              ? `${BASE_URL}${row.pet_image_path}`
              : `${BASE_URL}/${row.pet_image_path}`
            : null,
          client_image_url: row.client_image_path
            ? row.client_image_path.startsWith("/")
              ? `${BASE_URL}${row.client_image_path}`
              : `${BASE_URL}/${row.client_image_path}`
            : null,
          documents: [],
        }));
      }

      // ✅ Fetch documents (linked by visit_id)
      const recordsWithDocuments = await Promise.all(
        result.rows.map(async (row) => {
          const docsQuery = `
          SELECT document_id, visit_id, file_name, file_path, mime_type, created_at
          FROM documents
          WHERE visit_id = $1
          ORDER BY created_at DESC;
        `;
          const docsResult = await this.pool.query(docsQuery, [row.visit_id]);

          const documents = docsResult.rows.map((doc) => ({
            ...doc,
            document_url: doc.file_path
              ? doc.file_path.startsWith("/")
                ? `${BASE_URL}${doc.file_path}`
                : `${BASE_URL}/${doc.file_path}`
              : null,
          }));

          return {
            ...row,
            pet_image_url: row.pet_image_path
              ? row.pet_image_path.startsWith("/")
                ? `${BASE_URL}${row.pet_image_path}`
                : `${BASE_URL}/${row.pet_image_path}`
              : null,
            client_image_url: row.client_image_path
              ? row.client_image_path.startsWith("/")
                ? `${BASE_URL}${row.client_image_path}`
                : `${BASE_URL}/${row.client_image_path}`
              : null,
            documents, // 🆕 include documents (images/files)
          };
        })
      );

      return recordsWithDocuments;
    } catch (error) {
      console.error("Database error in findByPetId:", error);
      throw error;
    }
  }

  //fixed ssl
  async getMedicalHistory(petId) {
    const query = `
      SELECT 
        mr.record_id,
        mr.pet_id,
        mr.vet_id,
        mr.description,
        mr.test_results,
        mr.notes,
        mr.key_action,
        mr.created_at,

        v.visit_id,
        v.visit_date,
        v.visit_time,
        v.duration,
        v.visit_type,
        v.chief_complaint,
        v.visit_reason,

        vt.name AS veterinarian_name,
        vt.specialization AS veterinarian_specialization,

        d.primary_diagnosis,
        d.body_condition,
        d.overall_health,

        t.fecal_examination,
        t.physical_examination,

        m.medication_given,
        m.prescriptions,
        m.treatment,

        vs.weight,
        vs.temperature,
        vs.heart_rate,
        vs.resp_rate,

        array_agg(DISTINCT doc.images) AS documents,

        -- 🐾 Pet Image
        pet_img.file_path AS pet_image_path

      FROM medical_records mr
      JOIN visits v ON v.visit_id = mr.visit_id
      JOIN veterinarians vt ON vt.vet_id = mr.vet_id
      LEFT JOIN diagnosis_and_assessment d ON d.diagnosis_id = mr.diagnosis_id
      LEFT JOIN tests_and_procedures t ON t.test_performed_id = mr.tests_performed_id
      LEFT JOIN test_and_medication m ON m.medications_id = mr.medications_id
      LEFT JOIN vital_signs vs ON vs.visit_id = v.visit_id
      LEFT JOIN documents doc ON doc.visit_id = v.visit_id
      LEFT JOIN images pet_img
        ON pet_img.entity_type = 'pet'
        AND pet_img.entity_id = mr.pet_id

      WHERE mr.pet_id = $1

      GROUP BY 
        mr.record_id, mr.pet_id, mr.vet_id, mr.description, mr.test_results,
        mr.notes, mr.key_action, mr.created_at,
        v.visit_id, v.visit_date, v.visit_time, v.duration, v.visit_type, v.chief_complaint, v.visit_reason,
        vt.name, vt.specialization,
        d.primary_diagnosis, d.body_condition, d.overall_health,
        t.fecal_examination, t.physical_examination,
        m.medication_given, m.prescriptions, m.treatment,
        vs.weight, vs.temperature, vs.heart_rate, vs.resp_rate,
        pet_img.file_path;
    `;

    const { rows } = await this.pool.query(query, [petId]);

    // 🧠 Attach image_url like in other repos
    return rows.map((row) => ({
      ...row,
      pet_image_url: row.pet_image_path
        ? `${BASE_URL || "http://localhost:5000"}${row.pet_image_path}`
        : null,
    }));
  }
  async createMedicalRecord(petId, data, files = []) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const vetId = data.vet_id;
      if (!vetId) throw new Error("vet_id is required");

      // 1️⃣ Create visit
      const visitRes = await client.query(
        `
      INSERT INTO visits (
        pet_id, vet_id, visit_date, visit_time, duration, visit_type, chief_complaint, visit_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING visit_id
      `,
        [
          petId,
          vetId,
          data.visit_date,
          data.visit_time,
          data.duration,
          data.visit_type,
          data.chief_complaint,
          data.visit_reason,
        ]
      );
      const visitId = visitRes.rows[0].visit_id;

      // 2️⃣ Create medical record
      const medRes = await client.query(
        `
      INSERT INTO medical_records (
        pet_id, visit_id, vet_id, description, test_results, notes, key_action, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING record_id
      `,
        [
          petId,
          visitId,
          vetId,
          data.description,
          data.test_results,
          data.notes,
          data.key_action,
        ]
      );
      const recordId = medRes.rows[0].record_id;

      // 3️⃣ Diagnosis (linked by record_id)
      await client.query(
        `
      INSERT INTO diagnosis_and_assessment (
        record_id, primary_diagnosis, body_condition, overall_health
      ) VALUES ($1, $2, $3, $4)
      `,
        [
          recordId,
          data.primary_diagnosis,
          data.body_condition,
          data.overall_health,
        ]
      );

      // 4️⃣ Tests and Procedures (linked by record_id)
      await client.query(
        `
      INSERT INTO tests_and_procedures (
        record_id, fecal_examination, physical_examination
      ) VALUES ($1, $2, $3)
      `,
        [recordId, data.fecal_examination, data.physical_examination]
      );

      // 5️⃣ Medication (linked by record_id)
      await client.query(
        `
      INSERT INTO test_and_medication (
        record_id, medication_given, prescriptions, treatment
      ) VALUES ($1, $2, $3, $4)
      `,
        [recordId, data.medication_given, data.prescriptions, data.treatment]
      );

      // 6️⃣ Vital Signs (linked by visit_id)
      await client.query(
        `
      INSERT INTO vital_signs (
        visit_id, weight, temperature, heart_rate, resp_rate
      ) VALUES ($1, $2, $3, $4, $5)
      `,
        [
          visitId,
          data.weight,
          data.temperature,
          data.heart_rate,
          data.resp_rate,
        ]
      );

      // 7️⃣ Optional: Insert uploaded documents (linked by visit_id)
      if (files && files.length > 0) {
        for (const file of files) {
          await client.query(
            `
          INSERT INTO documents (visit_id, file_name, mime_type, file_path, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          `,
            [
              visitId,
              file.originalname,
              file.mimetype,
              `/uploads/documents/${file.filename}`,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return { recordId, visitId };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error in createMedicalRecord:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}
