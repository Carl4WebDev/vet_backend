export default class CreatePetMedicalRecordUseCase {
  constructor(medicalRecordRepo) {
    this.medicalRecordRepo = medicalRecordRepo;
  }

  async execute(petId, data, files = []) {
    if (!data) throw new Error("Form data is missing.");
    return await this.medicalRecordRepo.createMedicalRecord(petId, data, files);
  }
}
