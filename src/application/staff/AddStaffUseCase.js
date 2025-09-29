export default class AddStaffUseCase {
  constructor(staffRepo) {
    this.staffRepo = staffRepo;
  }

  async execute(data) {
    return await this.staffRepo.addStaff(data);
  }
}
