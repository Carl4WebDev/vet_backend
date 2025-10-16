export default class GetClinicStaffUseCase {
  constructor(staffRepo) {
    this.staffRepo = staffRepo;
  }

  async execute(clinicId) {
    const [staff, counts] = await Promise.all([
      this.staffRepo.getClinicStaff(clinicId),
      this.staffRepo.getClinicStaffCounts(clinicId),
    ]);

    return {
      list: staff,
      counts, // contains total_staff, technician_count, support_staff_count
    };
  }
}
