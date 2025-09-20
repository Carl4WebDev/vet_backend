import { query } from "express-validator";
import IPetRepository from "../../domain/repositories/IPetRepository.js";

export default class PostgresPetRepository extends IPetRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }
  async addPet(pet) {
    const query = `
      INSERT INTO pets (client_id, name, age, weight, gender, birthday, species, breed, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      pet.clientId,
      pet.name,
      pet.age,
      pet.weight,
      pet.gender,
      pet.birthday,
      pet.species,
      pet.breed,
      pet.bio,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async getAllPets(clientId) {
    const query = `
    SELECT * 
    FROM pets 
    WHERE client_id = $1
  `;
    const { rows } = await this.pool.query(query, [clientId]);
    return rows || null;
  }

  async updatePet(petId, updates) {
    console.log("UPDATE PET CALLED WITH:", { petId, updates }); // ← Add this

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Check if pet exists first
      const checkQuery = "SELECT * FROM pets WHERE pet_id = $1";
      const checkResult = await client.query(checkQuery, [petId]);
      console.log("PET EXISTS CHECK:", checkResult.rows.length > 0); // ← Add this

      if (checkResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      // Build dynamic update query
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        "name",
        "age",
        "weight",
        "gender",
        "birthday",
        "species",
        "breed",
        "bio",
      ];

      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      console.log("SET CLAUSES:", setClauses); // ← Add this
      console.log("VALUES:", values); // ← Add this

      if (setClauses.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("No valid fields to update");
      }

      // Add petId as the last parameter
      values.push(petId);

      const updateQuery = `
      UPDATE pets 
      SET ${setClauses.join(", ")}
      WHERE pet_id = $${paramCount}
      RETURNING *
    `;

      console.log("FINAL QUERY:", updateQuery); // ← Add this

      const result = await client.query(updateQuery, values);
      await client.query("COMMIT");

      console.log("UPDATE RESULT:", result.rows[0]); // ← Add this
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database error in update:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(petId) {
    const query = "SELECT * FROM pets WHERE pet_id = $1";

    try {
      const result = await this.pool.query(query, [petId]);
      return result.rows[0];
    } catch (error) {
      console.error("Database error in findById:", error);
      throw error;
    }
  }
}
