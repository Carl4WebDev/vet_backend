export default class GetPetByIdUseCase {
  constructor(petRepository) {
    this.petRepository = petRepository;
  }

  async execute(petId) {
    return await this.petRepository.findById(petId);
  }
}
