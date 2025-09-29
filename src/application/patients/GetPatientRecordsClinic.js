export default class GetPatientRecordsClinic {
  constructor(patientsRepo) {
    this.patientsRepo = patientsRepo;
  }
  async execute(clinicId) {
    return this.patientsRepo.getPatients(clinicId);
  }
}
