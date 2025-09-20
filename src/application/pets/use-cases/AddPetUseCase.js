export default class AddPetUseCase {
  constructor(petRepository) {
    this.petRepository = petRepository;
  }

  async execute(petData) {
    // Optional: add validation here
    if (!petData.clientId) {
      throw new Error("Client ID is required to add a pet");
    }
    return await this.petRepository.addPet(petData);
  }
}
