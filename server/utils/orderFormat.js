import pool from "../db.js";

// Turns order rows from the database into the shape the website uses.
// Rows from the admin query also carry user_email, which is passed along.
export async function attachItems(orderRows) {
  if (orderRows.length === 0) return [];

  const ids = orderRows.map((o) => o.id);
  const [itemRows] = await pool.query(
    `SELECT oi.order_id, oi.menu_item_id AS id, oi.name, oi.price,
            oi.quantity AS qty, m.emoji
     FROM order_items oi
     LEFT JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id IN (?)
     ORDER BY oi.id`,
    [ids],
  );

  return orderRows.map((o) => ({
    id: o.id,
    status: o.status,
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    total: o.total,
    createdAt: o.created_at,
    userEmail: o.user_email,
    customer: {
      name: o.customer_name,
      phone: o.customer_phone,
      address: o.address,
      notes: o.notes,
      payment: o.payment_method,
    },
    items: itemRows
      .filter((i) => i.order_id === o.id)
      .map(({ order_id, ...item }) => item),
  }));
}
