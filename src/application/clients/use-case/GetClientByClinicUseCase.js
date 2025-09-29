export default class GetClientsByClinicUseCase {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  async execute(clinicId) {
    if (!clinicId) throw new Error("Clinic ID is required");
    return await this.userRepo.getClientsByClinic(clinicId);
  }
}
