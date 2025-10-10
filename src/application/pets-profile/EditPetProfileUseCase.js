// ✅ USE CASE — Directly talks to Repo layer

export default class EditPetProfileUseCase {
  constructor(petRepo) {
    this.petRepo = petRepo;
  }

  /**
   * Executes the pet profile update and optional image upload.
   * @param {object} params
   * @param {number} params.petId
   * @param {object} params.petData
   * @param {object|null} params.file - multer file object
   */
  async execute({ petId, petData, file }) {
    return await this.petRepo.updatePetAndImage(petId, petData, file);
  }
}
