export default class GetAllAppointmentTypesUseCase {
  constructor(appointmentTypeRepository) {
    this.appointmentTypeRepository = appointmentTypeRepository;
  }

  async execute() {
    return await this.appointmentTypeRepository.getAll();
  }
}
