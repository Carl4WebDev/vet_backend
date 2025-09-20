// domain/builders/ClinicBuilder.js
import Clinic from "../Entities/Clinic.js";

export default class ClinicBuilder {
  constructor() {
    this.data = {};
  }

  setId(id) {
    this.data.id = id;
    return this;
  }

  setName(name) {
    this.data.name = name;
    return this;
  }

  setPhoneNumber(phoneNumber) {
    this.data.phoneNumber = phoneNumber;
    return this;
  }

  setIsActive(isActive) {
    this.data.isActive = isActive;
    return this;
  }

  setAddress(address) {
    this.data.address = address; // Address entity
    return this;
  }

  setOwner(owner) {
    this.data.owner = owner; // User entity
    return this;
  }

  setCreatedAt(createdAt) {
    this.data.createdAt = createdAt;
    return this;
  }

  build() {
    if (!this.data.name || !this.data.owner) {
      throw new Error("Clinic must have a name and an owner");
    }
    return new Clinic(this.data);
  }
}
