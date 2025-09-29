export default class OwnerService {
  constructor(ownerRepo) {
    this.ownerRepo = ownerRepo;
  }

  async getClinicPetOwners(req, res) {
    try {
      const { clinicId } = req.params;
      const data = await this.ownerRepo.getClinicPetOwners(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
