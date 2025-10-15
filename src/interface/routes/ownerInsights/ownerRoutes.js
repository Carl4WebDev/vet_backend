import express from "express";
const router = express.Router();

export default function (ownerController) {
  // // 🧠 Put static route first!
  // router.get("/pet-owners/all-pet-owners", ownerController.getAllPetOwners);

  // 🏥 Then dynamic route for specific clinic
  router.get("/pet-owners/:clinicId", ownerController.getClinicPetOwners);

  return router;
}
