// src/domain/repositories/ClinicRepository.js
export default class IClinicRepository {
  // returns array of clinics (optionally with address)
  async findAll() {
    throw new Error("Method not implemented.");
  }
  async findByEmail() {
    throw new Error("Method not implemented d");
  }

  // create clinic with ownerId and clinicData, returns created clinic row
  async createClinic({ clinicData, ownerId }) {
    throw new Error("Method not implemented.");
  }

  // optional: find clinic by id
  async findById(clinicId) {
    throw new Error("Method not implemented.");
  }
  async getAllClinics() {
    throw new Error("Method not implemented");
  }
}
