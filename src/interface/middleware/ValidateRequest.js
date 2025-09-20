import { validationResult } from "express-validator";

// Middleware to handle validation errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next(); // ✅ Continue if no errors
};
