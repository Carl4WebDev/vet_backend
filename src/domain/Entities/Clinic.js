// src/domain/entities/Clinic.js
export default class Clinic {
  constructor({
    id = null, // clinic_id in DB
    name,
    phoneNumber = null,
    isActive = true,
    address = null, // Address entity object
    owner = null, // User entity object
    createdAt = null,
  }) {
    this.id = id;
    this.name = name;
    this.phoneNumber = phoneNumber;
    this.isActive = isActive;
    this.address = address;
    this.owner = owner; // full User object or null
    this.createdAt = createdAt;
  }
}
