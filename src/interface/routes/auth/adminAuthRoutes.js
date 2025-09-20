import { Router } from "express";
import {
  registerValidation,
  loginValidation,
} from "../../middleware/AuthValidation.js";
import { validateRequest } from "../../middleware/ValidateRequest.js";

export default function adminAuthRoutes(authController) {
  const router = Router();

  // Admin registration with validation
  router.post("/register", registerValidation, validateRequest, (req, res) =>
    authController.registerWithRole(req, res, "admin")
  );

  // Admin login with validation
  router.post("/login", loginValidation, validateRequest, (req, res) =>
    authController.loginWithRole(req, res, "admin")
  );

  return router;
}
