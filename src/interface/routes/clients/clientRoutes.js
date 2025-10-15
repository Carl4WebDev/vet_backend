import { Router } from "express";
import { uploadClientImage } from "../../../infrastructure/config/multer.js";

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
    "/edit-client/:id",
    uploadClientImage.fields([
      { name: "main_image", maxCount: 1 },
      { name: "background_image", maxCount: 1 },
    ]),
    clientController.editClient.bind(clientController)
  );

  return router;
}
