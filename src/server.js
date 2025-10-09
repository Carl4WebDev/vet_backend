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

// Must come before express.json()
const app = express();
app.use("/paymongo/webhook", express.raw({ type: "*/*" }));
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
import ClinicRepo from "./infrastructure/database/ClinicRepo.js";

import RegisterClinicUseCase from "./application/clinics/use-case/RegisterClinicUseCase.js";
import LoginClinicUseCase from "./application/clinics/use-case/LoginClinicUseCase.js";
import LogoutClinicUseCase from "./application/clinics/use-case/LogoutClinicUseCase.js";
import GetAllClinicsUseCase from "./application/clinics/use-case/GetAllClinicsUseCase.js";
import GetClinicByIdUseCase from "./application/clinics/use-case/GetClinicByIdUseCase.js";
import GetAllVetUseCase from "./application/clinics/use-case/GetAllVetUseCase.js";
import ChangePasswordUseCase from "./application/clinics/use-case/ChangePasswordClinicUseCase.js";
import ChangeInformationClinicUseCase from "./application/clinics/use-case/ChangeInformationClinicUseCase.js";
import GetClinicDetailsUseCase from "./application/clinics/use-case/GetClinicDetailsUseCase.js";

import SubscriptionRepo from "./infrastructure/database/SubscriptionRepo.js";

const clinicRepository = new PostgresClinicRepository(pool);
const clinicRepo = new ClinicRepo(pool);
const subscriptionRepo = new SubscriptionRepo(pool);

const registerClinicUseCase = new RegisterClinicUseCase(
  clinicRepo,
  tokenClinicService,
  passwordHasherClinic,
  subscriptionRepo
);
const loginClinicUseCase = new LoginClinicUseCase(
  clinicRepo,
  tokenClinicService,
  passwordHasherClinic
);

const logoutClinicUseCase = new LogoutClinicUseCase();
const getAllClinicsUseCase = new GetAllClinicsUseCase(clinicRepository);
const getClinicByIdUseCase = new GetClinicByIdUseCase(clinicRepository);
const getAllVetUseCase = new GetAllVetUseCase(clinicRepository);
const changePasswordUseCase = new ChangePasswordUseCase(
  clinicRepo,
  passwordHasher
);
const changeInformationClinicUseCase = new ChangeInformationClinicUseCase(
  clinicRepo
);
const getClinicDetailsUseCase = new GetClinicDetailsUseCase(clinicRepo);

const clinicService = new ClinicService(
  registerClinicUseCase,
  loginClinicUseCase,
  logoutClinicUseCase,
  getAllClinicsUseCase,
  getClinicByIdUseCase,
  getAllVetUseCase,
  changePasswordUseCase,
  changeInformationClinicUseCase,
  getClinicDetailsUseCase
);

const clinicController = new ClinicController(clinicService);
app.use("/clinic", clinicAuthRoutes(clinicController));

//==========================================================================================

import GetClientUseCase from "./application/clients/use-case/GetClientUseCase.js";
import EditClientUseCase from "./application/clients/use-case/EditClientUseCase.js";
import GetClientOnlyUseCase from "./application/clients/use-case/GetClientOnlyUseCase.js";
import GetClientByClinic from "./application/clients/use-case/GetClientByClinicUseCase.js";

import ClientController from "./interface/controllers/clients/ClientController.js";
import clientRoutes from "./interface/routes/clients/clientRoutes.js";
import ClientService from "./application/clients/ClientService.js";

const getClientUseCase = new GetClientUseCase(userRepository);
const editClientUseCase = new EditClientUseCase(userRepository);
const getClientOnlyUseCase = new GetClientOnlyUseCase(userRepository);
const getClientByClinicUseCase = new GetClientByClinic(userRepository);
const clientService = new ClientService(
  getClientUseCase,
  editClientUseCase,
  getClientOnlyUseCase,
  getClientByClinicUseCase
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
import GetTodayScheduleUseCase from "./application/appointments/use-case/GetTodayScheduleUseCase.js";
import GetVetAppointmentsUseCase from "./application/appointments/use-case/GetVetAppointmentsUseCase.js";
import UpdateAppointmentStatusUseCase from "./application/appointments/use-case/updateAppointmentStatusUseCase.js";

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

const getTodayScheduleUseCase = new GetTodayScheduleUseCase(
  appointmentRepository
);
const getVetAppointmentsUseCase = new GetVetAppointmentsUseCase(
  appointmentRepository
);
const updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(
  appointmentRepository
);

const appointmentService = new AppointmentService(
  createAppointmentUseCase,
  getAppointmentsUseCase,
  cancelAppointmentUseCase,
  getAvailableSlotsUseCase,
  getAppointmentOfClientUseCase,
  getAppointmentByIdUseCase,
  rescheduleAppointmentUseCase,
  getTodayScheduleUseCase,
  getVetAppointmentsUseCase,
  updateAppointmentStatusUseCase
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
import CreatePetMedicalRecordUseCase from "./application/medicalRecords/CreatePetMedicalRecordUseCase.js";

const getPetMedRecordsUseCase = new GetPetMedRecordsUseCase(medicalRecordRepo);
const createPetMedicalRecordUseCase = new CreatePetMedicalRecordUseCase(
  medicalRecordRepo
);
const petMedRecordController = new PetMedRecordController(
  getPetMedRecordsUseCase,
  createPetMedicalRecordUseCase
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

  socket.on("sendPrivateMessage", ({ senderId, receiverId, text }) => {
    const conversationId = [senderId, receiverId].sort().join("_");
    const message = {
      id: Date.now(),
      senderId,
      receiverId,
      text,
      timestamp: new Date(),
    };

    if (!privateMessages[conversationId]) {
      privateMessages[conversationId] = [];
    }
    privateMessages[conversationId].push(message);

    // ✅ Broadcast to everyone in the room (both sender & receiver)
    io.to(conversationId).emit("receiveMessage", message);
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

//==========================================================================================insights

import InsightsRepo from "./infrastructure/database/InsightsRepo.js";
import InsightsService from "./application/insights/InsightsService.js";
import InsightsController from "./interface/controllers/insights/InsightsController.js";
import insightRoutes from "./interface/routes/insights/insightRoutes.js";

const insightsRepo = new InsightsRepo(pool);
const insightsService = new InsightsService(insightsRepo);
const insightsController = new InsightsController(insightsService);

app.use("/insights", insightRoutes(insightsController));
//==========================================================================================ownerInsights
import OwnerInsightsRepo from "./infrastructure/database/OwnerInsightsRepo.js";
import OwnerInsightsService from "./application/ownerInsights/OwnerInsightsService.js";
import OwnerInsightsController from "./interface/controllers/ownerInsights/OwnerInsightsController.js";
import ownerInsightsRoutes from "./interface/routes/ownerInsights/ownerInsightsRoutes.js";

const ownerInsightsRepo = new OwnerInsightsRepo(pool);
const ownerInsightsService = new OwnerInsightsService(ownerInsightsRepo);
const ownerInsightsController = new OwnerInsightsController(
  ownerInsightsService
);
app.use("/owner-insights", ownerInsightsRoutes(ownerInsightsController));

//==========================================================================================clinic pet owners
import OwnerRepo from "./infrastructure/database/OwnerRepo.js";
import OwnerService from "./application/ownerInsights/OwnerService.js";
import OwnerController from "./interface/controllers/ownerInsights/OwnerController.js";
import ownerRoutes from "./interface/routes/ownerInsights/ownerRoutes.js";

const ownerRepo = new OwnerRepo(pool);
const ownerService = new OwnerService(ownerRepo);
const ownerController = new OwnerController(ownerService);

app.use("/clinic-client", ownerRoutes(ownerController));

//==========================================================================================clinic patient
import PatientRecordRepo from "./infrastructure/database/PatientRecordRepo.js";
import GetPatientRecordsClinic from "./application/patients/GetPatientRecordsClinic.js";
import PatientsController from "./interface/controllers/patients/PatientsController.js";
import patientRoutes from "./interface/routes/patients/patientRoutes.js";

const patientRecordRepo = new PatientRecordRepo(pool);
const getPatientRecordsClinic = new GetPatientRecordsClinic(patientRecordRepo);
const patientsController = new PatientsController(getPatientRecordsClinic);

app.use("/patients", patientRoutes(patientsController));

//==========================================================================================staff
import StaffRepo from "./infrastructure/database/StaffRepo.js";
import GetClinicStaffUseCase from "./application/staff/GetClinicStaffUseCase.js";
import DeleteStaffUseCase from "./application/staff/DeleteStaffUseCase.js";
import EditStaffUseCase from "./application/staff/EditStaffUseCase.js";
import AddStaffUseCase from "./application/staff/AddStaffUseCase.js";

import StaffController from "./interface/controllers/staff/StaffController.js";
import staffRoutes from "./interface/routes/staff/staffRoutes.js";

const staffRepo = new StaffRepo(pool);

const getClinicStaffUseCase = new GetClinicStaffUseCase(staffRepo);
const addStaffUseCase = new AddStaffUseCase(staffRepo);
const editStaffUseCase = new EditStaffUseCase(staffRepo);
const deleteStaffUseCase = new DeleteStaffUseCase(staffRepo);

const staffController = new StaffController(
  getClinicStaffUseCase,
  addStaffUseCase,
  editStaffUseCase,
  deleteStaffUseCase
);

app.use("/staff", staffRoutes(staffController));

//==========================================================================================paymongo
app.use(express.urlencoded({ extended: true }));
import planRoutes from "./interface/routes/payments/planRoutes.js";
import subscriptionRoutes from "./interface/routes/payments/subscriptionRoutes.js";
import billingRoutes from "./interface/routes/payments/billingRoutes.js";
import paymongoRoutes from "./interface/routes/payments/paymongoRoutes.js";
import paymongoWebhook from "./interface/routes/payments/paymongoWebhook.js";

// import localPayRoutes from "./interface/routes/payments/localPayRoutes.js";

app.use("/plans", planRoutes);
app.use("/billing-history", billingRoutes);
app.use("/paymongo", paymongoRoutes);
app.use("/paymongo", paymongoWebhook);

app.use("/subscriptions", subscriptionRoutes);
// app.use("/local-pay", localPayRoutes);

// import paymongoWebhookTest from "./interface/routes/payments/paymongoWebhookTest.js";
// app.use("/paymongo", express.json(), paymongoWebhookTest);

//==========================================================================================images
import path from "path";
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
