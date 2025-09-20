export default class GetClientUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(userId) {
    return await this.clientRepository.getClient(userId);
  }
}
