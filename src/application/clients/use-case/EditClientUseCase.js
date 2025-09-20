export default class EditClientUseCase {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  async execute(clientId, updates) {
    try {
      // Validation
      if (!clientId) {
        throw new Error("Client ID is required"); // ← Throw error instead of using res
      }

      const numericClientId = parseInt(clientId);
      if (isNaN(numericClientId)) {
        throw new Error("Client ID must be a valid number");
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("At least one update field is required");
      }

      // Database operation
      const updatedClient = await this.userRepo.updateClient(
        numericClientId,
        updates
      );

      if (!updatedClient) {
        throw new Error("Client not found");
      }

      return updatedClient; // ← Return the updated pet data
    } catch (error) {
      console.error("Error in EditClientUseCase:", error);
      throw error; // ← Re-throw the error for the controller to handle
    }
  }
}
