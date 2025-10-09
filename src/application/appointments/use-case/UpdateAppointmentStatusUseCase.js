// usecases/RescheduleAppointmentUseCase.js
export default class UpdateAppointmentStatusUseCase {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentId, newStatus) {
    if (!appointmentId) throw new Error("Appointment ID is required");
    if (!newStatus) throw new Error("New status is required");

    const result = await this.appointmentRepository.updateAppointmentStatusRepo(
      appointmentId,
      newStatus
    );
    if (!result) throw new Error("Failed to update appointment");

    return `Appointment ${appointmentId} marked as ${newStatus}`;
  }
}
