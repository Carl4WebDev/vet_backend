export default class PetMedRecordController {
  constructor(getPetMedicalRecordsUseCase) {
    this.getPetMedicalRecordsUseCase = getPetMedicalRecordsUseCase;
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
}
