import { Router } from "express";

export default function petRoutes(petController) {
  const router = Router();

  router.post("/add-pet", (req, res, next) =>
    petController.add(req, res, next)
  );

  router.get(
    "/get-pet/:clientId",
    petController.getAllPets.bind(petController)
  );

  router.get(
    "/get-pet-records/:petId",
    petController.getPetMedicalRecords.bind(petController)
  );

  router.put("/edit-pet/:petId", petController.editPet.bind(petController));

  router.get("/pet/:petId", petController.getPetById.bind(petController));

  return router;
}
