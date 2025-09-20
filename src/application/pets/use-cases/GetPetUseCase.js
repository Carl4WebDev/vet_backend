export default class GetPetUseCase {
  constructor(petRepository) {
    this.petRepository = petRepository;
  }

  async execute(clientId) {
    return await this.petRepository.getAllPets(clientId);
  }
}
