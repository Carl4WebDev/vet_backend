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
      const { clientId } = req.params;
      const updates = req.body;
      console.log(updates);
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
