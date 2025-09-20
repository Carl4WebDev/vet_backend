import express from "express";

export default function appointmentTypeRoutes(AppointmentTypeController) {
  const router = express.Router();

  router.get("/", (req, res) => AppointmentTypeController.getAll(req, res));

  return router;
}
