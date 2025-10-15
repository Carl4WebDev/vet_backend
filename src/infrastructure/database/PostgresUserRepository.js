import IUserRepository from "../../domain/repositories/IUserRepository.js";

import AddressBuilder from "../../domain/Builders/AddressBuilder.js";
import PetBuilder from "../../domain/Builders/PetBuilder.js";
import ClientBuilder from "../../domain/Builders/ClientBuilder.js";
import ClinicBuilder from "../../domain/Builders/ClinicBuilder.js";

const BASE_URL = process.env.BASE_URL;
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
      let createdClient = null;
      let createdClinic = null;

      if (role === "client") {
        createdClient = await this.insertClient(
          client,
          userData,
          user.user_id,
          addressId
        );
      }

      if (role === "clinic_owner") {
        createdClinic = await this.insertClinic(
          client,
          userData,
          user.user_id,
          addressId
        );
      }

      await client.query("COMMIT");

      // ✅ Return both — frontend expects client_table_id (from Clients) & client_id (from Users)
      return { user, client: createdClient, clinic: createdClinic };
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
    const result = await client.query(
      `INSERT INTO Clients (client_name, phone, tel_num, gender, user_id, address_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING client_id, client_name`,
      [
        `${userData.firstName} ${userData.lastName}`,
        userData.phone,
        userData.telephone || null,
        userData.gender,
        userId,
        addressId,
      ]
    );
    return result.rows[0]; // ✅ { client_id, client_name }
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

  // async getClient(userId) {
  //   const BASE_URL = process.env.BASE_URL;

  //   const query = `
  //   SELECT
  //     u.user_id,
  //     u.email,
  //     u.role,
  //     u.created_at,

  //     c.client_id,
  //     c.client_name,
  //     c.phone,
  //     c.tel_num,
  //     c.gender,
  //     c.address_id AS client_address_id,

  //     -- Client Address fields
  //     a.street AS client_street,
  //     a.city AS client_city,
  //     a.province AS client_province,
  //     a.postal_code AS client_zip,

  //     cl.clinic_id,
  //     cl.clinic_name,
  //     cl.phone_number AS clinic_phone,
  //     cl.address_id AS clinic_address_id,

  //     -- Clinic Address fields
  //     a2.street AS clinic_street,
  //     a2.city AS clinic_city,
  //     a2.province AS clinic_province,
  //     a2.postal_code AS clinic_zip,

  //     -- Clinic Owner fields
  //     owner.user_id AS owner_id,
  //     owner.email AS owner_email,
  //     owner.role AS owner_role,
  //     owner.created_at AS owner_created_at,

  //     p.pet_id,
  //     p.name AS pet_name,
  //     p.species,
  //     p.breed,
  //     p.age,
  //     p.weight,
  //     p.gender AS pet_gender,
  //     p.birthday,
  //     p.client_id AS pet_client_id,

  //     -- 🖼️ Client & Pet Images
  //     ci.file_path AS client_image_path,
  //     pi.file_path AS pet_image_path

  //   FROM Users u
  //   INNER JOIN Clients c ON u.user_id = c.user_id
  //   LEFT JOIN Addresses a ON c.address_id = a.address_id
  //   LEFT JOIN Clinics cl ON c.clinic_id = cl.clinic_id
  //   LEFT JOIN Addresses a2 ON cl.address_id = a2.address_id
  //   LEFT JOIN Users owner ON cl.owner_id = owner.user_id
  //   LEFT JOIN Pets p ON c.client_id = p.client_id -- optional pets
  //   LEFT JOIN Images ci
  //     ON ci.entity_type = 'client' AND ci.entity_id = c.client_id
  //   LEFT JOIN Images pi
  //     ON pi.entity_type = 'pet' AND pi.entity_id = p.pet_id
  //   WHERE u.user_id = $1
  // `;

  //   const result = await this.pool.query(query, [userId]);
  //   if (result.rows.length === 0) return null;

  //   const firstRow = result.rows[0];

  //   // 1️⃣ Build client address
  //   const clientAddress = firstRow.client_address_id
  //     ? new AddressBuilder()
  //         .setId(firstRow.client_address_id)
  //         .setStreet(firstRow.client_street)
  //         .setCity(firstRow.client_city)
  //         .setProvince(firstRow.client_province)
  //         .setPostalCode(firstRow.client_zip)
  //         .build()
  //     : null;

  //   // 2️⃣ Build clinic address
  //   const clinicAddress = firstRow.clinic_address_id
  //     ? new AddressBuilder()
  //         .setId(firstRow.clinic_address_id)
  //         .setStreet(firstRow.clinic_street)
  //         .setCity(firstRow.clinic_city)
  //         .setProvince(firstRow.clinic_province)
  //         .setPostalCode(firstRow.clinic_zip)
  //         .build()
  //     : null;

  //   // 3️⃣ Build clinic object
  //   const clinic = firstRow.clinic_id
  //     ? new ClinicBuilder()
  //         .setId(firstRow.clinic_id)
  //         .setName(firstRow.clinic_name)
  //         .setPhoneNumber(firstRow.clinic_phone)
  //         .setAddress(clinicAddress)
  //         .setOwner(
  //           firstRow.owner_id
  //             ? {
  //                 id: firstRow.owner_id,
  //                 email: firstRow.owner_email,
  //                 role: firstRow.owner_role,
  //                 createdAt: firstRow.owner_created_at,
  //               }
  //             : null
  //         )
  //         .build()
  //     : null;

  //   // 4️⃣ Build pets array (with image)
  //   const pets = result.rows
  //     .filter((r) => r.pet_id)
  //     .map((r) =>
  //       new PetBuilder()
  //         .setPetId(r.pet_id)
  //         .setClientId(r.pet_client_id)
  //         .setName(r.pet_name)
  //         .setSpecies(r.species)
  //         .setBreed(r.breed)
  //         .setAge(r.age)
  //         .setWeight(r.weight)
  //         .setGender(r.pet_gender)
  //         .setBirthday(r.birthday)
  //         .setImageUrl(
  //           r.pet_image_path
  //             ? `${BASE_URL || "http://localhost:5000"}${r.pet_image_path}`
  //             : null
  //         )
  //         .build()
  //     );

  //   // 5️⃣ Build client object (with image)
  //   const client = new ClientBuilder()
  //     .setClientId(firstRow.client_id)
  //     .setName(firstRow.client_name)
  //     .setPhone(firstRow.phone)
  //     .setTelNum(firstRow.tel_num)
  //     .setGender(firstRow.gender)
  //     .setAddress(clientAddress)
  //     .setClinic(clinic)
  //     .setPets(pets)
  //     .setImageUrl(
  //       firstRow.client_image_path
  //         ? `${BASE_URL || "http://localhost:5000"}${
  //             firstRow.client_image_path
  //           }`
  //         : null
  //     )
  //     .build();

  //   // 6️⃣ Return user + client
  //   return {
  //     user_id: firstRow.user_id,
  //     email: firstRow.email,
  //     role: firstRow.role,
  //     created_at: firstRow.created_at,
  //     client,
  //   };
  // }

  async getClient(userId) {
    const BASE_URL = process.env.BASE_URL;

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
      c.bio,

      -- Client Address
      a.street AS client_street,
      a.city AS client_city,
      a.province AS client_province,
      a.postal_code AS client_zip,

      -- Clinic Info
      cl.clinic_id,
      cl.clinic_name,
      cl.phone_number AS clinic_phone,
      cl.address_id AS clinic_address_id,

      a2.street AS clinic_street,
      a2.city AS clinic_city,
      a2.province AS clinic_province,
      a2.postal_code AS clinic_zip,

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
      p.client_id AS pet_client_id,

      -- ✅ Correct image joins
      ci_main.file_path AS client_main_image,
      ci_bg.file_path AS client_background_image,
      pi_main.file_path AS pet_image_path

    FROM Users u
    INNER JOIN Clients c ON u.user_id = c.user_id
    LEFT JOIN Addresses a ON c.address_id = a.address_id
    LEFT JOIN Clinics cl ON c.clinic_id = cl.clinic_id
    LEFT JOIN Addresses a2 ON cl.address_id = a2.address_id
    LEFT JOIN Users owner ON cl.owner_id = owner.user_id
    LEFT JOIN Pets p ON c.client_id = p.client_id
    LEFT JOIN Images ci_main ON ci_main.entity_type = 'client' AND ci_main.entity_id = c.client_id AND ci_main.image_role = 'main'
    LEFT JOIN Images ci_bg ON ci_bg.entity_type = 'client' AND ci_bg.entity_id = c.client_id AND ci_bg.image_role = 'background'
    LEFT JOIN Images pi_main ON pi_main.entity_type = 'pet' AND pi_main.entity_id = p.pet_id AND pi_main.image_role = 'main'
    WHERE u.user_id = $1
  `;

    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;

    const firstRow = result.rows[0];

    const clientAddress = firstRow.client_address_id
      ? {
          address_id: firstRow.client_address_id,
          street: firstRow.client_street,
          city: firstRow.client_city,
          province: firstRow.client_province,
          postal_code: firstRow.client_zip,
        }
      : null;

    const clinicAddress = firstRow.clinic_address_id
      ? {
          address_id: firstRow.clinic_address_id,
          street: firstRow.clinic_street,
          city: firstRow.clinic_city,
          province: firstRow.clinic_province,
          postal_code: firstRow.clinic_zip,
        }
      : null;

    const clinic = firstRow.clinic_id
      ? {
          id: firstRow.clinic_id,
          name: firstRow.clinic_name,
          phoneNumber: firstRow.clinic_phone,
          address: clinicAddress,
          owner: firstRow.owner_id
            ? {
                id: firstRow.owner_id,
                email: firstRow.owner_email,
                role: firstRow.owner_role,
                createdAt: firstRow.owner_created_at,
              }
            : null,
        }
      : null;

    const pets = result.rows
      .filter((r) => r.pet_id)
      .map((r) => ({
        petId: r.pet_id,
        clientId: r.pet_client_id,
        name: r.pet_name,
        species: r.species,
        breed: r.breed,
        age: r.age,
        weight: r.weight,
        gender: r.pet_gender,
        birthday: r.birthday,
        imageUrl: r.pet_image_path
          ? `${BASE_URL || "http://localhost:5000"}${r.pet_image_path}`
          : null,
      }));

    const client = {
      clientId: firstRow.client_id,
      name: firstRow.client_name,
      phone: firstRow.phone,
      telNum: firstRow.tel_num,
      gender: firstRow.gender,
      email: firstRow.email,
      bio: firstRow.bio,
      address: clientAddress,
      clinic,
      pets,
      mainImageUrl: firstRow.client_main_image
        ? `${BASE_URL || "http://localhost:5000"}${firstRow.client_main_image}`
        : null,
      backgroundImageUrl: firstRow.client_background_image
        ? `${BASE_URL || "http://localhost:5000"}${
            firstRow.client_background_image
          }`
        : null,
    };

    return {
      user_id: firstRow.user_id,
      email: firstRow.email,
      role: firstRow.role,
      created_at: firstRow.created_at,
      client,
    };
  }

  async updateClientWithAddressAndImages(clientId, updates) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // ✅ 1. Ensure client exists
      const checkRes = await client.query(
        "SELECT address_id FROM clients WHERE client_id = $1",
        [clientId]
      );
      if (checkRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const addressId = checkRes.rows[0].address_id;

      // ✅ 2. Update clients table
      const allowedFields = [
        "client_name",
        "phone",
        "tel_num",
        "gender",
        "bio",
      ];
      const setClauses = [];
      const values = [];
      let param = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (allowedFields.includes(key) && val !== undefined) {
          setClauses.push(`${key} = $${param}`);
          values.push(val);
          param++;
        }
      }

      if (setClauses.length > 0) {
        values.push(clientId);
        const updateQuery = `
        UPDATE clients
        SET ${setClauses.join(", ")}
        WHERE client_id = $${param}
      `;
        await client.query(updateQuery, values);
      }

      // ✅ 3. Update address (if provided)
      if (
        updates.street ||
        updates.city ||
        updates.province ||
        updates.postal_code
      ) {
        await client.query(
          `
        UPDATE addresses
        SET 
          street = COALESCE($1, street),
          city = COALESCE($2, city),
          province = COALESCE($3, province),
          postal_code = COALESCE($4, postal_code)
        WHERE address_id = $5
        `,
          [
            updates.street,
            updates.city,
            updates.province,
            updates.postal_code,
            addressId,
          ]
        );
      }

      // ✅ 4. Handle images
      const BASE_PATH = process.env.BASE_URL || "http://localhost:5000";

      const imageQueries = [];
      if (updates.mainImage) {
        imageQueries.push({
          entity_type: "client",
          entity_id: clientId,
          image_role: "main",
          file_path: `/uploads/clients/${updates.mainImage.filename}`, // ✅ only relative
        });
      }
      if (updates.backgroundImage) {
        imageQueries.push({
          entity_type: "client",
          entity_id: clientId,
          image_role: "background",
          file_path: `/uploads/clients/${updates.backgroundImage.filename}`, // ✅ same her
        });
      }

      for (const img of imageQueries) {
        await client.query(
          `
        INSERT INTO images (entity_type, entity_id, image_role, file_path)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (entity_type, entity_id, image_role)
        DO UPDATE SET file_path = EXCLUDED.file_path
        `,
          [img.entity_type, img.entity_id, img.image_role, img.file_path]
        );
      }

      await client.query("COMMIT");

      // ✅ Return updated client
      const final = await client.query(
        `SELECT * FROM clients WHERE client_id = $1`,
        [clientId]
      );
      return final.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ updateClientWithAddressAndImages:", err);
      throw err;
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
      c.*, 
      i.file_path AS image_path,
      CASE 
        WHEN i.file_path IS NOT NULL THEN CONCAT('${
          BASE_URL || "http://localhost:5000"
        }'::text, i.file_path)
        ELSE NULL 
      END AS image_url
    FROM clients c
    LEFT JOIN images i
      ON i.entity_type = 'client'
      AND i.entity_id = c.client_id
    WHERE c.clinic_id = $1
  `;

    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }
}
