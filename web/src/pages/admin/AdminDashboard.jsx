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

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() =>
        setError("Could not load the dashboard. Is the server running?"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Restaurants" value={stats.restaurants} />
        <StatCard label="Dishes" value={stats.menuItems} />
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard
          label="Revenue (excl. cancelled)"
          value={`$${stats.revenue.toFixed(2)}`}
        />
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-3">Orders by status</h2>
      <div className="flex flex-wrap gap-3">
        {Object.entries(stats.ordersByStatus).map(([status, count]) => (
          <div
            key={status}
            className="bg-white rounded-lg shadow px-4 py-3 text-center min-w-28"
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-gray-500">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-3">Management</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/orders"
          className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition block"
        >
          <p className="font-semibold">Manage orders</p>
          <p className="text-sm text-gray-500">
            View orders and update their status
          </p>
        </Link>

        <Link
          to="/admin/restaurants"
          className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition block"
        >
          <p className="font-semibold">Manage restaurants and dishes</p>
          <p className="text-sm text-gray-500">
            Add, edit or remove restaurants and their menus
          </p>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
