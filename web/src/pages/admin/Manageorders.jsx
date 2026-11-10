import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const STATUS_LABELS = {
  placed: "Placed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const BADGE = {
  placed: "bg-gray-100 text-gray-700",
  preparing: "bg-orange-100 text-orange-700",
  on_the_way: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// The one forward step available from each status
const NEXT = {
  placed: { status: "preparing", label: "Mark as preparing" },
  preparing: { status: "on_the_way", label: "Mark as on the way" },
  on_the_way: { status: "delivered", label: "Mark as delivered" },
};

const PAYMENT = {
  cash: "Cash on delivery",
  card: "Card",
  mobile: "Mobile money",
};
const FILTERS = [
  "all",
  "placed",
  "preparing",
  "on_the_way",
  "delivered",
  "cancelled",
];

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get("/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Could not load orders. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setActionError("");
    try {
      const res = await api.patch(`/admin/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? res.data.order : o)));
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not update the order",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (id) => {
    if (window.confirm("Cancel this order?")) {
      updateStatus(id, "cancelled");
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const countFor = (f) =>
    f === "all" ? orders.length : orders.filter((o) => o.status === f).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/admin" className="text-red-500 text-sm">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Manage Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm border ${
              filter === f
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-700 hover:border-red-500"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]} ({countFor(f)})
          </button>
        ))}
      </div>

      {actionError && (
        <p className="text-red-500 text-sm mb-4">{actionError}</p>
      )}

      {filtered.length === 0 && (
        <p className="text-gray-500">No orders here.</p>
      )}

      <div className="space-y-5">
        {filtered.map((order) => {
          const next = NEXT[order.status];
          const busy = busyId === order.id;

          return (
            <div key={order.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-semibold">
                    Order #{String(order.id).padStart(5, "0")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${BADGE[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="mt-3 text-sm space-y-1">
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {order.customer.name} · {order.customer.phone}
                </p>
                <p className="text-gray-500">{order.userEmail}</p>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {order.customer.address}
                </p>
                {order.customer.notes && (
                  <p>
                    <span className="font-medium">Notes:</span>{" "}
                    {order.customer.notes}
                  </p>
                )}
                <p>
                  <span className="font-medium">Payment:</span>{" "}
                  {PAYMENT[order.customer.payment]}
                </p>
              </div>

              <div className="border-t mt-3 pt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.emoji} {item.name} × {item.qty}
                    </span>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-3 pt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold">Total: ${order.total.toFixed(2)}</p>

                {next ? (
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => updateStatus(order.id, next.status)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
                    >
                      {next.label}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleCancel(order.id)}
                      className="border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-60"
                    >
                      Cancel order
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No further actions</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ManageOrders;
