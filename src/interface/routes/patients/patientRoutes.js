// src/interface/routes/ownerInsightsRoutes.js
import { Router } from "express";

export default function patientRoutes(patientController) {
  const router = Router();

  router.get(
    "/patient-clinic/:clinicId",
    patientController.getPatient.bind(patientController)
  );

  return router;
}
