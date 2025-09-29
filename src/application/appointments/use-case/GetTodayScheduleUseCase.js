export default class GetTodayScheduleUseCase {
  constructor(appointmentRepo) {
    this.appointmentRepo = appointmentRepo;
  }

  async execute(clinicId) {
    return await this.appointmentRepo.getTodaySchedule(clinicId);
  }
}
