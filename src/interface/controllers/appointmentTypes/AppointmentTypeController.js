export default class AppointmentTypeController {
  constructor(appointmentTypesService) {
    this.appointmentTypesService = appointmentTypesService;
  }

  async getAll(req, res) {
    try {
      const appointmentTypes =
        await this.appointmentTypesService.getAllAppointmentTypes();
      res.json(appointmentTypes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
