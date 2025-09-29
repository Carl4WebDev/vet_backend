export default class InsightsController {
  constructor(insightsService) {
    this.insightsService = insightsService;
  }
  getPetTypeDistribution = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.insightsService.getPetTypeDistribution(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getVisitPurposeDistribution = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.insightsService.getVisitPurposeDistribution(
        clinicId
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getStats = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.insightsService.getStats(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getAttendanceStats = async (req, res) => {
    try {
      const { clinicId } = req.params;
      const data = await this.insightsService.getAttendanceStats(clinicId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
