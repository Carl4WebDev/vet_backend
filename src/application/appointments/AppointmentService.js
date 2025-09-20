export default class AppointmentService {
  constructor(
    createAppointmentUseCase,
    getAppointmentsUseCase,
    cancelAppointmentUseCase,
    getAvailableSlotsUseCase,
    getAppointmentOfClientUseCase,
    getAppointmentByIdUseCase,
    rescheduleAppointmentUseCase
  ) {
    this.createAppointmentUseCase = createAppointmentUseCase;
    this.getAppointmentsUseCase = getAppointmentsUseCase;
    this.cancelAppointmentUseCase = cancelAppointmentUseCase;
    this.getAvailableSlotsUseCase = getAvailableSlotsUseCase;
    this.getAppointmentOfClientUseCase = getAppointmentOfClientUseCase;
    this.getAppointmentByIdUseCase = getAppointmentByIdUseCase;
    this.rescheduleAppointmentUseCase = rescheduleAppointmentUseCase;
  }

  createAppointment(data) {
    return this.createAppointmentUseCase.execute(data);
  }

  getAppointments(vetId) {
    return this.getAppointmentsUseCase.execute(vetId);
  }

  cancelAppointment(appointmentId) {
    return this.cancelAppointmentUseCase.execute(appointmentId);
  }
  getAvailableSlots({ vetId, typeId, date }) {
    return this.getAvailableSlotsUseCase.execute({ vetId, typeId, date });
  }
  getAppointmentOfClient(clientId) {
    return this.getAppointmentOfClientUseCase.execute(clientId);
  }
  getAppointmentById(appointmentId) {
    return this.getAppointmentByIdUseCase.execute(appointmentId);
  }
  reschedule(appointmentId, updates) {
    return this.rescheduleAppointmentUseCase.execute(appointmentId, updates);
  }
}
