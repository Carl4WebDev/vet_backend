// src/application/usecases/ChangeInformationClinicUseCase.js
export default class ChangeInformationClinicUseCase {
  constructor(clinicRepo) {
    this.clinicRepo = clinicRepo;
  }

  async execute({ clinicId, name, phone_number, address, imageFile }) {
    const parsedClinicId = Number(clinicId);
    if (isNaN(parsedClinicId)) {
      throw new Error(`Invalid clinicId provided: ${clinicId}`);
    }

    // 1️⃣ Update clinic core info
    await this.clinicRepo.updateClinicBasicInfo(parsedClinicId, {
      name,
      phone_number,
    });

    // 2️⃣ Update address if provided
    if (address) {
      let addressId = address.address_id;
      if (!addressId) {
        addressId = await this.clinicRepo.getClinicAddressId(parsedClinicId);
      }

      if (addressId) {
        await this.clinicRepo.updateAddress(addressId, address);
      }
    }

    // 3️⃣ Handle image upload if file is provided
    if (imageFile) {
      await this.clinicRepo.upsertClinicImage(parsedClinicId, imageFile);
    }

    return { success: true };
  }
}
