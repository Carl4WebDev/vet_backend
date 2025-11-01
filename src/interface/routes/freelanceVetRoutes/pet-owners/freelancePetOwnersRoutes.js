import express from "express";
import { pool } from "../../../../infrastructure/config/db.js";

const router = express.Router();

/**
 * @route   GET /freelance/pet-owners/:vetId
 * @desc    Get all unique pet owners (with pets + visit count)
 * @access  Private
 */
router.get("/:vetId", async (req, res) => {
  const { vetId } = req.params;

  try {
    const query = `
      SELECT 
        c.client_id,
        c.client_name AS owner_name,
        c.gender,
        c.phone AS contact_number,
        u.email,
        CONCAT_WS(', ', a.street, a.city, a.province) AS address,
        i.file_path AS owner_image,
        COUNT(ap.appointment_id) AS visit_count,
        p.pet_id,
        p.name AS pet_name,
        p.species,
        p.breed,
        p.age,
        p.weight,
        p.gender AS pet_gender,
        p.bio AS pet_bio,
        pi.file_path AS pet_image
      FROM appointments ap
      JOIN clients c ON ap.client_id = c.client_id
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN addresses a ON c.address_id = a.address_id
      LEFT JOIN pets p ON p.client_id = c.client_id
      LEFT JOIN images i 
        ON i.entity_type = 'client'
        AND i.entity_id = c.client_id
        AND i.image_role = 'main'
      LEFT JOIN images pi 
        ON pi.entity_type = 'pet'
        AND pi.entity_id = p.pet_id
        AND pi.image_role = 'main'
      WHERE ap.vet_id = $1
      GROUP BY 
        c.client_id, c.client_name, c.gender, c.phone, u.email,
        a.street, a.city, a.province, i.file_path,
        p.pet_id, p.name, p.species, p.breed, p.age, p.weight, p.gender, p.bio, pi.file_path
      ORDER BY c.client_name;
    `;

    const { rows } = await pool.query(query, [vetId]);
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    // 🧩 Group pets under each owner
    const ownersMap = {};
    rows.forEach((r) => {
      if (!ownersMap[r.client_id]) {
        ownersMap[r.client_id] = {
          client_id: r.client_id,
          owner_name: r.owner_name,
          gender: r.gender,
          contact_number: r.contact_number,
          email: r.email || "N/A",
          address: r.address || "No address available",
          visit_count: Number(r.visit_count) || 0,
          owner_image: r.owner_image
            ? `${BASE_URL.replace(/\/$/, "")}/${r.owner_image.replace(
                /^\/?/,
                ""
              )}`
            : null,
          pets: [],
        };
      }

      if (r.pet_id) {
        ownersMap[r.client_id].pets.push({
          pet_id: r.pet_id,
          name: r.pet_name,
          species: r.species,
          breed: r.breed,
          age: r.age,
          weight: r.weight,
          gender: r.pet_gender,
          bio: r.pet_bio,
          image_url: r.pet_image
            ? `${BASE_URL.replace(/\/$/, "")}/${r.pet_image.replace(
                /^\/?/,
                ""
              )}`
            : null,
        });
      }
    });

    return res.status(200).json(Object.values(ownersMap));
  } catch (err) {
    console.error("⚠️ get freelance pet owners failed:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
