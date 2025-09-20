export default class IAppointmentRepository {
  async createAppointment(appointmentData) {
    throw new Error("Implement createAppointment!");
  }

  async getAppointmentsByVet(vetId) {
    throw new Error("Implement get appointment!");
  }

  async cancelAppointment(appointmentId) {
    throw new Error("Implement cancelAppointment!");
  }
}
