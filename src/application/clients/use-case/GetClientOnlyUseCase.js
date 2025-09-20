export default class GetClientUseCase {
  constructor(clientRepo) {
    this.clientRepo = clientRepo;
  }

  async execute(userId) {
    return await this.clientRepo.getClientOnly(userId);
  }
}
