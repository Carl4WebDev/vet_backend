export default class GetPetMedicalRecordsUseCase {
  constructor(medicalRecordRepo) {
    this.medicalRecordRepo = medicalRecordRepo;
  }

  async execute(petId) {
    try {
      console.log("Getting medical records for pet:", petId);

      // Validate input
      if (!petId) {
        throw new Error("Pet ID is required");
      }

      const numericPetId = parseInt(petId);
      if (isNaN(numericPetId)) {
        throw new Error("Pet ID must be a valid number");
      }

      // Get medical records from repository
      const medicalRecords = await this.medicalRecordRepo.findByPetId(
        numericPetId
      );
      return medicalRecords;
    } catch (error) {
      console.error("Error in GetPetMedicalRecordsUseCase:", error);
      throw error;
    }
  }
}
