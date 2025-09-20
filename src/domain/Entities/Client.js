export default class Client {
  constructor({
    clientId,
    name,
    phone = null,
    telNum = null,
    gender = null,
    address = null,
    clinic = null,
    pets = [],
  }) {
    if (!clientId) throw new Error("ClientId is required");
    if (!name) throw new Error("Name is required");

    this.clientId = clientId;
    this.name = name;
    this.phone = phone;
    this.telNum = telNum;
    this.gender = gender;
    this.address = address; // Address entity or null
    this.clinic = clinic; // Clinic entity or null
    this.pets = pets; // Array of Pet entities (can be empty)
  }

  // Optionally, you can add methods here (e.g., getFullName, addPet, etc.)
}
