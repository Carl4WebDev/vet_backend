// src/interface/controllers/OwnerInsightsController.js
export default class PatientsController {
  constructor(getPatientRecordsClinic) {
    this.getPatientRecordsClinic = getPatientRecordsClinic;
  }

  getPatient = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.getPatientRecordsClinic.execute(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
