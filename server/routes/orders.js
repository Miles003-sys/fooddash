import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { attachItems } from "../utils/orderFormat.js";

const router = Router();

const DELIVERY_FEE = 2;
const PAYMENT_METHODS = ["cash", "card", "mobile"];

// POST /api/orders  ->  place an order (login required)
router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const customer = body.customer || {};
  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const address = String(customer.address || "").trim();
  const notes = String(customer.notes || "")
    .trim()
    .slice(0, 255);
  const payment = String(customer.payment || "");

  if (!name) return res.status(400).json({ message: "Please enter your name" });
  if (!/^[0-9+\s-]{7,15}$/.test(phone)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid phone number" });
  }
  if (!address) {
    return res
      .status(400)
      .json({ message: "Please enter your delivery address" });
  }
  if (!PAYMENT_METHODS.includes(payment)) {
    return res.status(400).json({ message: "Please choose a payment method" });
  }

  const cartItems = Array.isArray(body.items) ? body.items : [];
  if (cartItems.length === 0 || cartItems.length > 50) {
    return res.status(400).json({ message: "Your cart is empty" });
  }

  // Merge duplicate dishes and check every quantity
  const quantities = new Map();
  for (const item of cartItems) {
    const id = Number(item.id);
    const qty = Number(item.qty);
    if (
      !Number.isInteger(id) ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 50
    ) {
      return res.status(400).json({ message: "Invalid item in your cart" });
    }
    quantities.set(id, (quantities.get(id) || 0) + qty);
  }

  const connection = await pool.getConnection();
  try {
    // Names and prices come from the database, never from the website
    const [menuRows] = await connection.query(
      "SELECT id, name, price FROM menu_items WHERE id IN (?)",
      [[...quantities.keys()]],
    );

    if (menuRows.length !== quantities.size) {
      const foundIds = new Set(menuRows.map((m) => m.id));
      const missingIds = [...quantities.keys()].filter(
        (id) => !foundIds.has(id),
      );
      console.warn("Order rejected, dish ids not in menu_items:", missingIds);
      return res.status(400).json({
        message: "Some items are no longer available",
        missingIds,
      });
    }

    const lines = menuRows.map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      qty: quantities.get(m.id),
    }));
    const subtotal =
      Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) /
      100;
    const total = Math.round((subtotal + DELIVERY_FEE) * 100) / 100;

    // The order and its items are saved together, or not at all
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders
         (user_id, customer_name, customer_phone, address, notes,
          payment_method, subtotal, delivery_fee, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        phone,
        address,
        notes || null,
        payment,
        subtotal,
        DELIVERY_FEE,
        total,
      ],
    );
    const orderId = orderResult.insertId;

    await connection.query(
      "INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ?",
      [lines.map((l) => [orderId, l.id, l.name, l.price, l.qty])],
    );

    await connection.commit();

    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);
    const [order] = await attachItems(rows);
    res.status(201).json({ order });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Could not place your order" });
  } finally {
    connection.release();
  }
});

// GET /api/orders  ->  the logged-in customer's orders, newest first
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [req.user.id],
    );
    res.json(await attachItems(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your orders" });
  }
});

export default router;
