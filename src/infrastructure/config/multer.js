import multer from "multer";
import path from "path";
import fs from "fs";

// 🛠 Ensure folder exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * 🏥 Clinic image uploader
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
 * 🐾 Pet image uploader
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

/**
 * 👤 Client (owner) image uploader — NEW
 */
const clientStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/clients";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

export const uploadClientImage = multer({ storage: clientStorage });

// 🩺 For health record documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/documents";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const uploadDocument = multer({ storage: documentStorage });
