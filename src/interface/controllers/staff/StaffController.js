export default class StaffController {
  constructor(
    getClinicStaffUseCase,
    addStaffUseCase,
    editStaffUseCase,
    deleteStaffUseCase
  ) {
    this.getClinicStaffUseCase = getClinicStaffUseCase;
    this.addStaffUseCase = addStaffUseCase;
    this.editStaffUseCase = editStaffUseCase;
    this.deleteStaffUseCase = deleteStaffUseCase;
  }
  getClinicStaff = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const result = await this.getClinicStaffUseCase.execute(clinicId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  addStaff = async (req, res) => {
    try {
      const result = await this.addStaffUseCase.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to add staff" });
    }
  };

  editStaff = async (req, res) => {
    try {
      const { staffId } = req.params;
      const result = await this.editStaffUseCase.execute(staffId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to edit staff" });
    }
  };

  deleteStaff = async (req, res) => {
    try {
      const { staffId } = req.params;
      const result = await this.deleteStaffUseCase.execute(staffId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete staff" });
    }
  };
}
