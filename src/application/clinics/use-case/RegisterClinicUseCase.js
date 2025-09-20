// application/auth/use-cases/RegisterUserUseCase.js
export default class RegisterClinicUseCase {
  constructor(clinicRepository, tokenService, passwordHasher) {
    this.clinicRepository = clinicRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute(clinicData, role) {
    const existingUser = await this.clinicRepository.findByEmail(
      clinicData.email
    );
    if (existingUser) throw new Error("Email already in use");

    clinicData.password = await this.passwordHasher.hash(clinicData.password);
    const user = await this.clinicRepository.create({ clinicData, role });

    const { password, ...safeUser } = user;
    const token = this.tokenService.generate({ id: user.id, role: user.role });

    return { ...safeUser, token };
  }
}
