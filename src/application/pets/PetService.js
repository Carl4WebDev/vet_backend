export default class PetService {
  constructor(
    addPetUseCase,
    getPetUseCase,
    editPetUseCase,
    getPetMedicalRecordsUseCase,
    getPetByIdUseCase
  ) {
    this.addPetUseCase = addPetUseCase;
    this.getPetUseCase = getPetUseCase;
    this.editPetUseCase = editPetUseCase;
    this.editPetUseCase = editPetUseCase;
    this.getPetMedicalRecordsUseCase = getPetMedicalRecordsUseCase;
    this.getPetByIdUseCase = getPetByIdUseCase;
  }

  addPet(petData) {
    return this.addPetUseCase.execute(petData);
  }
  getPet(clientId) {
    return this.getPetUseCase.execute(clientId);
  }
  editPet(petId, updates) {
    return this.editPetUseCase.execute(petId, updates);
  }
  getPetById(petId) {
    return this.getPetByIdUseCase.execute(petId);
  }
  getPetMedicalRecords(petId) {
    return this.getPetMedicalRecordsUseCase.execute(petId);
  }
}
