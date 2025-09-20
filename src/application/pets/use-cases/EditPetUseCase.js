export default class EditPetUseCase {
  constructor(petRepository) {
    this.petRepository = petRepository;
  }

  async execute(petId, updates) {
    try {
      // Validation
      if (!petId) {
        throw new Error("Pet ID is required"); // ← Throw error instead of using res
      }

      const numericPetId = parseInt(petId);
      if (isNaN(numericPetId)) {
        throw new Error("Pet ID must be a valid number");
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("At least one update field is required");
      }

      // Field validation
      if (
        updates.age !== undefined &&
        (isNaN(updates.age) || updates.age < 0)
      ) {
        throw new Error("Age must be a non-negative number");
      }

      if (
        updates.weight !== undefined &&
        (isNaN(updates.weight) || updates.weight < 0)
      ) {
        throw new Error("Weight must be a non-negative number");
      }

      if (
        updates.gender !== undefined &&
        !["male", "female"].includes(updates.gender.toLowerCase())
      ) {
        throw new Error("Gender must be either male or female");
      }

      // Database operation
      const updatedPet = await this.petRepository.updatePet(
        numericPetId,
        updates
      );

      if (!updatedPet) {
        throw new Error("Pet not found");
      }

      return updatedPet; // ← Return the updated pet data
    } catch (error) {
      console.error("Error in EditPetUseCase:", error);
      throw error; // ← Re-throw the error for the controller to handle
    }
  }
}
