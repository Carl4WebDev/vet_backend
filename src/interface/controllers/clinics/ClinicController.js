export default class ClinicController {
  constructor(clinicService, subscriptionRepo) {
    this.clinicService = clinicService;
    this.subscriptionRepo = subscriptionRepo;
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
      console.log("from controller log");

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
      console.log(req.body);
      console.log("from controller reg");
      if (!req.body.address) {
        return res
          .status(400)
          .json({ message: "Address information is required" });
      }

      const clinicData = {
        email: req.body.email,
        password: req.body.password,
        clinic_name: req.body.clinic_name,
        phone_number: req.body.phone_number,
        is_active: req.body.is_active ?? true,
        telephone: req.body.telephone || null,
        owner: req.body.owner || null,
        address: {
          street: req.body.address.street,
          country: req.body.address.country,
          city: req.body.address.city,
          province: req.body.address.province,
          postal_code: req.body.address.postal_code,
          barangay: req.body.address.barangay,
          unit_number: req.body.address.unit_number,
          latitude: req.body.address.latitude,
          longitude: req.body.address.longitude,
        },
      };

      const result = await this.clinicService.register(
        clinicData,
        expectedRole
      );

      res.status(201).json(result);
    } catch (err) {
      console.error(err);
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

  getAllVeterinarians = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const vets = await this.clinicService.getAllVeterinarians(clinicId);
      res.json({ success: true, data: vets });
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch veterinarians" });
    }
  };

  changePasswordClinic = async (req, res) => {
    try {
      const { clinicId } = req.params; // comes from auth middleware
      const { oldPassword, newPassword } = req.body;

      await this.clinicService.changePasswordClinic(
        clinicId,
        oldPassword,
        newPassword
      );

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  changeInfoClinic = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { name, phone_number, address } = req.body;

      let imageFile = null;
      if (req.file) {
        imageFile = {
          file_path: `/uploads/clinics/${req.file.filename}`,
          file_name: req.file.originalname,
          mime_type: req.file.mimetype,
        };
      }

      let parsedAddress = address;
      if (typeof address === "string") {
        try {
          parsedAddress = JSON.parse(address);
        } catch {
          parsedAddress = null;
        }
      }

      const result = await this.clinicService.changeInfoClinic({
        clinicId,
        // Only pass values if they actually exist
        ...(name ? { name } : {}),
        ...(phone_number ? { phone_number } : {}),
        ...(parsedAddress ? { address: parsedAddress } : {}),
        ...(imageFile ? { imageFile } : {}),
      });

      res.json({ message: "Clinic updated successfully", ...result });
    } catch (err) {
      console.error("Change info error:", err);
      res.status(400).json({ error: err.message });
    }
  };

  getClinicDetails = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const clinic = await this.clinicService.getClinicDetails(clinicId);

      res.status(200).json({
        success: true,
        message: "Successfully retrieved clinic details",
        data: clinic,
      });
    } catch (err) {
      console.error("Get clinic details error:", err);
      res.status(400).json({ error: err.message });
    }
  };
}
