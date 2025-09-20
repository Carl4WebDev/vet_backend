// domain/builders/UserBuilder.js
import User from "../Entities/User.js";

export default class UserBuilder {
  constructor() {
    this.data = {};
  }

  setId(id) {
    this.data.id = id;
    return this;
  }

  setEmail(email) {
    this.data.email = email;
    return this;
  }

  setPassword(password) {
    this.data.password = password;
    return this;
  }

  setRole(role) {
    this.data.role = role;
    return this;
  }

  setFirstName(firstName) {
    this.data.firstName = firstName;
    return this;
  }

  setLastName(lastName) {
    this.data.lastName = lastName;
    return this;
  }

  setPhone(phone) {
    this.data.phone = phone;
    return this;
  }

  setTelephone(telephone) {
    this.data.telephone = telephone;
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

  build() {
    // 🔍 Minimal validation
    if (!this.data.email || !this.data.password || !this.data.role) {
      throw new Error("Missing required fields: email, password, or role");
    }
    return new User(this.data);
  }
}
