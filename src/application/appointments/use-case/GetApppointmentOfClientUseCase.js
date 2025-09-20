export default class GetAppointmentOfClientUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(clientId) {
    return await this.appointmentRepository.getAppointmentOfClient(clientId);
  }
}
