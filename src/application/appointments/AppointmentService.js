export default class AppointmentService {
  constructor(
    createAppointmentUseCase,
    getAppointmentsUseCase,
    cancelAppointmentUseCase,
    getAvailableSlotsUseCase,
    getAppointmentOfClientUseCase,
    getAppointmentByIdUseCase,
    rescheduleAppointmentUseCase,
    getTodayScheduleUseCase,
    getVetAppointmentsUseCase,
    updateAppointmentStatusUseCase
  ) {
    this.createAppointmentUseCase = createAppointmentUseCase;
    this.getAppointmentsUseCase = getAppointmentsUseCase;
    this.cancelAppointmentUseCase = cancelAppointmentUseCase;
    this.getAvailableSlotsUseCase = getAvailableSlotsUseCase;
    this.getAppointmentOfClientUseCase = getAppointmentOfClientUseCase;
    this.getAppointmentByIdUseCase = getAppointmentByIdUseCase;
    this.rescheduleAppointmentUseCase = rescheduleAppointmentUseCase;
    this.getTodayScheduleUseCase = getTodayScheduleUseCase;
    this.getVetAppointmentsUseCase = getVetAppointmentsUseCase;
    this.updateAppointmentStatusUseCase = updateAppointmentStatusUseCase;
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

  getTodaySchedule(clinicId) {
    return this.getTodayScheduleUseCase.execute(clinicId);
  }

  getVetAppointments(vetId, filters) {
    return this.getVetAppointmentsUseCase.execute(vetId, filters);
  }

  scheduledAppointment(appointmentId) {
    return this.updateAppointmentStatusUseCase.execute(
      appointmentId,
      "Scheduled"
    );
  }

  rejectAppointment(appointmentId) {
    return this.updateAppointmentStatusUseCase.execute(
      appointmentId,
      "Rejected"
    );
  }
  completeAppointment(appointmentId) {
    return this.updateAppointmentStatusUseCase.execute(
      appointmentId,
      "Complete"
    );
  }
}
