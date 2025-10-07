export default class RegisterClinicUseCase {
  constructor(
    clinicRepository,
    tokenService,
    passwordHasher,
    subscriptionRepository
  ) {
    this.clinicRepository = clinicRepository;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
    this.subscriptionRepository = subscriptionRepository;
  }

  async execute(clinicData, role) {
    console.log("📌 RegisterClinicUseCase triggered");

    // 1️⃣ Check if email already exists
    const existingUser = await this.clinicRepository.findByEmail(
      clinicData.email
    );
    if (existingUser) throw new Error("Email already in use");

    // 2️⃣ Hash password
    clinicData.password = await this.passwordHasher.hash(clinicData.password);

    // 3️⃣ Create user & clinic
    const user = await this.clinicRepository.create({
      userData: clinicData,
      role,
    });

    // 4️⃣ 🎁 Assign 3-month free trial subscription
    const subscription = await this.subscriptionRepository.createFreeTrial(
      user.user_id
    );

    // 5️⃣ Generate token
    const { password, ...safeUser } = user;
    const token = this.tokenService.generate({
      id: user.user_id,
      role: user.role,
    });

    return { ...safeUser, token, subscription };
  }
}
