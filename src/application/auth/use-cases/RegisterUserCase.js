// application/auth/use-cases/RegisterUserUseCase.js
export default class RegisterUserUseCase {
  constructor(userRepository, tokenService, passwordHasher) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute(userData, role) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) throw new Error("Email already in use");

    userData.password = await this.passwordHasher.hash(userData.password);
    const user = await this.userRepository.create({ userData, role });

    const { password, ...safeUser } = user;
    const token = this.tokenService.generate({ id: user.id, role: user.role });

    return { ...safeUser, token };
  }
}
