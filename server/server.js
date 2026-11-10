import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.js";
import restaurantRoutes from "./routes/restaurants.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing from server/.env");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FoodDash API is running. Try /api/health");
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS restaurants FROM restaurants",
    );
    res.json({
      status: "ok",
      database: "connected",
      restaurants: rows[0].restaurants,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: "Database connection failed" });
  }
});

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
