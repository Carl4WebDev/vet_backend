export default class Pet {
  constructor({
    petId = null,
    clientId,
    name,
    age = 0,
    weight = 0,
    gender,
    birthday,
    species,
    breed,
    bio,
  }) {
    // Validation for required fields
    if (!clientId) {
      throw new Error("clientId is required for a pet.");
    }
    if (!name || typeof name !== "string") {
      throw new Error("Pet name is required and must be a string.");
    }

    this.petId = petId; // int | null (if new pet)
    this.clientId = clientId; // int (FK to Clients)
    this.name = name.trim(); // string
    this.age = Number(age); // number >= 0
    this.weight = Number(weight); // number >= 0
    this.gender = gender; // "male" | "female" | null
    this.birthday = birthday ? new Date(birthday) : null; // Date | null
    this.species = species || null; // string | null
    this.breed = breed || null; // string | null
    this.bio = bio || null;
  }
}
