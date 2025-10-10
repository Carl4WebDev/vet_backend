export default class PetProfileController {
  constructor({ editPetProfileUseCase }) {
    this.editPetProfileUseCase = editPetProfileUseCase;
    this.updatePetProfile = this.updatePetProfile.bind(this);
  }

  /**
   * PUT /pets/:petId/profile (multipart/form-data)
   */
  async updatePetProfile(req, res) {
    try {
      const petId = Number(req.params.petId);
      if (!petId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid pet ID." });
      }

      const { name, age, weight, gender, birthday, species, breed, bio } =
        req.body;

      const petData = {
        name,
        age: age ? Number(age) : undefined,
        weight: weight ? Number(weight) : undefined,
        gender,
        birthday,
        species,
        breed,
        bio,
      };

      const result = await this.editPetProfileUseCase.execute({
        petId,
        petData,
        file: req.file || null,
      });

      return res.json({
        success: true,
        message: "Pet profile updated successfully.",
        data: result,
      });
    } catch (err) {
      console.error("updatePetProfile error:", err);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Server error" });
    }
  }
}
