export default class ImageRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByEntity(entityType, entityId) {
    const res = await this.pool.query(
      `SELECT * FROM images WHERE entity_type = $1 AND entity_id = $2 LIMIT 1`,
      [entityType, entityId]
    );
    return res.rows[0] || null;
  }

  async insertImage(filePath, fileName, mimeType, entityType, entityId) {
    const res = await this.pool.query(
      `INSERT INTO images (file_path, file_name, mime_type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [filePath, fileName, mimeType, entityType, entityId]
    );
    return res.rows[0];
  }

  async updateImage(imageId, filePath, fileName, mimeType) {
    const res = await this.pool.query(
      `UPDATE images SET file_path = $1, file_name = $2, mime_type = $3 WHERE image_id = $4 RETURNING *`,
      [filePath, fileName, mimeType, imageId]
    );
    return res.rows[0];
  }
}
