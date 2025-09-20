// domain/builders/AddressBuilder.js
import Address from "../Entities/Address.js";

export default class AddressBuilder {
  constructor() {
    this.data = {};
  }

  setId(id) {
    this.data.id = id;
    return this;
  }

  setCountry(country) {
    this.data.country = country;
    return this;
  }

  setStreet(street) {
    this.data.street = street;
    return this;
  }

  setCity(city) {
    this.data.city = city;
    return this;
  }

  setProvince(province) {
    this.data.province = province;
    return this;
  }

  setPostalCode(postalCode) {
    this.data.postalCode = postalCode;
    return this;
  }

  setBarangay(barangay) {
    this.data.barangay = barangay;
    return this;
  }

  // Match DB column name unit_number
  setUnitNumber(unitNumber) {
    this.data.unitNumber = unitNumber;
    return this;
  }

  setCreatedAt(createdAt) {
    this.data.createdAt = createdAt;
    return this;
  }
  setLatitude(latitude) {
    this.data.latitude = latitude;
    return this;
  }
  setLongitude(longitude) {
    this.data.longitude = longitude;
    return this;
  }

  build() {
    return new Address(this.data);
  }
}
