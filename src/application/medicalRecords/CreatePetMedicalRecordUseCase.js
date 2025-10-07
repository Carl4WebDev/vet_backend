export default class CreatePetMedicalRecordUseCase {
  constructor(medicalRecordRepo) {
    this.medicalRecordRepo = medicalRecordRepo;
  }

  async execute(petId, data) {
    return await this.medicalRecordRepo.createMedicalRecord(petId, data);
  }
}
