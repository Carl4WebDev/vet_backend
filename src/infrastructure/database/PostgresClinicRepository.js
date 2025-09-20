// src/infrastructure/database/PostgresClinicRepository.js
import IClinicRepository from "../../domain/repositories/IClinicRepository.js";
import ClinicBuilder from "../../domain/Builders/ClinicBuilder.js";
import AddressBuilder from "../../domain/Builders/AddressBuilder.js";

export default class PostgresClinicRepository extends IClinicRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findByEmail(email) {
    const query = `
    SELECT u.user_id, u.email, u.password, u.role,
           c.clinic_id, c.clinic_name, c.phone_number, c.is_active, c.address_id
    FROM users u
    LEFT JOIN clinics c ON c.owner_id = u.user_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `;
    const { rows } = await this.pool.query(query, [email]);
    return rows[0] || null;
  }

  async createClinicWithAddress({
    clinic_name,
    phone_number,
    ownerId,
    address,
  }) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const street = (address.street || "").trim();
      const city = (address.city || "").trim();
      const province = (address.province || "").trim();
      const postal_code = (address.postalCode || "").trim();
      const country = (address.country || "Philippines").trim();
      const unit_number = (address.unit || "").trim();

      // 1) Check if address exists
      const findRes = await client.query(
        `SELECT address_id FROM addresses
         WHERE lower(trim(street)) = lower(trim($1))
           AND lower(trim(city)) = lower(trim($2))
           AND lower(coalesce(trim(province), '')) = lower(coalesce(trim($3), ''))
           AND coalesce(postal_code,'') = coalesce($4,'')
           AND lower(coalesce(trim(unit_number), '')) = lower(coalesce(trim($5), ''))
           AND lower(coalesce(trim(country), '')) = lower(coalesce(trim($6), ''))
         LIMIT 1`,
        [street, city, province, postal_code, unit_number, country]
      );

      let addressId;
      if (findRes.rows.length > 0) {
        addressId = findRes.rows[0].address_id;
      } else {
        const insAddr = await client.query(
          `INSERT INTO addresses (street, city, province, postal_code, country, unit_number)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING address_id`,
          [street, city, province, postal_code, country, unit_number]
        );
        addressId = insAddr.rows[0].address_id;
      }

      // 2) Insert clinic
      const insClinic = await client.query(
        `INSERT INTO clinics (clinic_name, phone_number, is_active, address_id, owner_id)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING clinic_id, clinic_name, phone_number, is_active, address_id, owner_id, created_at`,
        [clinic_name, phone_number, true, addressId, ownerId]
      );

      await client.query("COMMIT");

      return {
        ...insClinic.rows[0],
        address: {
          address_id: addressId,
          street,
          city,
          province,
          postal_code,
          country,
          unit_number,
        },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

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
        a.created_at AS address_created_at,
        a.latitude,
        a.longitude,

        u.user_id AS owner_id,
        u.email AS owner_email,
        u.role AS owner_role,
        u.created_at AS owner_created_at

    FROM clinics c
    JOIN addresses a ON c.address_id = a.address_id
    JOIN users u ON c.owner_id = u.user_id
  `;

    const result = await this.pool.query(query);

    return result.rows.map((row) => {
      const address = new AddressBuilder()
        .setId(row.address_id)
        .setStreet(row.street)
        .setCity(row.city)
        .setProvince(row.province)
        .setPostalCode(row.postal_code)
        .setCountry(row.country)
        .setUnitNumber(row.unit_number) // ✅ matches AddressBuilder
        .setLatitude(row.latitude)
        .setLongitude(row.longitude)
        .build();

      return new ClinicBuilder()
        .setId(row.clinic_id)
        .setName(row.clinic_name)
        .setPhoneNumber(row.phone_number)
        .setIsActive(row.is_active)
        .setAddress(address)
        .setOwner({
          id: row.owner_id,
          email: row.owner_email,
          role: row.owner_role,
          createdAt: row.owner_created_at,
        })
        .setCreatedAt(row.clinic_created_at)
        .build();
    });
  }

  async getClinicById(clinicId) {
    const query = `SELECT * from clinics c WHERE clinic_id = $1`;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows[0];
  }
}
