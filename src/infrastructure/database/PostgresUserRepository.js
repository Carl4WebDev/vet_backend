import IUserRepository from "../../domain/repositories/IUserRepository.js";

import AddressBuilder from "../../domain/Builders/AddressBuilder.js";
import PetBuilder from "../../domain/Builders/PetBuilder.js";
import ClientBuilder from "../../domain/Builders/ClientBuilder.js";
import ClinicBuilder from "../../domain/Builders/ClinicBuilder.js";
export default class PostgresUserRepository extends IUserRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findByEmail(email) {
    const result = await this.pool.query(
      "SELECT * FROM Users u JOIN Clients c ON u.user_id = c.user_id WHERE u.email = $1",
      [email]
    );
    return result.rows[0];
  }

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

      // 3️⃣ Insert into Role-Specific Table
      if (role === "client") {
        await this.insertClient(client, userData, user.user_id, addressId);
      }
      if (role === "clinic_owner") {
        await this.insertClinic(client, userData, user.user_id, addressId);
      }

      await client.query("COMMIT");
      return user;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // 🔹 Separate helpers for each table insert
  async insertUser(client, email, password, role) {
    const result = await client.query(
      `INSERT INTO Users (email, password, role) 
       VALUES ($1, $2, $3) RETURNING user_id, email, role`,
      [email, password, role]
    );
    return result.rows[0];
  }

  async insertAddress(client, address) {
    // 1️⃣ Check if address already exists
    const existing = await client.query(
      `SELECT address_id FROM Addresses
     WHERE street = $1 AND city = $2 AND province = $3 
       AND postal_code = $4 AND country = $5 AND unit_number = $6`,
      [
        address.street,
        address.city,
        address.province,
        address.postalCode,
        address.country,
        address.unit,
      ]
    );

    if (existing.rows.length > 0) {
      // Return existing address_id if found
      return existing.rows[0].address_id;
    }

    // 2️⃣ Otherwise insert new address
    const result = await client.query(
      `INSERT INTO Addresses (street, city, province, postal_code, country, unit_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING address_id`,
      [
        address.street,
        address.city,
        address.province,
        address.postalCode,
        address.country,
        address.unit,
      ]
    );

    return result.rows[0].address_id;
  }

  async insertClient(client, userData, userId, addressId) {
    await client.query(
      `INSERT INTO Clients (client_name, phone, tel_num, gender, user_id, address_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `${userData.firstName} ${userData.lastName}`,
        userData.phone,
        userData.telephone || null,
        userData.gender,
        userId,
        addressId,
      ]
    );
  }

  async insertClinic(client, userData, userId, addressId) {
    await client.query(
      `INSERT INTO Clinics (clinic_name, phone_number, is_active, address_id, owner_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `${userData.firstName} ${userData.lastName} Clinic`,
        userData.phone,
        true,
        addressId,
        userId,
      ]
    );
  }

  async getClient(userId) {
    const query = `
    SELECT
      u.user_id,
      u.email,
      u.role,
      u.created_at,

      c.client_id,
      c.client_name,
      c.phone,
      c.tel_num,
      c.gender,
      c.address_id AS client_address_id,

      -- Client Address fields
      a.street AS client_street,
      a.city AS client_city,
      a.province AS client_province,
      a.postal_code AS client_zip,

      cl.clinic_id,
      cl.clinic_name,
      cl.phone_number AS clinic_phone,
      cl.address_id AS clinic_address_id,

      -- Clinic Address fields
      a2.street AS clinic_street,
      a2.city AS clinic_city,
      a2.province AS clinic_province,
      a2.postal_code AS clinic_zip,

      -- Clinic Owner fields
      owner.user_id AS owner_id,
      owner.email AS owner_email,
      owner.role AS owner_role,
      owner.created_at AS owner_created_at,

      p.pet_id,
      p.name AS pet_name,
      p.species,
      p.breed,
      p.age,
      p.weight,
      p.gender AS pet_gender,
      p.birthday,
      p.client_id AS pet_client_id

    FROM Users u
    INNER JOIN Clients c ON u.user_id = c.user_id
    LEFT JOIN Addresses a ON c.address_id = a.address_id
    LEFT JOIN Clinics cl ON c.clinic_id = cl.clinic_id
    LEFT JOIN Addresses a2 ON cl.address_id = a2.address_id
    LEFT JOIN Users owner ON cl.owner_id = owner.user_id
    LEFT JOIN Pets p ON c.client_id = p.client_id -- LEFT JOIN for optional pets
    WHERE u.user_id = $1
  `;

    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;

    const firstRow = result.rows[0];

    // 1️⃣ Build client address (optional safety)
    const clientAddress = firstRow.client_address_id
      ? new AddressBuilder()
          .setId(firstRow.client_address_id)
          .setStreet(firstRow.client_street)
          .setCity(firstRow.client_city)
          .setProvince(firstRow.client_province)
          .setPostalCode(firstRow.client_zip)
          .build()
      : null;

    // 2️⃣ Build clinic address (optional)
    const clinicAddress = firstRow.clinic_address_id
      ? new AddressBuilder()
          .setId(firstRow.clinic_address_id)
          .setStreet(firstRow.clinic_street)
          .setCity(firstRow.clinic_city)
          .setProvince(firstRow.clinic_province)
          .setPostalCode(firstRow.clinic_zip)
          .build()
      : null;

    // 3️⃣ Build clinic object safely
    const clinic = firstRow.clinic_id
      ? new ClinicBuilder()
          .setId(firstRow.clinic_id)
          .setName(firstRow.clinic_name)
          .setPhoneNumber(firstRow.clinic_phone)
          .setAddress(clinicAddress)
          .setOwner(
            firstRow.owner_id
              ? {
                  id: firstRow.owner_id,
                  email: firstRow.owner_email,
                  role: firstRow.owner_role,
                  createdAt: firstRow.owner_created_at,
                }
              : null
          )
          .build()
      : null;

    // 4️⃣ Build pets array safely (empty if none)
    const pets = result.rows
      .filter((r) => r.pet_id)
      .map((r) =>
        new PetBuilder()
          .setPetId(r.pet_id)
          .setClientId(r.pet_client_id)
          .setName(r.pet_name)
          .setSpecies(r.species)
          .setBreed(r.breed)
          .setAge(r.age)
          .setWeight(r.weight)
          .setGender(r.pet_gender)
          .setBirthday(r.birthday)
          .build()
      );

    // 5️⃣ Build client object
    const client = new ClientBuilder()
      .setClientId(firstRow.client_id)
      .setName(firstRow.client_name)
      .setPhone(firstRow.phone)
      .setTelNum(firstRow.tel_num)
      .setGender(firstRow.gender)
      .setAddress(clientAddress)
      .setClinic(clinic)
      .setPets(pets)
      .build();

    // 6️⃣ Return user + client
    return {
      user_id: firstRow.user_id,
      email: firstRow.email,
      role: firstRow.role,
      created_at: firstRow.created_at,
      client,
    };
  }

  async updateClient(clientId, updates) {
    console.log("UPDATE CLIENT CALLED WITH:", { clientId, updates });

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Check if client exists first
      const checkQuery = "SELECT * FROM clients WHERE client_id = $1";
      const checkResult = await client.query(checkQuery, [clientId]);
      console.log("CLIENT EXISTS CHECK:", checkResult.rows.length > 0);

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      // Build dynamic update query
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        "client_name",
        "phone",
        "tel_num",
        "gender",
        "user_id",
        "address_id",
        "bio",
      ];

      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      console.log("SET CLAUSES:", setClauses);
      console.log("VALUES:", values);

      if (setClauses.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("No valid fields to update");
      }

      // Add clientId as the last parameter
      values.push(clientId);

      const updateQuery = `
            UPDATE clients 
            SET ${setClauses.join(", ")}
            WHERE client_id = $${paramCount}
            RETURNING *
        `;

      console.log("FINAL QUERY:", updateQuery);

      const result = await client.query(updateQuery, values);
      await client.query("COMMIT");

      console.log("UPDATE RESULT:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database error in update:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClientOnly(userId) {
    const result = await this.pool.query(
      "SELECT * FROM users u JOIN clients c ON u.user_id = c.user_id JOIN addresses add ON add.address_id = c.address_id WHERE u.user_id = $1",
      [userId]
    );
    return result.rows[0];
  }

  async getClientsByClinic(clinicId) {
    const query = `
      SELECT 
      *
      FROM clients
      WHERE clinic_id = $1
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
