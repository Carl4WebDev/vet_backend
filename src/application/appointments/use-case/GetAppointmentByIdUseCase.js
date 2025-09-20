export default class GetAppointmentByIdUseCase {
  constructor(appointmentRepo) {
    this.appointmentRepo = appointmentRepo;
  }

  async execute(appointmentId) {
    return await this.appointmentRepo.getAppointmentById(appointmentId);
  }
}
