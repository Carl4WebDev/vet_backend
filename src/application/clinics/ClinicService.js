// src/application/clinics/ClinicService.js
export default class ClinicService {
  constructor(
    registerClinicUseCase,
    loginClinicUseCase,
    logoutUserUseCase,
    getClinicsUseCase,
    getClinicByIdUseCase,
    getAllVeterinariansUseCase
  ) {
    this.registerClinicUseCase = registerClinicUseCase;
    this.loginClinicUseCase = loginClinicUseCase;
    this.logoutUserUseCase = logoutUserUseCase;
    this.getClinicsUseCase = getClinicsUseCase;
    this.getClinicByIdUseCase = getClinicByIdUseCase;
    this.getAllVeterinariansUseCase = getAllVeterinariansUseCase;
  }

  register(clinicData, role) {
    return this.registerClinicUseCase.execute(clinicData, role);
  }

  login(credentials) {
    return this.loginClinicUseCase.execute(credentials);
  }

  logout(clinic) {
    return this.loginClinicUseCase.execute(clinic);
  }
  getClinics() {
    return this.getClinicsUseCase.execute();
  }
  getClinicById(clinicId) {
    return this.getClinicByIdUseCase.execute(clinicId);
  }
  getAllVeterinarians(clinicId) {
    return this.getAllVeterinariansUseCase.execute(clinicId);
  }
}
