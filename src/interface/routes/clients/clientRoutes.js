import { Router } from "express";

export default function getClientRoutes(clientController) {
  const router = Router();

  router.get(
    "/get/:id",
    clientController.getClientMethod.bind(clientController)
  );
  router.get(
    "/get-client-only/:userId",
    clientController.getClient.bind(clientController)
  );
  router.get(
    "/get-client-clinic/:clinicId",
    clientController.getClientsByClinic.bind(clientController)
  );
  router.put(
    "/edit-client/:clientId",
    clientController.editClient.bind(clientController)
  );
  return router;
}
