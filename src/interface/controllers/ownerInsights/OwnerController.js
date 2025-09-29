export default class OwnerController {
  constructor(ownerService) {
    this.ownerService = ownerService;
  }

  getClinicPetOwners = (req, res) =>
    this.ownerService.getClinicPetOwners(req, res);
}
