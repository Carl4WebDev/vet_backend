import { Router } from "express";

export default function medRecordsRoutes(petMedRecordController) {
  const router = Router();

  router.get(
    "/get-pet-records/:petId",
    petMedRecordController.getPetMedRecords.bind(petMedRecordController)
  );

  return router;
}
