export default class ClientSerice {
  constructor(getClientUseCase, editClientUseCase, getClientOnlyUseCase) {
    this.getClientUseCase = getClientUseCase;
    this.editClientUseCase = editClientUseCase;
    this.getClientOnlyUseCase = getClientOnlyUseCase;
  }

  getClient(id) {
    return this.getClientUseCase.execute(id);
  }

  getClientOnly(id) {
    return this.getClientOnlyUseCase.execute(id);
  }

  editClient(clientId, updates) {
    return this.editClientUseCase.execute(clientId, updates);
  }
}
