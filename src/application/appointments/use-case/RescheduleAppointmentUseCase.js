// usecases/RescheduleAppointmentUseCase.js
export default class RescheduleAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentId, updates) {
    const { date, start_time, end_time, notes } = updates;

    // 1. Validate input
    if (!appointmentId || !date || !start_time || !end_time || !notes) {
      throw new Error("Missing required fields");
    }

    // 2. Ensure appointment exists
    const appointment = await this.appointmentRepository.findById(
      appointmentId
    );
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // 3. Update (repository handles conflict check)
    const result = await this.appointmentRepository.update(appointmentId, {
      date,
      start_time,
      end_time,
      notes,
    });

    // 4. Handle repository result
    if (!result.success) {
      throw new Error(result.message);
    }

    return result.appointment;
  }
}
