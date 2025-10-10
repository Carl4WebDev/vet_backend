export default class ImageRepo {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Inserts a new image row for a pet.
   * @returns {Promise<object>} inserted row
   */
  async insertPetImage({ petId, filePath, fileName, mimeType }) {
    const q = `
      INSERT INTO images (file_path, entity_type, entity_id, file_name, mime_type)
      VALUES ($1, 'pet', $2, $3, $4)
      RETURNING image_id, file_path, entity_type, entity_id, file_name, mime_type, created_at
    `;
    const params = [filePath, petId, fileName, mimeType];
    const { rows } = await this.pool.query(q, params);
    return rows[0];
  }
}

// export default class ImageRepository {
//   constructor(pool) {
//     this.pool = pool;
//   }

//   async findByEntity(entityType, entityId) {
//     const res = await this.pool.query(
//       `SELECT * FROM images WHERE entity_type = $1 AND entity_id = $2 LIMIT 1`,
//       [entityType, entityId]
//     );
//     return res.rows[0] || null;
//   }

//   async insertImage(filePath, fileName, mimeType, entityType, entityId) {
//     const res = await this.pool.query(
//       `INSERT INTO images (file_path, file_name, mime_type, entity_type, entity_id)
//        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//       [filePath, fileName, mimeType, entityType, entityId]
//     );
//     return res.rows[0];
//   }

//   async updateImage(imageId, filePath, fileName, mimeType) {
//     const res = await this.pool.query(
//       `UPDATE images SET file_path = $1, file_name = $2, mime_type = $3 WHERE image_id = $4 RETURNING *`,
//       [filePath, fileName, mimeType, imageId]
//     );
//     return res.rows[0];
//   }
// }
