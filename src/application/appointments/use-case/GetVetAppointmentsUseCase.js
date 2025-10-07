// use case
export default class GetVetAppointmentsUseCase {
  constructor(appointmentRepo) {
    this.appointmentRepo = appointmentRepo;
  }

  async execute(vetId, filters) {
    if (!vetId) throw new Error("Veterinarian ID is required");

    // filters = { date, month, year }
    return await this.appointmentRepo.getAppointmentsByVeterinarian(
      vetId,
      filters
    );
  }
}
