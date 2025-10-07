// src/application/clinics/use-case/GetClinicDetailsUseCase.js
export default class GetClinicDetailsUseCase {
  constructor(clinicRepo) {
    this.clinicRepo = clinicRepo;
  }

  async execute(clinicId) {
    if (!clinicId) throw new Error("Clinic ID is required");

    const clinic = await this.clinicRepo.getClinicWithImageById(clinicId);
    if (!clinic) throw new Error(`Clinic with ID ${clinicId} not found`);

    return clinic;
  }
}
