export default class GetPetMedRecordsUseCase {
  constructor(medicalRecordRepo) {
    this.medicalRecordRepo = medicalRecordRepo;
  }

  async execute(petId) {
    return await this.medicalRecordRepo.getMedicalHistory(petId);
  }
}
