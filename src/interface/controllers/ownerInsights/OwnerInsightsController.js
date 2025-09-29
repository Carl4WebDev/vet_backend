// src/interface/controllers/OwnerInsightsController.js
export default class OwnerInsightsController {
  constructor(ownerInsightsService) {
    this.ownerInsightsService = ownerInsightsService;
  }

  getOwnerStats = async (req, res) => {
    try {
      const { clientId } = req.params;
      const data = await this.ownerInsightsService.getOwnerStats(clientId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
