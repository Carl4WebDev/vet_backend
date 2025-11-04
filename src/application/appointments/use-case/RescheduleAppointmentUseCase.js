export default class RescheduleAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentId, updates) {
    const { date, start_time, end_time, notes } = updates;

    // 1. Validate input
    if (!appointmentId || !date || !start_time || !end_time) {
      throw new Error("Missing required fields");
    }

    // 🛑 1.5 — Prevent rescheduling to a past date/time
    const now = new Date();
    const appointmentDate = new Date(date);

    // If the date is before today
    if (appointmentDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
      throw new Error("Cannot reschedule to a past date.");
    }

    // If the date is today, check time as well
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      const [hours, minutes] = start_time.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);

      if (slotTime < now) {
        throw new Error("Cannot reschedule to a past time today.");
      }
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
