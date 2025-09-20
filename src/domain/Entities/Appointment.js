export default class Appointment {
  constructor({
    appointment_id,
    vet_id,
    client_id,
    pet_id,
    date,
    start_time,
    end_time,
    status = "booked",
    type_id,
  }) {
    this.appointment_id = appointment_id;
    this.vet_id = vet_id;
    this.client_id = client_id;
    this.pet_id = pet_id;
    this.date = date;
    this.start_time = start_time;
    this.end_time = end_time;
    this.status = status;
    this.type_id = type_id;
  }
}
