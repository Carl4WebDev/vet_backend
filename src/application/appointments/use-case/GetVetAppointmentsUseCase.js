export default class GetVetAppointmentsUseCase {
  constructor(appointmentRepo) {
    this.appointmentRepo = appointmentRepo;
  }

  async execute(vetId, date) {
    if (!vetId) throw new Error("Veterinarian ID is required");
    return await this.appointmentRepo.getAppointmentsByVeterinarian(
      vetId,
      date
    );
  }
}
