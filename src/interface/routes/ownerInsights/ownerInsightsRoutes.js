// src/interface/routes/ownerInsightsRoutes.js
import { Router } from "express";

export default function ownerInsightsRoutes(ownerInsightsController) {
  const router = Router();

  router.get(
    "/owner-stats/:clientId",
    ownerInsightsController.getOwnerStats.bind(ownerInsightsController)
  );

  return router;
}
