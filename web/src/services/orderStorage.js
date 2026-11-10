const ORDERS_KEY = "fooddash_orders";

function readOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  const orders = readOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]));
}

export function getOrdersForUser(userId) {
  return readOrders().filter((o) => o.userId === userId);
}
