import jwt from "jsonwebtoken";
import ENV from "../config/env.js";

export default class JwtTokenService {
  generate(payload) {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });
  }
}
