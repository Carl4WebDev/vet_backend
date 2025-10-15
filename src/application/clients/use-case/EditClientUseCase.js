export default class EditClientUseCase {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  async execute(clientId, updates) {
    if (!clientId) throw new Error("Client ID is required");

    const numericClientId = parseInt(clientId);
    if (isNaN(numericClientId))
      throw new Error("Client ID must be a valid number");

    if (!updates || Object.keys(updates).length === 0)
      throw new Error("At least one update field is required");

    // Delegate full logic to repo
    const updatedClient = await this.userRepo.updateClientWithAddressAndImages(
      numericClientId,
      updates
    );

    if (!updatedClient) throw new Error("Client not found");

    return updatedClient;
  }
}
