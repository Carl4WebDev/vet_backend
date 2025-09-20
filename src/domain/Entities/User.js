// domain/entities/User.js
export default class User {
  constructor({
    id,
    email,
    password,
    role,
    firstName,
    lastName,
    phone,
    telephone,
    gender,
    address,
  }) {
    this.id = id; // PK in DB
    this.email = email;
    this.password = password; // (hashed in app layer, not here)
    this.role = role; // client | clinic_owner | admin
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.telephone = telephone;
    this.gender = gender;
    this.address = address; // Address object
  }
}
