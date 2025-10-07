import { Router } from "express";

export default function medRecordsRoutes(petMedRecordController) {
  const router = Router();

  router.get(
    "/get-pet-records/:petId",
    petMedRecordController.getPetMedRecords.bind(petMedRecordController)
  );

  router.post(
    "/add-medical-record/:petId",
    petMedRecordController.createMedicalRecord.bind(petMedRecordController)
  );
  return router;
}
