import Client from "../Entities/Client.js";

export default class ClientBuilder {
  constructor() {
    this.data = {};
  }

  setClientId(clientId) {
    this.data.clientId = clientId;
    return this;
  }

  setName(name) {
    this.data.name = name;
    return this;
  }

  setPhone(phone) {
    this.data.phone = phone;
    return this;
  }

  setTelNum(telNum) {
    this.data.telNum = telNum;
    return this;
  }

  setGender(gender) {
    this.data.gender = gender;
    return this;
  }

  setAddress(address) {
    this.data.address = address; // Expects Address entity
    return this;
  }

  setClinic(clinic) {
    this.data.clinic = clinic; // Expects Clinic entity or null
    return this;
  }

  setPets(pets) {
    this.data.pets = pets; // Expects array of Pet entities
    return this;
  }

  // 🖼️ Added for client image
  setImageUrl(imageUrl) {
    this.data.imageUrl = imageUrl;
    return this;
  }

  build() {
    if (!this.data.clientId || !this.data.name) {
      throw new Error("Missing required fields: clientId or name");
    }
    return new Client(this.data);
  }
}
