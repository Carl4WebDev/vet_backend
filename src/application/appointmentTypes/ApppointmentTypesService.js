export default class AppointmentTypesService {
  constructor(getAllAppointmentTypesUseCase) {
    this.getAllAppointmentTypesUseCase = getAllAppointmentTypesUseCase;
  }

  getAllAppointmentTypes() {
    return this.getAllAppointmentTypesUseCase.execute();
  }
}
