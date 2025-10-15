const BASE = process.env.BASE_URL || "http://localhost:5000";
export function toPublicUrl(filePath) {
  // if you already serve /uploads via express.static('/uploads', ...),
  // filePath likely looks like "uploads/...."
  return `${BASE.replace(/\/$/, "")}/${filePath.replace(/^\/?/, "")}`;
}
