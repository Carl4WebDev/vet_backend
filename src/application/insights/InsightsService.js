// src/application/insights/InsightsService.js
export default class InsightsService {
  constructor(insightsRepo) {
    this.insightsRepo = insightsRepo;
  }

  async getPetTypeDistribution(clinicId) {
    return await this.insightsRepo.getPetTypeDistribution(clinicId);
  }

  async getVisitPurposeDistribution(clinicId) {
    return await this.insightsRepo.getVisitPurposeDistribution(clinicId);
  }

  async getStats(clinicId) {
    return await this.insightsRepo.getStats(clinicId);
  }
  async getAttendanceStats(clinicId) {
    return await this.insightsRepo.getAttendanceStats(clinicId);
  }
}
