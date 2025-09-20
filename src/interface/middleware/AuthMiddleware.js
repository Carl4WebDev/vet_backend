import jwt from "jsonwebtoken";
import ENV from "../../infrastructure/config/env.js";

export default class AuthMiddleware {
  static protect(roles = []) {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "No token" });

      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
        req.user = decoded;
        next();
      } catch {
        res.status(401).json({ message: "Invalid token" });
      }
    };
  }
}
