// application/appointments/usecases/GetAvailableSlotsUseCase.js
import generateTimeSlots from "../../../utils/timeSlots.js";

export default class GetAvailableSlotsUseCase {
  constructor(appointmentRepo, vetScheduleRepo) {
    this.appointmentRepo = appointmentRepo;
    this.vetScheduleRepo = vetScheduleRepo;
  }

  async execute({ vetId, typeId, date }) {
    // 1. Get vet schedule
    const schedule = await this.vetScheduleRepo.getSchedule(vetId, date);
    if (!schedule) throw new Error("Vet schedule not found");

    // 2. Get appointment type duration
    const type = await this.appointmentRepo.getAppointmentTypeDuration(typeId);
    if (!type) throw new Error("Invalid appointment type");
    // 3. Generate all possible slots
    const allSlots = generateTimeSlots(
      schedule.start_time,
      schedule.end_time,
      type
    );

    // 4. Get booked appointments
    const booked = await this.appointmentRepo.getScheduledAppointments(
      vetId,
      date
    );

    // 5. Filter out overlapping slots
    const available = allSlots.filter(
      (slot) =>
        !booked.some((b) => slot.start < b.end_time && slot.end > b.start_time)
    );

    return available;
  }
}
