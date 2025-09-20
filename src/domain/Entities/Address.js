// domain/entities/Address.js
export default class Address {
  constructor({
    country,
    street,
    city,
    province,
    postalCode,
    barangay,
    unit,
    latitude,
    longitude,
  }) {
    this.street = street;
    this.country = country;
    this.city = city;
    this.province = province;
    this.postalCode = postalCode;
    this.barangay = barangay;
    this.unit = unit;
    this.latitude = latitude;
    this.longitude = longitude;
  }
}
