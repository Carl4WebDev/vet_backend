// application/auth/use-cases/LogoutUserUseCase.js
export default class LogoutUserUseCase {
  async execute(user) {
    // You could blacklist tokens here if you implement it
    return true;
  }
}
