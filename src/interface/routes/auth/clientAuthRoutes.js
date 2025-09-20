import { Router } from "express";
import {
  registerValidation,
  loginValidation,
} from "../../middleware/AuthValidation.js";
import { validateRequest } from "../../middleware/ValidateRequest.js";

export default function clientAuthRoutes(authController) {
  const router = Router();

  router.post("/register", registerValidation, validateRequest, (req, res) =>
    authController.registerWithRole(req, res, "client")
  );

  router.post("/login", loginValidation, validateRequest, (req, res) =>
    authController.loginWithRole(req, res, "client")
  );

  return router;
}
