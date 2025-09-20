export default class CreateAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentData) {
    console.log("Booking data:", appointmentData);
    if (!appointmentData.vetId || !appointmentData.clientId) {
      throw new Error("Vet ID and Client ID are required");
    }
    return await this.appointmentRepository.createAppointment(appointmentData);
  }
}
