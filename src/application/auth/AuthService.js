// application/auth/AuthService.js
export default class AuthService {
  constructor(registerUserUseCase, loginUserUseCase, logoutUserUseCase) {
    this.registerUserUseCase = registerUserUseCase;
    this.loginUserUseCase = loginUserUseCase;
    this.logoutUserUseCase = logoutUserUseCase;
  }

  register(userData, role) {
    return this.registerUserUseCase.execute(userData, role);
  }

  login(credentials) {
    return this.loginUserUseCase.execute(credentials);
  }

  logout(user) {
    return this.logoutUserUseCase.execute(user);
  }
}
