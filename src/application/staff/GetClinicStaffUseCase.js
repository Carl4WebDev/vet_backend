export default class GetClinicStaffUseCase {
  constructor(staffRepo) {
    this.staffRepo = staffRepo;
  }

  async execute(clinicId) {
    const [staff, veterinarians, counts] = await Promise.all([
      this.staffRepo.getClinicStaff(clinicId),
      this.staffRepo.getClinicVeterinarians(clinicId),
      this.staffRepo.getClinicStaffCounts(clinicId),
    ]);

    return {
      list: [...staff, ...veterinarians],
      counts, // contains total_staff, veterinarian_count, technician_count, support_staff_count
    };
  }
}
