import Pet from "../Entities/Pet.js";

export default class PetBuilder {
  constructor() {
    this.data = {};
  }

  setPetId(petId) {
    this.data.petId = petId;
    return this;
  }

  setClientId(clientId) {
    this.data.clientId = clientId;
    return this;
  }

  setName(name) {
    this.data.name = name;
    return this;
  }

  setAge(age) {
    if (age < 0) throw new Error("Age must be >= 0");
    this.data.age = age;
    return this;
  }

  setWeight(weight) {
    if (weight < 0) throw new Error("Weight must be >= 0");
    this.data.weight = weight;
    return this;
  }

  setGender(gender) {
    if (gender && !["male", "female"].includes(gender)) {
      throw new Error("Gender must be 'male' or 'female'");
    }
    this.data.gender = gender;
    return this;
  }

  setBirthday(birthday) {
    this.data.birthday = birthday;
    return this;
  }

  setSpecies(species) {
    this.data.species = species;
    return this;
  }

  setBreed(breed) {
    this.data.breed = breed;
    return this;
  }

  // 🖼️ Added for pet image
  setImageUrl(imageUrl) {
    this.data.imageUrl = imageUrl;
    return this;
  }

  build() {
    return new Pet(this.data);
  }
}
