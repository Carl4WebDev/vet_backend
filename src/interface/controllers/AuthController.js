import UserBuilder from "../../domain/Builders/UserBuilder.js";
import AddressBuilder from "../../domain/Builders/AddressBuilder.js";

export default class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  logout = async (req, res) => {
    try {
      await this.authService.logout(req.user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  async loginWithRole(req, res, expectedRole) {
    try {
      const { email, password } = req.body;
      const userData = await this.authService.login({ email, password });

      // ✅ Ensure user logs in to the correct portal
      if (userData.role !== expectedRole) {
        return res.status(403).json({
          message: `Access denied for ${userData.role} on ${expectedRole} portal`,
        });
      }

      res.status(200).json(userData);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  registerWithRole = async (req, res, expectedRole) => {
    try {
      const address = new AddressBuilder()
        .setCountry(req.body.address.country)
        .setStreet(req.body.address.street)
        .setCity(req.body.address.city)
        .setProvince(req.body.address.province)
        .setPostalCode(req.body.address.postalCode)
        .setBarangay(req.body.address.barangay)
        .setUnitNumber(req.body.address.Unit)
        .build();

      const userData = new UserBuilder()
        .setEmail(req.body.email)
        .setPassword(req.body.password)
        .setRole(expectedRole)
        .setFirstName(req.body.firstName)
        .setLastName(req.body.lastName)
        .setPhone(req.body.phone)
        .setGender(req.body.gender)
        .setTelephone(req.body.telephone)
        .setAddress(address)
        .build();

      const result = await this.authService.register(userData, expectedRole);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
}
