// infrastructure/db/PostgresAppointmentRepository.js
import IAppointmentRepository from "../../domain/repositories/IAppointmentRepository.js";

export default class PostgresAppointmentRepository extends IAppointmentRepository {
  constructor(pool) {
    super();
    this.pool = pool; // pg Pool instance
  }

  // Step 1: Get duration for appointment type
  async getAppointmentTypeDuration(typeId) {
    const result = await this.pool.query(
      `SELECT duration_minutes FROM AppointmentTypes WHERE type_id = $1`,
      [typeId]
    );
    return result.rows.length ? result.rows[0].duration_minutes : null;
  }

  // Step 2: Check if vet has conflicting appointments
  async hasConflict(vetId, date, startTime, endTime) {
    const result = await this.pool.query(
      `
      SELECT 1
      FROM Appointments
      WHERE vet_id = $1
        AND date = $2
        AND status != 'canceled'
        AND (
          (start_time < $4 AND end_time > $3) -- overlap check
        )
      LIMIT 1
      `,
      [vetId, date, startTime, endTime]
    );
    return result.rows.length > 0;
  }

  async createAppointment(appointmentData) {
    const { vetId, clientId, petId, date, startTime, typeId, notes, clinicId } =
      appointmentData;

    // Step 1: Get duration
    const duration = await this.getAppointmentTypeDuration(typeId);
    if (!duration) {
      throw new Error("Invalid appointment type");
    }

    // Step 2: Calculate end_time
    const endTimeQuery = await this.pool.query(
      `SELECT ($1::time + ($2 || ' minutes')::interval) AS end_time`,
      [startTime, duration]
    );
    const endTime = endTimeQuery.rows[0].end_time;

    // Step 3: Check for conflicts
    const conflict = await this.hasConflict(vetId, date, startTime, endTime);
    if (conflict) {
      throw new Error("Appointment conflict detected");
    }

    // Step 4: Save appointment
    const result = await this.pool.query(
      `INSERT INTO Appointments 
        (vet_id, client_id, pet_id, date, start_time, end_time, type_id, status, notes, clinic_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Scheduled', $8,$9) 
       RETURNING *`,
      [
        vetId,
        clientId,
        petId,
        date,
        startTime,
        endTime,
        typeId,
        notes,
        clinicId,
      ]
    );

    return result.rows[0];
  }
  async getAppointmentsByVet(vetId) {
    const result = await this.pool.query(
      `SELECT * FROM Appointments WHERE vet_id = $1`,
      [vetId]
    );
    return result.rows;
  }

  async cancelAppointment(appointmentId) {
    const result = await this.pool.query(
      `UPDATE Appointments SET status = 'Cancelled' WHERE appointment_id = $1 RETURNING *`,
      [appointmentId]
    );
    return result.rows[0];
  }

  async getScheduledAppointments(vetId, date) {
    const res = await this.pool.query(
      `SELECT start_time, end_time
       FROM Appointments
       WHERE vet_id = $1 AND date = $2 AND status = 'Scheduled'`,
      [vetId, date]
    );
    return res.rows;
  }

  async getAppointmentOfClient(clientId) {
    const BASE_URL = process.env.BASE_URL;

    const query = `
    SELECT 
      a.appointment_id,
      a.date,
      a.start_time,
      a.end_time,
      a.status,
      a.notes,
      p.pet_id,
      p.name AS pet_name,
      i.file_path AS pet_image_path,  -- 🐾 added image join
      c.client_id,
      c.client_name,
      v.vet_id,
      v.name AS vet_name,
      v.specialization
    FROM Appointments a
    JOIN clients c ON c.client_id = a.client_id
    JOIN pets p ON p.pet_id = a.pet_id
    LEFT JOIN images i ON i.entity_type = 'pet' AND i.entity_id = p.pet_id -- 🐾 join pet image
    JOIN Veterinarians v ON v.vet_id = a.vet_id
    WHERE a.client_id = $1 AND a.status = 'Scheduled'
    ORDER BY a.date, a.start_time
  `;

    const result = await this.pool.query(query, [clientId]);

    // 🐶 Map with image URL
    return result.rows.map((r) => ({
      ...r,
      pet_image_url: r.pet_image_path
        ? `${BASE_URL || "http://localhost:5000"}${r.pet_image_path}`
        : null,
    }));
  }

  async getAppointmentById(appointmentId) {
    const query = `
    SELECT 
      a.appointment_id,
      a.date, 
      a.start_time, 
      a.end_time, 
      a.status, 
      a.notes,
      at.name AS appointment_type,
      at.type_id,
      p.name AS pet_name, 
      p.breed, 
      p.species,
      v.vet_id,
      v.name AS vet_name,
      c.clinic_name, 
      add.street, 
      add.city, 
      add.province,
      add.postal_code,
      cl.client_name,
      cl.phone AS client_phone
    FROM appointments a 
    LEFT JOIN appointmenttypes at ON a.type_id = at.type_id
    LEFT JOIN pets p ON a.pet_id = p.pet_id
    LEFT JOIN veterinarians v ON a.vet_id = v.vet_id
    LEFT JOIN clinics c ON a.clinic_id = c.clinic_id
    LEFT JOIN addresses add ON c.address_id = add.address_id
    LEFT JOIN clients cl ON a.client_id = cl.client_id
    WHERE a.appointment_id = $1`;

    const result = await this.pool.query(query, [appointmentId]);
    return result.rows[0];
  }

  // repositories/AppointmentRepository.js
  async update(appointmentId, updateData) {
    // 1. Find the appointment so we know vet_id
    const appointment = await this.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: "Appointment not found." };
    }

    // 2. Check conflict
    const conflict = await this.hasConflict(
      appointment.vet_id,
      updateData.date,
      updateData.start_time,
      updateData.end_time
    );

    if (conflict) {
      return { success: false, message: "Schedule conflict detected." };
    }

    // 3. Safe to update
    const result = await this.pool.query(
      `
    UPDATE Appointments
    SET date = $1, start_time = $2, end_time = $3, notes=$4
    WHERE appointment_id = $5
    RETURNING *;
    `,
      [
        updateData.date,
        updateData.start_time,
        updateData.end_time,
        updateData.notes,
        appointmentId,
      ]
    );

    return { success: true, appointment: result.rows[0] };
  }

  async findById(appointmentId) {
    const result = await this.pool.query(
      `SELECT * FROM appointments WHERE appointment_id = $1`,
      [appointmentId]
    );
    return result.rows[0];
  }

  async getTodaySchedule(clinicId) {
    const query = `
      SELECT a.appointment_id, a.start_time, a.end_time, at.name AS type, a.status,
             c.client_name, p.name AS pet_name, v.name
      FROM appointments a
      JOIN clients c ON a.client_id = c.client_id
      JOIN pets p ON a.pet_id = p.pet_id
      JOIN veterinarians v ON a.vet_id = v.vet_id
      JOIN appointmenttypes at ON a.type_id = at.type_id
      WHERE a.clinic_id = $1
        AND a.date = CURRENT_DATE
      ORDER BY a.start_time ASC
    `;
    const result = await this.pool.query(query, [clinicId]);
    return result.rows;
  }

  // repository
  async getAppointmentsByVeterinarian(vetId, { date, month, year } = {}) {
    let query = `
    SELECT 
      a.appointment_id,
      a.start_time,
      a.end_time,
      a.date,
      a.status,
      c.client_name AS customer_name,
      p.name AS pet_name,
      v.name AS veterinarian_name,
      at.name AS type_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.client_id
    JOIN pets p ON a.pet_id = p.pet_id
    JOIN veterinarians v ON a.vet_id = v.vet_id
    JOIN appointmenttypes at ON a.type_id = at.type_id
    WHERE a.vet_id = $1
  `;

    const params = [vetId];
    let paramIndex = 2;

    if (date) {
      query += ` AND a.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    } else if (month && year) {
      // Filter by specific month + year
      query += ` AND EXTRACT(MONTH FROM a.date) = $${paramIndex}`;
      params.push(month);
      paramIndex++;

      query += ` AND EXTRACT(YEAR FROM a.date) = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    } else if (year) {
      // Filter by year only
      query += ` AND EXTRACT(YEAR FROM a.date) = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    query += ` ORDER BY a.start_time ASC`;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async updateAppointmentStatusRepo(appointmentId, newStatus) {
    try {
      const query = `
      UPDATE appointments
      SET status = $1
      WHERE appointment_id = $2
      RETURNING *;
    `;
      const result = await this.pool.query(query, [newStatus, appointmentId]);
      return result.rowCount > 0 ? result.rows[0] : null;
    } catch (err) {
      console.error("❌ updateAppointmentStatusRepo error:", err);
      throw err;
    }
  }
}
