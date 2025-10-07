import { Router } from "express";
import {
  registerValidation,
  loginValidation,
} from "../../middleware/AuthValidation.js";
import { validateRequest } from "../../middleware/ValidateRequest.js";

import { uploadClinicImage } from "../../../infrastructure/config/multer.js";

export default function clinicAuthRoutes(clinicController) {
  const router = Router();

  router.post("/register", validateRequest, (req, res) =>
    clinicController.registerWithRole(req, res, "clinic_owner")
  );
  router.post("/login", loginValidation, validateRequest, (req, res) =>
    clinicController.loginWithRole(req, res, "clinic_owner")
  );

  router.get("/get-clinics", (req, res, next) =>
    clinicController.getAll(req, res, next)
  );

  router.get(
    "/get-clinic/:clinicId",
    clinicController.getClinicById.bind(clinicController)
  );

  router.get(
    "/all-vet/:clinicId",
    clinicController.getAllVeterinarians.bind(clinicController)
  );

  router.put(
    "/change-password/:clinicId",
    clinicController.changePasswordClinic.bind(clinicController)
  );

  router.put(
    "/change-info/:clinicId",
    uploadClinicImage.single("image"), // "image" must match frontend form field
    clinicController.changeInfoClinic.bind(clinicController)
  );

  router.get(
    "/details/:clinicId",
    clinicController.getClinicDetails.bind(clinicController)
  );

  return router;
}
