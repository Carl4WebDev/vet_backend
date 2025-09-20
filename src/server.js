import express from "express";
import cors from "cors";

import ENV from "./infrastructure/config/env.js";
import { pool } from "./infrastructure/config/db.js";

import PostgresUserRepository from "./infrastructure/database/PostgresUserRepository.js";
import JwtTokenService from "./infrastructure/security/JwtTokenService.js";
import BcryptPasswordHasher from "./infrastructure/security/BcryptPasswordHasher.js";
import AuthService from "./application/auth/AuthService.js";
import AuthController from "./interface/controllers/AuthController.js";

import clientAuthRoutes from "./interface/routes/auth/clientAuthRoutes.js";
import clinicAuthRoutes from "./interface/routes/auth/clinicAuthRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

//------------------------------------------------------------------------------------------------
//auth
import RegisterUserUseCase from "./application/auth/use-cases/RegisterUserCase.js";
import LogoutUserUseCase from "./application/auth/use-cases/LogoutUserCase.js";
import LoginUserUseCase from "./application/auth/use-cases/LoginUserUseCase.js";

// Dependency injection
const userRepository = new PostgresUserRepository(pool);
const tokenService = new JwtTokenService();
const passwordHasher = new BcryptPasswordHasher();

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  tokenService,
  passwordHasher
);
const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  tokenService,
  passwordHasher
);

const logoutUserUseCase = new LogoutUserUseCase();

const authService = new AuthService(
  registerUserUseCase,
  loginUserUseCase,
  logoutUserUseCase
);

const authController = new AuthController(authService);

// Auth Routes by Role
app.use("/auth/client", clientAuthRoutes(authController));
//------------------------------------------------------------------------------------------------

const tokenClinicService = new JwtTokenService();
const passwordHasherClinic = new BcryptPasswordHasher();

import ClinicService from "./application/clinics/ClinicService.js";
import ClinicController from "./interface/controllers/clinics/ClinicController.js";
import PostgresClinicRepository from "./infrastructure/database/PostgresClinicRepository.js";

import RegisterClinicUseCase from "./application/clinics/use-case/RegisterClinicUseCase.js";
import LoginClinicUseCase from "./application/clinics/use-case/LoginClinicUseCase.js";
import LogoutClinicUseCase from "./application/clinics/use-case/LogoutClinicUseCase.js";
import GetAllClinicsUseCase from "./application/clinics/use-case/GetAllClinicsUseCase.js";
import GetClinicByIdUseCase from "./application/clinics/use-case/GetClinicByIdUseCase.js";

const clinicRepository = new PostgresClinicRepository(pool);

const registerClinicUseCase = new RegisterClinicUseCase(
  clinicRepository,
  tokenClinicService,
  passwordHasherClinic
);
const loginClinicUseCase = new LoginClinicUseCase(
  clinicRepository,
  tokenClinicService,
  passwordHasherClinic
);

const logoutClinicUseCase = new LogoutClinicUseCase();
const getAllClinicsUseCase = new GetAllClinicsUseCase(clinicRepository);
const getClinicByIdUseCase = new GetClinicByIdUseCase(clinicRepository);

const clinicService = new ClinicService(
  registerClinicUseCase,
  loginClinicUseCase,
  logoutClinicUseCase,
  getAllClinicsUseCase,
  getClinicByIdUseCase
);
const clinicController = new ClinicController(clinicService);
app.use("/clinic", clinicAuthRoutes(clinicController));

//==========================================================================================

import GetClientUseCase from "./application/clients/use-case/GetClientUseCase.js";
import EditClientUseCase from "./application/clients/use-case/EditClientUseCase.js";
import GetClientOnlyUseCase from "./application/clients/use-case/GetClientOnlyUseCase.js";

import ClientController from "./interface/controllers/clients/ClientController.js";
import clientRoutes from "./interface/routes/clients/clientRoutes.js";
import ClientService from "./application/clients/ClientService.js";

const getClientUseCase = new GetClientUseCase(userRepository);
const editClientUseCase = new EditClientUseCase(userRepository);
const getClientOnlyUseCase = new GetClientOnlyUseCase(userRepository);
const clientService = new ClientService(
  getClientUseCase,
  editClientUseCase,
  getClientOnlyUseCase
);
const clientController = new ClientController(clientService);
app.use("/clients", clientRoutes(clientController));

//==========================================================================================
import PostgresPetRepository from "./infrastructure/database/PostgresPetRepository.js";
import MedicalRecordRepo from "./infrastructure/database/MedicalRecordRepo.js";

import AddPetUseCase from "./application/pets/use-cases/AddPetUseCase.js";
import GetPetUseCase from "./application/pets/use-cases/GetPetUseCase.js";
import EditPetUseCase from "./application/pets/use-cases/EditPetUseCase.js";
import EetPetMedicalRecordsUseCase from "./application/pets/use-cases/GetPetMedicalRecords.js";
import GetPetByIdUseCase from "./application/pets/use-cases/GetPetByIdUseCase.js";

import PetService from "./application/pets/PetService.js";
import AddPetController from "./interface/controllers/pets/PetController.js";
import petRoutes from "./interface/routes/pets/petRoutes.js";

const petRepository = new PostgresPetRepository(pool);
const medicalRecordRepo = new MedicalRecordRepo(pool);

const addPetUseCase = new AddPetUseCase(petRepository);
const getPetUseCase = new GetPetUseCase(petRepository);
const editPetUseCase = new EditPetUseCase(petRepository);
const getPetMedicalRecordsUseCase = new EetPetMedicalRecordsUseCase(
  medicalRecordRepo
);
const getPetByIdUseCase = new GetPetByIdUseCase(petRepository);

const petService = new PetService(
  addPetUseCase,
  getPetUseCase,
  editPetUseCase,
  getPetMedicalRecordsUseCase,
  getPetByIdUseCase
);
const petController = new AddPetController(petService);

app.use("/pets", petRoutes(petController));

//==========================================================================================

import AppointmentRepository from "./infrastructure/database/PostgresAppointmentRepository.js";
import PostgresVetScheduleRepository from "./infrastructure/database/PostgresVetScheduleRepository.js";

import CreateAppointmentUseCase from "./application/appointments/use-case/CreateAppointmentUseCase.js";
import GetAppointmentsUseCase from "./application/appointments/use-case/GetAppointmentsUseCase.js";
import CancelAppointmentUseCase from "./application/appointments/use-case/CancelAppointmentUseCase.js";
import GetAvailableSlotsUseCase from "./application/appointments/use-case/GetAvailableSlotsUseCase.js";
import GetAppointmentOfClientUseCase from "./application/appointments/use-case/GetApppointmentOfClientUseCase.js";
import GetAppointmentByIdUseCase from "./application/appointments/use-case/GetAppointmentByIdUseCase.js";
import RescheduleAppointmentUseCase from "./application/appointments/use-case/RescheduleAppointmentUseCase.js";

import AppointmentService from "./application/appointments/AppointmentService.js";
import AppointmentController from "./interface/controllers/appointments/AppointmentController.js";

import appointmentRoutes from "./interface/routes/appointment/appointmentRoutes.js";

const appointmentRepository = new AppointmentRepository(pool);
const vetScheduleRepository = new PostgresVetScheduleRepository(pool);

const rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(
  appointmentRepository
);
const getAppointmentOfClientUseCase = new GetAppointmentOfClientUseCase(
  appointmentRepository
);

const createAppointmentUseCase = new CreateAppointmentUseCase(
  appointmentRepository
);
const getAppointmentsUseCase = new GetAppointmentsUseCase(
  appointmentRepository
);
const cancelAppointmentUseCase = new CancelAppointmentUseCase(
  appointmentRepository
);
const getAvailableSlotsUseCase = new GetAvailableSlotsUseCase(
  appointmentRepository,
  vetScheduleRepository
);
const getAppointmentByIdUseCase = new GetAppointmentByIdUseCase(
  appointmentRepository
);

const appointmentService = new AppointmentService(
  createAppointmentUseCase,
  getAppointmentsUseCase,
  cancelAppointmentUseCase,
  getAvailableSlotsUseCase,
  getAppointmentOfClientUseCase,
  getAppointmentByIdUseCase,
  rescheduleAppointmentUseCase
);

const appointmentController = new AppointmentController(appointmentService);

app.use("/appointments", appointmentRoutes(appointmentController));

//==========================================================================================

import PostgresAppointmentTypeRepository from "./infrastructure/database/PostgresAppointmentTypeRepository.js";
import AppointmentTypeController from "./interface/controllers/appointmentTypes/AppointmentTypeController.js";
import appointmentTypeRoutes from "./interface/routes/appointmentTypes/appointmentTypeRoutes.js";
import AppointmentTypesService from "./application/appointmentTypes/ApppointmentTypesService.js";
import GetAllAppointmentTypesUseCase from "./application/appointmentTypes/use-case/GetAllAppointmentTypesUseCase.js";

const appointmentTypeRepository = new PostgresAppointmentTypeRepository(pool);
const getAllAppointmentTypes = new GetAllAppointmentTypesUseCase(
  appointmentTypeRepository
);

const appointmentTypesService = new AppointmentTypesService(
  getAllAppointmentTypes
);

const appointmentTypeController = new AppointmentTypeController(
  appointmentTypesService
);

app.use("/appointment-types", appointmentTypeRoutes(appointmentTypeController));

//==========================================================================================medical records
import PetMedRecordController from "./interface/controllers/medicalRecords/PetMedRecordController.js";
import medRecordsRoutes from "./interface/routes/medicalRecords/medRecordsRoutes.js";

import GetPetMedRecordsUseCase from "./application/medicalRecords/GetPetMedRecordsUseCase.js";

const getPetMedRecordsUseCase = new GetPetMedRecordsUseCase(medicalRecordRepo);
const petMedRecordController = new PetMedRecordController(
  getPetMedRecordsUseCase
);

app.use("/medical-records", medRecordsRoutes(petMedRecordController));
//==========================================================================================
import { Server } from "socket.io";
import http from "http";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React Vite default port
    methods: ["GET", "POST"],
  },
});

// In your server code (replace the current socket.io implementation)

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socketId
const privateMessages = {}; // Store messages by conversation ID

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // User identifies themselves
  socket.on("registerUser", (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join a private conversation
  socket.on("joinPrivate", ({ senderId, receiverId }) => {
    const conversationId = [senderId, receiverId].sort().join("_");
    socket.join(conversationId);

    // Load previous messages
    if (!privateMessages[conversationId]) {
      privateMessages[conversationId] = [];
    }

    socket.emit("loadMessages", privateMessages[conversationId]);
    // console.log(`User ${senderId} joined private chat with ${receiverId}`);
  });

  // Send private message
  socket.on("sendPrivateMessage", ({ senderId, receiverId, text }) => {
    const conversationId = [senderId, receiverId].sort().join("_");
    const message = {
      id: Date.now(),
      senderId,
      receiverId,
      text,
      timestamp: new Date(),
    };

    // Store message
    if (!privateMessages[conversationId]) {
      privateMessages[conversationId] = [];
    }
    privateMessages[conversationId].push(message);

    // Send to sender
    socket.emit("receiveMessage", message);

    // Send to receiver if online
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }

    // console.log(`Private message from ${senderId} to ${receiverId}: ${text}`);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

// Add this to your server code
app.post("/admin/reset-users", (req, res) => {
  activeUsers.clear(); // Clear the active users map
  privateMessages = {}; // Clear all messages
  console.log("✅ All users and messages have been reset");
  res.send({ success: true, message: "All users and messages reset" });
});
// Simple test API
app.get("/chats", (req, res) => {
  res.send("🚀 Chat backend is running!");
});

// Simple test API
app.get("/chats", (req, res) => {
  res.send("🚀 Chat backend is running!");
});

// ✅ Use server.listen instead of app.listen
server.listen(ENV.PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${ENV.PORT}`);
});
