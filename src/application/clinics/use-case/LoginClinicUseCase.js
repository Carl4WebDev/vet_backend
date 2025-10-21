export default class LoginClinicUseCase {
  constructor(clinicRepository, tokenService, passwordHasher) {
    this.clinicRepository = clinicRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, password }) {
    // ✅ Step 1: find user first
    const clinic = await this.clinicRepository.findByEmail(email);

    // if not found, stop early
    if (!clinic) throw new Error("Invalid credentials");

    // ✅ Step 2: check if banned
    if (clinic.is_banned === true) {
      const err = new Error(
        "Can't login because your account is banned by the admin."
      );
      err.code = "USER_BANNED"; // optional but helpful
      throw err;
    }

    // ✅ Step 3: verify password
    const isValidPassword = await this.passwordHasher.compare(
      password,
      clinic.password
    );
    if (!isValidPassword) throw new Error("Invalid credentials");

    // ✅ Step 4: generate token
    const { password: _, ...safeUser } = clinic;
    const token = this.tokenService.generate({
      id: clinic.user_id, // use user_id, not clinic.id
      role: clinic.role,
    });

    return { ...safeUser, token };
  }
}
