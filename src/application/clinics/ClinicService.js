// src/application/clinics/ClinicService.js
export default class ClinicService {
  constructor(
    registerClinicUseCase,
    loginClinicUseCase,
    logoutUserUseCase,
    getClinicsUseCase,
    getClinicByIdUseCase,
    getAllVeterinariansUseCase,
    changePasswordUseCase,
    changeInformationClinicUseCase,
    getClinicDetailsUseCase
  ) {
    this.registerClinicUseCase = registerClinicUseCase;
    this.loginClinicUseCase = loginClinicUseCase;
    this.logoutUserUseCase = logoutUserUseCase;
    this.getClinicsUseCase = getClinicsUseCase;
    this.getClinicByIdUseCase = getClinicByIdUseCase;
    this.getAllVeterinariansUseCase = getAllVeterinariansUseCase;
    this.changePasswordUseCase = changePasswordUseCase;
    this.changeInformationClinicUseCase = changeInformationClinicUseCase;
    this.getClinicDetailsUseCase = getClinicDetailsUseCase;
  }

  register(clinicData, role) {
    console.log("from reg service");
    return this.registerClinicUseCase.execute(clinicData, role);
  }

  login(credentials) {
    console.log("from log service");
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

  changePasswordClinic(clinicId, oldPassword, newPassword) {
    return this.changePasswordUseCase.execute(
      clinicId,
      oldPassword,
      newPassword
    );
  }
  changeInfoClinic({ clinicId, name, phone_number, address, imageFile }) {
    return this.changeInformationClinicUseCase.execute({
      clinicId,
      name,
      phone_number,
      address,
      imageFile,
    });
  }

  async getClinicDetails(clinicId) {
    return this.getClinicDetailsUseCase.execute(clinicId);
  }
}
