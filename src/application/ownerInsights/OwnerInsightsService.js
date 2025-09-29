// src/application/owners/OwnerInsightsService.js
export default class OwnerInsightsService {
  constructor(ownerInsightsRepo) {
    this.ownerInsightsRepo = ownerInsightsRepo;
  }

  async getOwnerStats(clientId) {
    return await this.ownerInsightsRepo.getOwnerStats(clientId);
  }
}
