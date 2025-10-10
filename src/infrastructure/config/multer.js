import multer from "multer";
import path from "path";
import fs from "fs";

// make sure folders exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * 🏥 Clinic image uploader (you already had this)
 */
const clinicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/clinics";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
export const uploadClinicImage = multer({ storage: clinicStorage });

/**
 * 🐾 Pet image uploader (add this part)
 */
const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/pets";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
export const uploadPetImage = multer({ storage: petStorage });
