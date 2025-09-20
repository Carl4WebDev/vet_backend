import dotenv from "dotenv";
dotenv.config();

export default {
  PORT: process.env.PORT || 5000,
  DB: {
    USER: process.env.DB_USER,
    HOST: process.env.DB_HOST,
    NAME: process.env.DB_NAME,
    PASSWORD: process.env.DB_PASS,
    PORT: process.env.DB_PORT,
  },
  JWT_SECRET: process.env.JWT_SECRET,
};
