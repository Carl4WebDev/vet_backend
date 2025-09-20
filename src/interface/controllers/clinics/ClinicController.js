// src/interface/controllers/ClinicController.js

import AddressBuilder from "../../../domain/Builders/AddressBuilder.js";
import ClinicBuilder from "../../../domain/Builders/ClinicBuilder.js";

export default class ClinicController {
  constructor(clinicService) {
    this.clinicService = clinicService;
  }

  // GET /clinics (public)
  logout = async (req, res) => {
    try {
      await this.clinicService.logout(req.user);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message || "Logout failed" });
    }
  };

  // POST /auth/clinic/login
  loginWithRole = async (req, res, expectedRole) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const clinicData = await this.clinicService.login({ email, password });

      if (!clinicData) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (clinicData.role !== expectedRole) {
        return res.status(403).json({
          message: `Access denied for ${clinicData.role} on ${expectedRole} portal`,
        });
      }

      res.status(200).json(clinicData);
    } catch (error) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  };

  // POST /auth/clinic/register
  registerWithRole = async (req, res, expectedRole) => {
    try {
      if (!req.body.address) {
        return res
          .status(400)
          .json({ message: "Address information is required" });
      }

      const address = new AddressBuilder()
        .setCountry(req.body.address.country)
        .setStreet(req.body.address.street)
        .setCity(req.body.address.city)
        .setProvince(req.body.address.province)
        .setPostalCode(req.body.address.postalCode)
        .setBarangay(req.body.address.barangay)
        .setUnit(req.body.address.unit)
        .build();

      const clinicData = new ClinicBuilder()
        .setName(req.body.clinicName)
        .setPhoneNumber(req.body.phoneNumber)
        .setIsActive(req.body.isActive)
        .setAddress(address)
        .setOwner(req.body.owner)
        .setTelephone(req.body.telephone)
        .build();

      const result = await this.clinicService.register(
        clinicData,
        expectedRole
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message || "Registration failed" });
    }
  };

  async getAll(req, res, next) {
    try {
      const clinics = await this.clinicService.getClinics();
      res.json(clinics);
    } catch (err) {
      next(err);
    }
  }

  async getClinicById(req, res) {
    try {
      const { clinicId } = req.params;
      const clinic = await this.clinicService.getClinicById(clinicId);

      res.status(200).json({
        success: true,
        message: "Successfully retreived clinic",
        data: clinic,
      });
    } catch (err) {
      res.status(500).json({
        success: true,
        message: err.message,
      });
    }
  }
}
