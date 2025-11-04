import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";
import PostgresAppointmentRepository from "../../../../infrastructure/database/PostgresAppointmentRepository.js";

const router = express.Router();
const appointmentRepo = new PostgresAppointmentRepository(pool);

/* ======================================================
 🩺 FREELANCE VET APPOINTMENT ROUTES
 ====================================================== */

// ✅ 1️⃣ Helper — generate time slots manually (used for fallback)
function generateTimeSlots(start, end, durationMinutes) {
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

/* ======================================================
 ✅ 2️⃣ BOOK A FREELANCE APPOINTMENT
 ====================================================== */
router.post("/book", async (req, res) => {
  try {
    const { clientId, petId, vetId, typeId, date, startTime, notes } = req.body;
    console.log("🩺 Booking freelance vet:", req.body);

    // ⚙️ Step 1 — Basic validation
    if (!vetId || !clientId)
      throw new Error("Vet ID and Client ID are required.");
    if (!date || !startTime)
      throw new Error("Date and start time are required.");

    const now = new Date();
    const appointmentDate = new Date(date);

    // 🛑 Step 2 — Check if date is in the past
    if (appointmentDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
      throw new Error("Cannot book an appointment in the past.");
    }

    // 🕒 Step 3 — If booking is for today, ensure time isn't in the past
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const appointmentTime = new Date();
      appointmentTime.setHours(hours, minutes, 0, 0);

      // ✅ Convert to PH time (UTC+8 safety)
      const offset = appointmentTime.getTimezoneOffset() * 60000;
      const localTime = new Date(appointmentTime.getTime() - offset);

      if (localTime < now) {
        throw new Error("Cannot book a time that has already passed today.");
      }
    }

    // 🧮 Step 4 — Get duration
    const duration = await appointmentRepo.getAppointmentTypeDuration(typeId);
    if (!duration) throw new Error("Invalid appointment type.");

    // 🕓 Step 5 — Compute end_time
    const endTimeQuery = await pool.query(
      `SELECT ($1::time + ($2 || ' minutes')::interval) AS end_time`,
      [startTime, duration]
    );
    const endTime = endTimeQuery.rows[0].end_time;

    // 🔍 Step 6 — Conflict check
    const conflict = await appointmentRepo.hasConflict(
      vetId,
      date,
      startTime,
      endTime
    );
    if (conflict) throw new Error("Appointment conflict detected.");

    // 💾 Step 7 — Save appointment (clinic_id = null)
    const result = await pool.query(
      `INSERT INTO appointments 
        (vet_id, client_id, pet_id, date, start_time, end_time, type_id, status, notes, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8, NULL)
       RETURNING *`,
      [vetId, clientId, petId, date, startTime, endTime, typeId, notes]
    );

    res.status(201).json({
      success: true,
      message: "Freelance appointment booked successfully!",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(400).json({ success: false, message: error });
  }
});

/* ======================================================
 ✅ 3️⃣ GET FREELANCE VET AVAILABLE SLOTS
 ====================================================== */
router.get("/slots/:vetId/:date/:typeId", async (req, res) => {
  const { vetId, date, typeId } = req.params;

  try {
    // Step 1: get appointment duration
    const durationResult = await pool.query(
      "SELECT duration_minutes FROM appointmenttypes WHERE type_id = $1",
      [typeId]
    );
    const duration = durationResult.rows[0]?.duration_minutes || 30;

    // Step 2: define daily range (default 8am–5pm for freelancers)
    let allSlots = generateTimeSlots("08:00", "17:00", duration);

    // ✅ Step 2.5: remove past time slots if the selected date is today
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      allSlots = allSlots.filter((slot) => {
        const [hours, minutes] = slot.start.split(":").map(Number);
        const slotTotalMinutes = hours * 60 + minutes;
        return slotTotalMinutes > currentTotalMinutes; // only keep future slots
      });
    }

    // Step 3: check booked appointments for that vet/date
    const booked = await pool.query(
      `SELECT start_time, end_time 
       FROM appointments 
       WHERE vet_id = $1 AND date = $2 
       AND status NOT IN ('Cancelled', 'Rejected')`,
      [vetId, date]
    );

    // Step 4: filter out conflicts
    const available = allSlots.filter(
      (slot) =>
        !booked.rows.some(
          (b) => slot.start < b.end_time && slot.end > b.start_time
        )
    );

    res.json({
      success: true,
      message: "Available slots fetched successfully.",
      slots: available,
    });
  } catch (error) {
    console.error("❌ Error fetching freelance slots:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
