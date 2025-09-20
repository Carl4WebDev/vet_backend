export default class CancelAppointmentUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentId) {
    if (!appointmentId) throw new Error("Appointment ID is required");
    return await this.appointmentRepository.cancelAppointment(appointmentId);
  }
}
