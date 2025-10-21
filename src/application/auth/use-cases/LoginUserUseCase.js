// application/auth/use-cases/LoginUserUseCase.js
export default class LoginUserUseCase {
  constructor(userRepository, tokenService, passwordHasher) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    // ✅ Step 2: check if user is banned
    if (user.is_banned === true) {
      throw new Error(
        "Can't login because your account is banned by the admin."
      );
    }
    if (!user) throw new Error("Invalid credentials");

    const isValidPassword = await this.passwordHasher.compare(
      password,
      user.password
    );
    if (!isValidPassword)
      throw new Error("Invalid credentials — Try 'Forgot Password'?");

    const { password: _, ...safeUser } = user;
    const token = this.tokenService.generate({ id: user.id, role: user.role });

    return { ...safeUser, token };
  }
}
