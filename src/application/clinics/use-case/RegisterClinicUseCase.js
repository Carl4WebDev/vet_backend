// application/auth/use-cases/RegisterClinicUseCase.js
export default class RegisterClinicUseCase {
  constructor(clinicRepository, tokenService, passwordHasher) {
    this.clinicRepository = clinicRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute(clinicData, role) {
    // 1️⃣ Check if email already exists
    const existingUser = await this.clinicRepository.findByEmail(
      clinicData.email
    );
    if (existingUser) throw new Error("Email already in use");

    // 2️⃣ Hash password
    clinicData.password = await this.passwordHasher.hash(clinicData.password);

    // 3️⃣ ✅ Use the correct key (userData)
    const user = await this.clinicRepository.create({
      userData: clinicData,
      role,
    });

    // 4️⃣ Generate token
    const { password, ...safeUser } = user;
    const token = this.tokenService.generate({
      id: user.user_id,
      role: user.role,
    });

    return { ...safeUser, token };
  }
}
