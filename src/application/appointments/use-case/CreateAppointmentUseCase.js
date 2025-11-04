export default class CreateAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentData) {
    console.log("Booking data:", appointmentData);

    if (!appointmentData.vetId || !appointmentData.clientId) {
      throw new Error("Vet ID and Client ID are required");
    }

    const appointmentDate = new Date(appointmentData.date);
    const now = new Date();

    // ✅ Check past date
    if (appointmentDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
      throw new Error("Cannot book an appointment in the past");
    }

    // ✅ Check past time (same day)
    const today = now.toISOString().split("T")[0];
    if (appointmentData.date === today && appointmentData.startTime) {
      // Convert to local time for comparison (PH / system)
      const [hours, minutes] = appointmentData.startTime.split(":").map(Number);

      const appointmentDateTime = new Date();
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // 🕒 Adjust by local offset difference (important for UTC envs)
      const localOffset = appointmentDateTime.getTimezoneOffset() * 60000;
      const adjustedAppointmentTime = new Date(
        appointmentDateTime.getTime() - localOffset
      );

      if (adjustedAppointmentTime < now) {
        throw new Error("Cannot book a time that has already passed today");
      }
    }

    return await this.appointmentRepository.createAppointment(appointmentData);
  }
}
