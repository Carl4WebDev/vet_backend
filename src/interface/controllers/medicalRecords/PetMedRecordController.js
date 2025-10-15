import multer from "multer";
import path from "path";

export default class PetMedRecordController {
  constructor(getPetMedicalRecordsUseCase, createPetMedicalRecordUseCase) {
    this.getPetMedicalRecordsUseCase = getPetMedicalRecordsUseCase;
    this.createPetMedicalRecordUseCase = createPetMedicalRecordUseCase;
  }

  // 🧠 Multer storage setup for attached medical documents
  static storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/documents"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  static uploadMiddleware = multer({
    storage: PetMedRecordController.storage,
  }).array("files", 10);

  // 🩺 Fetch medical records for a specific pet
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

  // 🧾 Create medical record (with support for attached documents)
  async createMedicalRecord(req, res) {
    try {
      const { petId } = req.params;
      const data = req.body; // Parsed by multer
      const files = req.files || [];

      console.log("📦 Received form data:", data);
      console.log("📎 Uploaded files:", files.length);

      const result = await this.createPetMedicalRecordUseCase.execute(
        petId,
        data,
        files
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
