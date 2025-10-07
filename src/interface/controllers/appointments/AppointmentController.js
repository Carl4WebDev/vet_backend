export default class AppointmentController {
  constructor(appointmentService) {
    this.appointmentService = appointmentService;
  }

  createAppointment = async (req, res) => {
    try {
      const appointment = await this.appointmentService.createAppointment(
        req.body
      );
      console.log("Booking data:", appointment);

      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  getAppointments = async (req, res) => {
    try {
      const { vetId } = req.params;
      const appointments = await this.appointmentService.getAppointments(vetId);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelAppointment = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const result = await this.appointmentService.cancelAppointment(
        appointmentId
      );

      res.status(200).json({
        success: true,
        message: "Successfully cancelled appointment",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getAvailableSlots = async (req, res) => {
    try {
      const vetId = Number(req.query.vetId);
      const typeId = Number(req.query.typeId);
      const date = req.query.date;
      console.log(req.query);
      if (!vetId || !date || !typeId) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      const slots = await this.appointmentService.getAvailableSlots({
        vetId,
        typeId,
        date,
      });
      res.json({ availableSlots: slots });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getAppointmentOfClient = async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const appointments = await this.appointmentService.getAppointmentOfClient(
        clientId
      );
      res.json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  };
  async getAppointmentById(req, res) {
    try {
      const { appointmentId } = req.params;
      const appointment = await this.appointmentService.getAppointmentById(
        appointmentId
      );

      res.status(200).json({
        success: true,
        message: "Successfully retreived clinic",
        data: appointment,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async reschedule(req, res) {
    try {
      const { appointmentId } = req.params;
      const updates = req.body;

      const updatedAppointment = await this.appointmentService.reschedule(
        appointmentId,
        updates
      );

      res.status(200).json({
        success: true,
        message: "Appointment rescheduled",
        appointment: updatedAppointment,
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getTodaySchedule(req, res) {
    try {
      const clinicId = req.params.clinicId;
      const schedule = await this.appointmentService.getTodaySchedule(clinicId);
      res.status(200).json({
        success: true,
        message: "Today's schedule retrieved",
        data: schedule,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // controller
  async getVetAppointments(req, res) {
    try {
      const { vetId } = req.params;
      const { date, month, year } = req.query; // ✅ accept month & year too

      const data = await this.appointmentService.getVetAppointments(
        vetId,
        { date, month, year } // pass as object
      );

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching vet appointments:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch appointments" });
    }
  }
}
