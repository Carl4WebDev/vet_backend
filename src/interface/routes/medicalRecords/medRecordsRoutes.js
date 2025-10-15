import { Router } from "express";
import PetMedRecordController from "../../controllers/medicalRecords/PetMedRecordController.js";

export default function medRecordsRoutes(petMedRecordController) {
  const router = Router();

  router.get(
    "/get-pet-records/:petId",
    petMedRecordController.getPetMedRecords.bind(petMedRecordController)
  );

  // ✅ Updated: add upload middleware before controller
  router.post(
    "/add-medical-record/:petId",
    PetMedRecordController.uploadMiddleware, // <-- parses FormData + files
    petMedRecordController.createMedicalRecord.bind(petMedRecordController)
  );

  return router;
}
