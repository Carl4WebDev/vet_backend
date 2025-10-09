import fs from "fs";
const BASE_URL = process.env.BASE_URL;
export default class ClinicRepo {
  constructor(pool) {
    this.pool = pool;
  }

  // 🔎 Find by email
  async findByEmail(email) {
    const result = await this.pool.query(
      `SELECT u.user_id, u.email, u.password, u.role,
              c.clinic_id, c.clinic_name, c.phone_number, c.is_active, c.address_id
       FROM users u
       LEFT JOIN clinics c ON u.user_id = c.owner_id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email]
    );
    return result.rows[0] || null;
  }

  // 🏗️ Create a new clinic (user + address + clinic)
  async create({ userData, role }) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1️⃣ Insert into Users
      const user = await this.insertUser(
        client,
        userData.email,
        userData.password,
        role
      );

      // 2️⃣ Insert into Addresses
      const addressId = await this.insertAddress(client, userData.address);

      // 3️⃣ Insert into Clinics
      if (role === "clinic_owner") {
        await this.insertClinic(client, userData, user.user_id, addressId);
      }

      await client.query("COMMIT");
      return user;
    } catch (error) {
      console.log(error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // 🔹 Insert user
  async insertUser(client, email, password, role) {
    const result = await client.query(
      `INSERT INTO users (email, password, role) 
       VALUES ($1, $2, $3) RETURNING user_id, email, role`,
      [email, password, role]
    );
    return result.rows[0];
  }

  // 🔹 Insert or reuse address
  async insertAddress(client, address) {
    const existing = await client.query(
      `SELECT address_id FROM addresses
       WHERE street = $1 AND city = $2 AND province = $3 
         AND postal_code = $4 AND country = $5 AND unit_number = $6
         AND latitude = $7 AND longitude = $8`,
      [
        address.street,
        address.city,
        address.province,
        address.postal_code,
        address.country,
        address.unit_number,
        address.latitude,
        address.longitude,
      ]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].address_id;
    }

    const result = await client.query(
      `INSERT INTO addresses 
        (street, city, province, postal_code, country, unit_number, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING address_id`,
      [
        address.street,
        address.city,
        address.province,
        address.postal_code,
        address.country,
        address.unit_number,
        address.latitude,
        address.longitude,
      ]
    );

    return result.rows[0].address_id;
  }

  // 🔹 Insert clinic
  async insertClinic(client, userData, userId, addressId) {
    await client.query(
      `INSERT INTO clinics (clinic_name, phone_number, is_active, address_id, owner_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userData.clinic_name, userData.phone_number, true, addressId, userId]
    );
  }

  // 📋 Get all clinics
  async getAllClinics() {
    const query = `
      SELECT 
        c.clinic_id,
        c.clinic_name,
        c.phone_number,
        c.is_active,
        c.created_at AS clinic_created_at,

        a.address_id,
        a.street,
        a.city,
        a.province,
        a.postal_code,
        a.country,
        a.unit_number,
        a.latitude,
        a.longitude,
        a.created_at AS address_created_at,

        u.user_id AS owner_id,
        u.email AS owner_email,
        u.role AS owner_role,
        u.created_at AS owner_created_at

      FROM clinics c
      JOIN addresses a ON c.address_id = a.address_id
      JOIN users u ON c.owner_id = u.user_id
    `;

    const result = await this.pool.query(query);

    return result.rows.map((row) => ({
      clinic_id: row.clinic_id,
      clinic_name: row.clinic_name,
      phone_number: row.phone_number,
      is_active: row.is_active,
      created_at: row.clinic_created_at,
      address: {
        address_id: row.address_id,
        street: row.street,
        city: row.city,
        province: row.province,
        postal_code: row.postal_code,
        country: row.country,
        unit_number: row.unit_number,
        latitude: row.latitude,
        longitude: row.longitude,
        created_at: row.address_created_at,
      },
      owner: {
        user_id: row.owner_id,
        email: row.owner_email,
        role: row.owner_role,
        created_at: row.owner_created_at,
      },
    }));
  }

  // 🔎 Get single clinic by ID
  async getClinicById(clinicId) {
    const query = `
      SELECT c.*, a.*, u.email AS owner_email, u.role AS owner_role
      FROM clinics c
      JOIN addresses a ON c.address_id = a.address_id
      JOIN users u ON c.owner_id = u.user_id
      WHERE c.clinic_id = $1
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows[0] || null;
  }

  // src/infrastructure/database/ClinicRepo.js

  async findById(clinicId) {
    const res = await this.pool.query(
      `SELECT * FROM users WHERE user_id = $1 LIMIT 1`,
      [clinicId]
    );
    return res.rows[0] || null;
  }

  // ✅ Update password
  async updatePassword(clinicId, hashedPassword) {
    await this.pool.query(`UPDATE users SET password = $1 WHERE user_id = $2`, [
      hashedPassword,
      clinicId,
    ]);
  }

  // src/infrastructure/database/ClinicRepo.js
  async updateClinicBasicInfo(clinicId, { name, phone_number }) {
    // Fetch current values
    const existing = await this.pool.query(
      `SELECT clinic_name, phone_number FROM clinics WHERE clinic_id = $1`,
      [clinicId]
    );

    if (existing.rows.length === 0) {
      throw new Error(`Clinic with ID ${clinicId} not found`);
    }

    const current = existing.rows[0];

    // Merge: if new value is undefined, keep current
    const finalName = name !== undefined ? name : current.clinic_name;
    const finalPhone =
      phone_number !== undefined ? phone_number : current.phone_number;

    await this.pool.query(
      `UPDATE clinics 
     SET clinic_name = $1, phone_number = $2
     WHERE clinic_id = $3`,
      [finalName, finalPhone, clinicId]
    );
  }

  async updateAddress(addressId, address) {
    await this.pool.query(
      `UPDATE addresses
     SET street = $1, city = $2, province = $3, postal_code = $4,
         country = $5, unit_number = $6, latitude = $7, longitude = $8
     WHERE address_id = $9`,
      [
        address.street,
        address.city,
        address.province,
        address.postal_code,
        address.country,
        address.unit_number,
        address.latitude,
        address.longitude,
        addressId,
      ]
    );
  }

  async upsertClinicImage(clinicId, imageFile) {
    // Check if an image already exists for this clinic
    const existing = await this.pool.query(
      `SELECT image_id, file_path 
     FROM images 
     WHERE entity_type = 'clinic_owner' AND entity_id = $1 
     LIMIT 1`,
      [clinicId]
    );

    if (existing.rows.length > 0) {
      // 🧹 Optional: delete old file
      const oldFilePath = existing.rows[0].file_path;
      try {
        fs.unlinkSync("." + oldFilePath);
      } catch (err) {
        console.warn("⚠️ Old image not found for deletion:", err.message);
      }

      // 📝 Update existing image
      await this.pool.query(
        `UPDATE images 
       SET file_path = $1, file_name = $2, mime_type = $3 
       WHERE image_id = $4`,
        [
          imageFile.file_path,
          imageFile.file_name,
          imageFile.mime_type,
          existing.rows[0].image_id,
        ]
      );
    } else {
      // 🆕 Insert a new image record
      await this.pool.query(
        `INSERT INTO images (file_path, file_name, mime_type, entity_type, entity_id)
       VALUES ($1, $2, $3, 'clinic', $4)`,
        [
          imageFile.file_path,
          imageFile.file_name,
          imageFile.mime_type,
          clinicId,
        ]
      );
    }
  }

  async getClinicWithImageById(clinicId) {
    const query = `
    SELECT 
      c.clinic_id,
      c.clinic_name,
      c.phone_number,
      a.address_id,
      a.street,
      a.city,
      a.province,
      a.postal_code,
      a.country,
      a.unit_number,
      a.latitude,
      a.longitude,
      i.file_path AS image_path
    FROM clinics c
    JOIN addresses a ON c.address_id = a.address_id
    LEFT JOIN images i 
      ON i.entity_type = 'clinic_owner' AND i.entity_id = c.clinic_id
    WHERE c.clinic_id = $1
    LIMIT 1
  `;

    const result = await this.pool.query(query, [clinicId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      clinic_id: row.clinic_id,
      clinic_name: row.clinic_name,
      phone_number: row.phone_number,
      image_url: row.image_path
        ? `${BASE_URL || "http://localhost:5000"}${row.image_path}`
        : null,
      address: {
        address_id: row.address_id,
        street: row.street,
        city: row.city,
        province: row.province,
        postal_code: row.postal_code,
        country: row.country,
        unit_number: row.unit_number,
        latitude: row.latitude,
        longitude: row.longitude,
      },
    };
  }
}
