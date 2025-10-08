export default class OwnerController {
  constructor(ownerService) {
    this.ownerService = ownerService;
  }

  getClinicPetOwners = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.ownerService.getClinicPetOwners(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("OwnerController Error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
