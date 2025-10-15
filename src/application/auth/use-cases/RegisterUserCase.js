// application/auth/use-cases/RegisterUserUseCase.js
export default class RegisterUserUseCase {
  constructor(userRepository, tokenService, passwordHasher) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  async execute(userData, role) {
    // 1️⃣ Check for duplicate email
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) throw new Error("Email already in use");

    // 2️⃣ Hash password before saving
    userData.password = await this.passwordHasher.hash(userData.password);

    // 3️⃣ Create user + client/clinic entry
    const { user, client, clinic } = await this.userRepository.create({
      userData,
      role,
    });

    // 4️⃣ Generate JWT
    const token = this.tokenService.generate({ id: user.user_id, role });

    // 5️⃣ Build response based on role
    if (role === "client") {
      return {
        token,
        role,
        user_id: user.user_id, // from Users table
        client_id: client.client_id, // from Clients table
        client_name: client.client_name,
      };
    }

    if (role === "clinic_owner") {
      return {
        token,
        role,
        user_id: user.user_id,
        clinic_id: clinic?.clinic_id || null,
        clinic_name:
          clinic?.clinic_name ||
          `${userData.firstName} ${userData.lastName} Clinic`,
      };
    }

    // Default fallback (if ever new roles are added)
    return {
      token,
      role,
      user_id: user.user_id,
    };
  }
}
