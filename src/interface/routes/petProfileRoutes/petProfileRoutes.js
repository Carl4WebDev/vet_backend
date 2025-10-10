import { Router } from "express";
import { uploadPetImage } from "../../../infrastructure/config/multer.js";

export default function petRoutes(petProfileController) {
  const router = Router();
  // ✅ PUT /pets/:petId/profile
  router.put(
    "/:petId/profile",
    uploadPetImage.single("image"),
    petProfileController.updatePetProfile
  );
  return router;
}
