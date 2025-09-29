import express from "express";
const router = express.Router();

export default function (ownerController) {
  router.get("/pet-owners/:clinicId", ownerController.getClinicPetOwners);
  return router;
}
