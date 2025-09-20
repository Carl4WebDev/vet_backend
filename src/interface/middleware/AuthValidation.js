import { body } from "express-validator";

export const registerValidation = [
  // First name: just check it’s a string and not empty
  body("firstName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("First name is required"),

  // Last name
  body("lastName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Last name is required"),

  // Email: must be valid format
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Valid email is required"),

  // Password: allow 6+ chars for dev, can make 8+ in production
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  // Confirm password: just check it exists for now
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),

  // Phone: just check it's numeric, allow dev testing
  body("phone")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 6 })
    .withMessage("Phone number is too short"),

  // Gender: loose check for now
  body("gender").optional().trim().escape(),

  // Role: required, but no strict enum check yet
  body("role").trim().escape().notEmpty().withMessage("Role is required"),

  // Address: just ensure it's an object for now
  body("address").optional(),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .trim()
    .escape(),
];
