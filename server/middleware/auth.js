import jwt from "jsonwebtoken";
import pool from "../db.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

// Use after requireAuth: router.get('/x', requireAuth, requireAdmin, handler)
export async function requireAdmin(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT role FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (rows.length === 0 || rows[0].role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not verify permissions" });
  }
}
