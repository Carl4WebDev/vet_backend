export default class GetAppointmentsUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(vetId) {
    if (!vetId) throw new Error("Vet ID is required");
    return await this.appointmentRepository.getAppointmentsByVet(vetId);
  }
}
