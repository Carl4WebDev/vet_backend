import IAppointmentTypeRepository from "../../domain/repositories/IAppointmentTypeRepository.js";
import AppointmentType from "../../domain/Entities/AppointmentType.js";

export default class PostgresAppointmentTypeRepository extends IAppointmentTypeRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getAll() {
    const result = await this.pool.query(
      "SELECT * FROM AppointmentTypes ORDER BY type_id"
    );
    return result.rows.map(
      (row) => new AppointmentType(row.type_id, row.name, row.duration_minutes)
    );
  }
}
