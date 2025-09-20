export default class PetController {
  constructor(petService) {
    this.petService = petService;
  }

  async add(req, res, next) {
    try {
      const newPet = await this.petService.addPet({
        clientId: req.body.clientId,
        name: req.body.name,
        age: req.body.age,
        weight: req.body.weight,
        gender: req.body.gender.toLowerCase(), // normalize to lowercase
        birthday: req.body.birthday,
        species: req.body.species,
        breed: req.body.breed,
      });
      res.status(201).json(newPet);
    } catch (error) {
      next(error);
    }
  }

  async getAllPets(req, res, next) {
    try {
      const { clientId } = req.params;

      const allPets = await this.petService.getPet(clientId);
      res.status(200).json(allPets);
    } catch (err) {
      next(err);
    }
  }

  async editPet(req, res) {
    try {
      const { petId } = req.params;
      const updated = req.body;
      const editedPet = await this.petService.editPet(petId, updated);
      res.status(200).json({
        success: true,
        message: "Edited Pet",
        data: editedPet,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
  async getPetMedicalRecords(req, res) {
    try {
      const { petId } = req.params;
      const petRecords = await this.petService.getPetMedicalRecords(petId);
      res.status(200).json({
        success: true,
        message: "Pet medical records",
        data: petRecords,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getPetById(req, res, next) {
    try {
      const { petId } = req.params;

      const pet = await this.petService.getPetById(petId);
      res.status(200).json(pet);
    } catch (err) {
      next(err);
    }
  }
}
