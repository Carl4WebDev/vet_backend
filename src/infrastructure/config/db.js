// import pkg from "pg";
// import ENV from "./env.js";

// const { Pool } = pkg;

// export const pool = new Pool({
//   user: ENV.DB.USER,
//   host: ENV.DB.HOST,
//   database: ENV.DB.NAME,
//   password: ENV.DB.PASSWORD,
//   port: ENV.DB.PORT,
// });

// pool
//   .connect()
//   .then(() => console.log("✅ Connected to Postgres"))
//   .catch((err) => console.error("❌ DB Error:", err.message));

import pkg from "pg";
import ENV from "./env.js";

const { Pool } = pkg;

export const pool = new Pool({
  user: ENV.DB.USER,
  host: ENV.DB.HOST,
  database: ENV.DB.NAME,
  password: ENV.DB.PASSWORD,
  port: ENV.DB.PORT,
  // ssl: { rejectUnauthorized: false }, // ✅ Required for Render
  //for render
  // for render agagin
});

pool
  .connect()
  .then(() => console.log("✅ Connected to Postgres"))
  .catch((err) => console.error("❌ DB Error:", err.message));
