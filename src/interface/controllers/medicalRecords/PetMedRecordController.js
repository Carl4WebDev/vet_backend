export default class PetMedRecordController {
  constructor(getPetMedicalRecordsUseCase, createPetMedicalRecordUseCase) {
    this.getPetMedicalRecordsUseCase = getPetMedicalRecordsUseCase;
    this.createPetMedicalRecordUseCase = createPetMedicalRecordUseCase;
  }

  async getPetMedRecords(req, res) {
    try {
      const { petId } = req.params;
      const petMedRecords = await this.getPetMedicalRecordsUseCase.execute(
        petId
      );
      res.status(200).json({
        success: true,
        message: "Pet medical records",
        data: petMedRecords,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async createMedicalRecord(req, res) {
    try {
      const { petId } = req.params;
      const data = req.body;

      const result = await this.createPetMedicalRecordUseCase.execute(
        petId,
        data
      );

      res.status(201).json({
        success: true,
        message: "Medical record created successfully",
        data: result,
      });
    } catch (err) {
      console.error("❌ Error in createMedicalRecord:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
