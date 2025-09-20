import { Router } from "express";
import {
  registerValidation,
  loginValidation,
} from "../../middleware/AuthValidation.js";
import { validateRequest } from "../../middleware/ValidateRequest.js";

export default function clinicAuthRoutes(clinicController) {
  const router = Router();

  router.post("/register", registerValidation, validateRequest, (req, res) =>
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

  return router;
}
