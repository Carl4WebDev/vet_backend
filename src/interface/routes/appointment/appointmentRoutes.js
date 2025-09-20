// infrastructure/web/routes.js

import { Router } from "express";

export default function appointmentRoutes(appointmentController) {
  const router = Router();
  router.post("/", appointmentController.createAppointment);

  // put static routes before dynamic routes
  router.get("/available-slots", (req, res) =>
    appointmentController.getAvailableSlots(req, res)
  );
  router.get("/:vetId", appointmentController.getAppointments);

  router.put(
    "/cancel/:appointmentId",
    appointmentController.cancelAppointment.bind(appointmentController)
  );

  router.get("/client/:clientId", appointmentController.getAppointmentOfClient);

  router.get(
    "/appointment/:appointmentId",
    appointmentController.getAppointmentById.bind(appointmentController)
  );

  router.put(
    "/reschedule/:appointmentId",
    appointmentController.reschedule.bind(appointmentController)
  );

  return router;
}
