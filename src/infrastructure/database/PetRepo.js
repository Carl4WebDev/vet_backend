export default class PetRepo {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * 🧩 Updates pet info and inserts a new image (if provided) in one transaction.
   * @param {number} petId
   * @param {object} data - { name, age, weight, gender, birthday, species, breed, bio }
   * @param {object|null} file - multer file { filename, originalname, mimetype }
   */
  async updatePetAndImage(petId, data, file) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // --------------------------
      // 🐾 Update Pet Info
      // --------------------------
      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = [
        "name",
        "age",
        "weight",
        "gender",
        "birthday",
        "species",
        "breed",
        "bio",
      ];

      for (const key of allowed) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          fields.push(`${key} = $${idx++}`);
          values.push(data[key]);
        }
      }

      let updatedPet = null;
      if (fields.length > 0) {
        values.push(petId);
        const q = `UPDATE pets SET ${fields.join(
          ", "
        )} WHERE pet_id = $${idx} RETURNING *`;
        const { rows } = await client.query(q, values);
        updatedPet = rows[0];
      }

      // --------------------------
      // 🖼️ Insert Pet Image (optional)
      // --------------------------
      let insertedImage = null;
      if (file) {
        const filePath = `/uploads/pets/${file.filename}`.replace(/\\/g, "/");
        const fileName = file.originalname || file.filename;
        const mimeType = file.mimetype || "application/octet-stream";

        const imageQuery = `
          INSERT INTO images (file_path, entity_type, entity_id, file_name, mime_type)
          VALUES ($1, 'pet', $2, $3, $4)
          RETURNING *;
        `;
        const imageValues = [filePath, petId, fileName, mimeType];
        const { rows } = await client.query(imageQuery, imageValues);
        insertedImage = rows[0];
      }

      await client.query("COMMIT");
      return { success: true, pet: updatedPet, image: insertedImage };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ updatePetAndImage error:", err);
      throw err;
    } finally {
      client.release();
    }
  }
}
