export default class GetClinicByIdUseCase {
  constructor(clinicRepo) {
    this.clinicRepo = clinicRepo;
  }

  async execute(clinicId) {
    return await this.clinicRepo.getClinicById(clinicId);
  }
}
