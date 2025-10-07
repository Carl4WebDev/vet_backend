// src/application/auth/use-cases/ChangePasswordClinicUseCase.js
export default class ChangePasswordClinicUseCase {
  constructor(clinicRepository, passwordHasher) {
    this.clinicRepository = clinicRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(clinicId, oldPassword, newPassword) {
    // 1️⃣ Get clinic by ID
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) throw new Error("Clinic not found");

    // 2️⃣ Check old password
    const isValid = await this.passwordHasher.compare(
      oldPassword,
      clinic.password
    );
    if (!isValid) throw new Error("Old password is incorrect");

    // 3️⃣ Hash and update new password
    const hashedNew = await this.passwordHasher.hash(newPassword);
    await this.clinicRepository.updatePassword(clinicId, hashedNew);
  }
}
