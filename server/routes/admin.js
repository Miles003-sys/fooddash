import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { attachItems } from "../utils/orderFormat.js";

const router = Router();

const VALID_STATUSES = [
  "placed",
  "preparing",
  "on_the_way",
  "delivered",
  "cancelled",
];
const DEFAULT_EMOJI = "🍽️";

const ORDER_WITH_EMAIL = `
  SELECT o.*, u.email AS user_email
  FROM orders o
  JOIN users u ON u.id = o.user_id
`;

const RESTAURANT_FIELDS =
  "id, name, cuisine, rating, delivery_time AS deliveryTime, emoji";
const DISH_FIELDS =
  "id, restaurant_id AS restaurantId, name, description, price, emoji";

// ---------- helpers ----------

function readRestaurant(body = {}) {
  const name = String(body.name || "").trim();
  const cuisine = String(body.cuisine || "").trim();
  const deliveryTime = String(body.deliveryTime || "").trim();
  const emoji = String(body.emoji || "").trim() || DEFAULT_EMOJI;
  const rating = Number(body.rating);

  if (!name || name.length > 100) {
    return { error: "Please enter a restaurant name (up to 100 characters)" };
  }
  if (!cuisine || cuisine.length > 50) {
    return { error: "Please enter a cuisine (up to 50 characters)" };
  }
  if (!deliveryTime || deliveryTime.length > 20) {
    return { error: "Please enter a delivery time, for example 20-30 min" };
  }
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    return { error: "Rating must be a number from 0 to 5" };
  }
  if (emoji.length > 10) {
    return { error: "Emoji is too long" };
  }

  return {
    values: {
      name,
      cuisine,
      deliveryTime,
      emoji,
      rating: Math.round(rating * 10) / 10,
    },
  };
}

function readDish(body = {}) {
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const emoji = String(body.emoji || "").trim() || DEFAULT_EMOJI;
  const price = Number(body.price);

  if (!name || name.length > 100) {
    return { error: "Please enter a dish name (up to 100 characters)" };
  }
  if (description.length > 255) {
    return { error: "Description is too long (255 characters at most)" };
  }
  if (!Number.isFinite(price) || price <= 0 || price > 9999.99) {
    return { error: "Price must be more than 0" };
  }
  if (emoji.length > 10) {
    return { error: "Emoji is too long" };
  }

  return {
    values: { name, description, emoji, price: Math.round(price * 100) / 100 },
  };
}

const isValidId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

// Past orders keep a link to the dishes they contain, so those can't be deleted
function deleteBlockedMessage(err, what) {
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return `This ${what} appears in past orders, so it can't be deleted.`;
  }
  return null;
}

// ---------- dashboard ----------

// GET /api/admin/stats
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM restaurants) AS restaurants,
        (SELECT COUNT(*) FROM menu_items) AS menuItems,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled') AS revenue
    `);

    const [statusRows] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM orders GROUP BY status",
    );
    const ordersByStatus = {
      placed: 0,
      preparing: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0,
    };
    statusRows.forEach((row) => {
      ordersByStatus[row.status] = row.count;
    });

    res.json({ ...counts, ordersByStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load dashboard numbers" });
  }
});

// ---------- orders ----------

// GET /api/admin/orders
router.get("/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${ORDER_WITH_EMAIL} ORDER BY o.created_at DESC, o.id DESC`,
    );
    res.json(await attachItems(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load orders" });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch(
  "/orders/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const status = String((req.body || {}).status || "");
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const [existing] = await pool.query(
        "SELECT id FROM orders WHERE id = ?",
        [req.params.id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
        status,
        req.params.id,
      ]);

      const [rows] = await pool.query(`${ORDER_WITH_EMAIL} WHERE o.id = ?`, [
        req.params.id,
      ]);
      const [order] = await attachItems(rows);
      res.json({ order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not update the order" });
    }
  },
);

// ---------- restaurants ----------

// POST /api/admin/restaurants
router.post("/restaurants", requireAuth, requireAdmin, async (req, res) => {
  const { values, error } = readRestaurant(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query(
      `INSERT INTO restaurants (name, cuisine, rating, delivery_time, emoji)
       VALUES (?, ?, ?, ?, ?)`,
      [
        values.name,
        values.cuisine,
        values.rating,
        values.deliveryTime,
        values.emoji,
      ],
    );
    const [rows] = await pool.query(
      `SELECT ${RESTAURANT_FIELDS} FROM restaurants WHERE id = ?`,
      [result.insertId],
    );
    res.status(201).json({ restaurant: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not add the restaurant" });
  }
});

// PUT /api/admin/restaurants/:id
router.put("/restaurants/:id", requireAuth, requireAdmin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid restaurant id" });
  }
  const { values, error } = readRestaurant(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [existing] = await pool.query(
      "SELECT id FROM restaurants WHERE id = ?",
      [req.params.id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await pool.query(
      `UPDATE restaurants
       SET name = ?, cuisine = ?, rating = ?, delivery_time = ?, emoji = ?
       WHERE id = ?`,
      [
        values.name,
        values.cuisine,
        values.rating,
        values.deliveryTime,
        values.emoji,
        req.params.id,
      ],
    );
    const [rows] = await pool.query(
      `SELECT ${RESTAURANT_FIELDS} FROM restaurants WHERE id = ?`,
      [req.params.id],
    );
    res.json({ restaurant: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update the restaurant" });
  }
});

// DELETE /api/admin/restaurants/:id  (its dishes are deleted with it)
router.delete(
  "/restaurants/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid restaurant id" });
    }

    try {
      const [existing] = await pool.query(
        "SELECT id FROM restaurants WHERE id = ?",
        [req.params.id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      await pool.query("DELETE FROM restaurants WHERE id = ?", [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      const blocked = deleteBlockedMessage(err, "restaurant has dishes that");
      if (blocked) {
        return res.status(409).json({
          message:
            "This restaurant has dishes that appear in past orders, so it can't be deleted.",
        });
      }
      console.error(err);
      res.status(500).json({ message: "Could not delete the restaurant" });
    }
  },
);

// ---------- dishes ----------

// POST /api/admin/restaurants/:id/dishes
router.post(
  "/restaurants/:id/dishes",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid restaurant id" });
    }
    const { values, error } = readDish(req.body);
    if (error) return res.status(400).json({ message: error });

    try {
      const [existing] = await pool.query(
        "SELECT id FROM restaurants WHERE id = ?",
        [req.params.id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const [result] = await pool.query(
        `INSERT INTO menu_items (restaurant_id, name, description, price, emoji)
       VALUES (?, ?, ?, ?, ?)`,
        [
          req.params.id,
          values.name,
          values.description || null,
          values.price,
          values.emoji,
        ],
      );
      const [rows] = await pool.query(
        `SELECT ${DISH_FIELDS} FROM menu_items WHERE id = ?`,
        [result.insertId],
      );
      res.status(201).json({ dish: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not add the dish" });
    }
  },
);

// PUT /api/admin/dishes/:id
router.put("/dishes/:id", requireAuth, requireAdmin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid dish id" });
  }
  const { values, error } = readDish(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [existing] = await pool.query(
      "SELECT id FROM menu_items WHERE id = ?",
      [req.params.id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Dish not found" });
    }

    await pool.query(
      `UPDATE menu_items
       SET name = ?, description = ?, price = ?, emoji = ?
       WHERE id = ?`,
      [
        values.name,
        values.description || null,
        values.price,
        values.emoji,
        req.params.id,
      ],
    );
    const [rows] = await pool.query(
      `SELECT ${DISH_FIELDS} FROM menu_items WHERE id = ?`,
      [req.params.id],
    );
    res.json({ dish: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update the dish" });
  }
});

// DELETE /api/admin/dishes/:id
router.delete("/dishes/:id", requireAuth, requireAdmin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: "Invalid dish id" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM menu_items WHERE id = ?",
      [req.params.id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Dish not found" });
    }

    await pool.query("DELETE FROM menu_items WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    const blocked = deleteBlockedMessage(err, "dish");
    if (blocked) return res.status(409).json({ message: blocked });
    console.error(err);
    res.status(500).json({ message: "Could not delete the dish" });
  }
});

export default router;
