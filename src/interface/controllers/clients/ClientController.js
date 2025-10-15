export default class GetClientController {
  constructor(clientService) {
    this.clientService = clientService;
  }

  async getClientMethod(req, res, next) {
    try {
      const { id } = req.params; // get id from URL

      const client = await this.clientService.getClient(id);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
  async getClient(req, res, next) {
    try {
      const { userId } = req.params; // get id from URL

      const client = await this.clientService.getClientOnly(userId);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
  async editClient(req, res) {
    try {
      const { id: clientId } = req.params; // ✅ fix param name
      const {
        client_name,
        phone,
        tel_num,
        gender,
        bio,
        street,
        city,
        province,
        postal_code,
      } = req.body;

      // 🖼️ handle uploaded files
      const mainImage = req.files?.main_image?.[0] || null;
      const backgroundImage = req.files?.background_image?.[0] || null;

      const updates = {
        client_name,
        phone,
        tel_num,
        gender,
        bio,
        street,
        city,
        province,
        postal_code,
        mainImage,
        backgroundImage,
      };

      const editedClient = await this.clientService.editClient(
        clientId,
        updates
      );

      res.status(200).json({
        success: true,
        message: "Edited client",
        data: editedClient,
      });
    } catch (err) {
      console.error("❌ Controller error:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  getClientsByClinic = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const clients = await this.clientService.getClientByClinic(clinicId);

      res.json({ success: true, data: clients });
    } catch (error) {
      console.error("Error getting clients by clinic:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to get clients" });
    }
  };
}
