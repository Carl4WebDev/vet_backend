export default class ClientSerice {
  constructor(
    getClientUseCase,
    editClientUseCase,
    getClientOnlyUseCase,
    getClientByClinicUseCase
  ) {
    this.getClientUseCase = getClientUseCase;
    this.editClientUseCase = editClientUseCase;
    this.getClientOnlyUseCase = getClientOnlyUseCase;
    this.getClientByClinicUseCase = getClientByClinicUseCase;
  }

  getClient(id) {
    return this.getClientUseCase.execute(id);
  }

  getClientByClinic(clinicId) {
    return this.getClientByClinicUseCase.execute(clinicId);
  }

  getClientOnly(id) {
    return this.getClientOnlyUseCase.execute(id);
  }

  editClient(clientId, updates) {
    return this.editClientUseCase.execute(clientId, updates);
  }
}
