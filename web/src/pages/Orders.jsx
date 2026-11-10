import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const STEPS = [
  { status: "placed", label: "Order placed" },
  { status: "preparing", label: "Preparing" },
  { status: "on_the_way", label: "On the way" },
  { status: "delivered", label: "Delivered" },
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch(() =>
        setError("Could not load your orders. Is the server running?"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading your orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
        <p className="text-gray-500 mb-2">
          When you place an order, it will show up here.
        </p>
        <Link to="/restaurants" className="text-red-500 underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const cancelled = order.status === "cancelled";
          const stage = STEPS.findIndex((s) => s.status === order.status);
          const delivered = stage === STEPS.length - 1;

          let badgeClass = "bg-orange-100 text-orange-700";
          if (cancelled) badgeClass = "bg-red-100 text-red-700";
          if (delivered) badgeClass = "bg-green-100 text-green-700";

          return (
            <div key={order.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">
                    Order #{String(order.id).padStart(5, "0")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${badgeClass}`}
                >
                  {cancelled ? "Cancelled" : STEPS[stage].label}
                </span>
              </div>

              {!cancelled && (
                <div className="flex gap-1 mt-4">
                  {STEPS.map((s, i) => (
                    <div key={s.status} className="flex-1 text-center">
                      <div
                        className={`h-2 rounded-full ${i <= stage ? "bg-red-500" : "bg-gray-200"}`}
                      />
                      <p
                        className={`text-xs mt-1 ${
                          i <= stage
                            ? "text-red-500 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t mt-4 pt-4 space-y-1 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.emoji} {item.name} × {item.qty}
                    </span>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 text-sm">
                <div className="flex justify-between font-bold">
                  <span>Total (incl. delivery)</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 mt-2">
                  Delivering to: {order.customer.address}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;
