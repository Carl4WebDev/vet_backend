import { Router } from "express";

export default function staffRoutes(staffController) {
  const router = Router();

  // 🟢 Add new staff
  router.post("/add-staff", (req, res, next) =>
    staffController.addStaff(req, res, next)
  );

  // 🟡 Get all staff by clinic ID
  router.get(
    "/get-staff/:clinicId",
    staffController.getClinicStaff.bind(staffController)
  );

  // 🟠 Edit staff by staff ID
  router.put(
    "/edit-staff/:staffId",
    staffController.editStaff.bind(staffController)
  );

  // 🔴 Delete staff by staff ID
  router.delete(
    "/delete-staff/:staffId",
    staffController.deleteStaff.bind(staffController)
  );

  return router;
}
