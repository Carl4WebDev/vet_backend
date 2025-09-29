export default class DeleteStaffUseCase {
  constructor(staffRepo) {
    this.staffRepo = staffRepo;
  }

  async execute(staffId) {
    return await this.staffRepo.deleteStaff(staffId);
  }
}
