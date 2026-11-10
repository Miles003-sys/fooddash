import { Router } from "express";
import pool from "../db.js";

const router = Router();

const RESTAURANT_FIELDS =
  "id, name, cuisine, rating, delivery_time AS deliveryTime, emoji";

// GET /api/restaurants  ->  all restaurants
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${RESTAURANT_FIELDS} FROM restaurants ORDER BY id`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load restaurants" });
  }
});

// GET /api/restaurants/:id  ->  one restaurant with its menu
router.get("/:id", async (req, res) => {
  try {
    const [restaurants] = await pool.query(
      `SELECT ${RESTAURANT_FIELDS} FROM restaurants WHERE id = ?`,
      [req.params.id],
    );

    if (restaurants.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const [menu] = await pool.query(
      `SELECT id, restaurant_id AS restaurantId, name, description, price, emoji
       FROM menu_items WHERE restaurant_id = ? ORDER BY id`,
      [req.params.id],
    );

    res.json({ ...restaurants[0], menu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load restaurant" });
  }
});

export default router;
