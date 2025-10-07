// application/auth/use-cases/LoginUserUseCase.js
export default class LoginClinicUseCase {
  constructor(clinicRepository, tokenService, passwordHasher) {
    this.clinicRepository = clinicRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, password }) {
    const clinic = await this.clinicRepository.findByEmail(email);
    if (!clinic) throw new Error("Invalid credentials");

    const isValidPassword = await this.passwordHasher.compare(
      password,
      clinic.password
    );
    if (!isValidPassword) throw new Error("Invalid credentials");
    console.log("from login usecase");
    const { password: _, ...safeUser } = clinic;
    const token = this.tokenService.generate({
      id: clinic.id,
      role: clinic.role,
    });

    return { ...safeUser, token };
  }
}
