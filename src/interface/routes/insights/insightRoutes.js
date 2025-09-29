import { Router } from "express";

export default function insightRoutes(insightsController) {
  const router = Router();
  router.get("/pet-distribution/:clinicId", (req, res) =>
    insightsController.getPetTypeDistribution(req, res)
  );

  router.get("/visit-purpose/:clinicId", (req, res) =>
    insightsController.getVisitPurposeDistribution(req, res)
  );

  router.get("/stats/:clinicId", (req, res) =>
    insightsController.getStats(req, res)
  );

  router.get("/attendance-stats/:clinicId", (req, res) =>
    insightsController.getAttendanceStats(req, res)
  );
  return router;
}
