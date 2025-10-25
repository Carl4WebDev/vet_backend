export default class CreateAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentData) {
    console.log("Booking data:", appointmentData);

    if (!appointmentData.vetId || !appointmentData.clientId) {
      throw new Error("Vet ID and Client ID are required");
    }

    // ✅ Check if appointment date is in the past
    const appointmentDate = new Date(appointmentData.date);
    const now = new Date();

    // Compare only dates, ignore time to avoid timezone edge issues
    if (appointmentDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
      throw new Error("Cannot book an appointment in the past");
    }

    return await this.appointmentRepository.createAppointment(appointmentData);
  }
}
