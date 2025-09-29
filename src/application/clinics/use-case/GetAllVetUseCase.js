export default class GetAllVetUseCase {
  constructor(clinicRepo) {
    this.clinicRepo = clinicRepo;
  }

  async execute(clinicId) {
    return await this.clinicRepo.getAllVeterinarians(clinicId);
  }
}
