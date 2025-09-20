// utils/timeSlots.js
export default function generateTimeSlots(start, end, durationMinutes) {
  const slots = [];
  let current = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);

  while (current.getTime() + durationMinutes * 60000 <= endTime.getTime()) {
    const slotStart = current.toTimeString().substring(0, 5);
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000)
      .toTimeString()
      .substring(0, 5);
    slots.push({ start: slotStart, end: slotEnd });
    current = new Date(current.getTime() + durationMinutes * 60000);
  }

  return slots;
}
