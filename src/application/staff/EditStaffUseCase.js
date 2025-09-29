export default class EditStaffUseCase {
  constructor(staffRepo) {
    this.staffRepo = staffRepo;
  }

  async execute(staffId, data) {
    return await this.staffRepo.editStaff(staffId, data);
  }
}
