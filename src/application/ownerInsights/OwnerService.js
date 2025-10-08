export default class OwnerService {
  constructor(ownerRepo) {
    this.ownerRepo = ownerRepo;
  }

  async getClinicPetOwners(clinicId) {
    try {
      // Call the repository to get data
      const data = await this.ownerRepo.getClinicPetOwners(clinicId);
      return data;
    } catch (err) {
      console.error("OwnerService Error:", err);
      throw new Error("Failed to fetch clinic pet owners");
    }
  }
}
