import generateTimeSlots from "../../../utils/timeSlots.js";

export default class GetAvailableSlotsUseCase {
  constructor(appointmentRepo, vetScheduleRepo) {
    this.appointmentRepo = appointmentRepo;
    this.vetScheduleRepo = vetScheduleRepo;
  }

  async execute({ vetId, typeId, date }) {
    // 1️⃣ Try to get the vet's schedule
    let schedule;
    try {
      schedule = await this.vetScheduleRepo.getSchedule(vetId, date);
    } catch (err) {
      console.warn(
        `⚠️ Error checking vet schedule for vet ${vetId}:`,
        err.message
      );
    }

    // 2️⃣ Determine schedule hours (fallback for freelance vets)
    let startTime = "08:00";
    let endTime = "17:00";
    if (schedule) {
      startTime = schedule.start_time;
      endTime = schedule.end_time;
    } else {
      console.warn(
        `⚠️ No schedule found for vet ${vetId}. Using default freelance hours 08:00–17:00.`
      );
    }

    // 3️⃣ Get appointment type duration
    const duration = await this.appointmentRepo.getAppointmentTypeDuration(
      typeId
    );
    if (!duration) throw new Error("Invalid appointment type");

    // 4️⃣ Generate available slots
    const allSlots = generateTimeSlots(startTime, endTime, duration);

    // 5️⃣ Fetch booked appointments
    const booked = await this.appointmentRepo.getScheduledAppointments(
      vetId,
      date
    );

    // 6️⃣ Filter out overlaps
    const available = allSlots.filter(
      (slot) =>
        !booked.some((b) => slot.start < b.end_time && slot.end > b.start_time)
    );

    return available;
  }
}
