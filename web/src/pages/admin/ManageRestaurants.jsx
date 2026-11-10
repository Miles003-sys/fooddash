import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const EMPTY_FORM = {
  name: "",
  cuisine: "",
  rating: "4.5",
  deliveryTime: "",
  emoji: "🍽️",
};

function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api
      .get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() =>
        setError("Could not load restaurants. Is the server running?"),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      cuisine: r.cuisine,
      rating: String(r.rating),
      deliveryTime: r.deliveryTime,
      emoji: r.emoji,
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        const res = await api.put(`/admin/restaurants/${editingId}`, form);
        setRestaurants((prev) =>
          prev.map((r) => (r.id === editingId ? res.data.restaurant : r)),
        );
      } else {
        const res = await api.post("/admin/restaurants", form);
        setRestaurants((prev) => [...prev, res.data.restaurant]);
      }
      cancelEdit();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Could not save. Is the server running?",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete ${r.name} and all of its dishes?`)) return;
    setActionError("");
    try {
      await api.delete(`/admin/restaurants/${r.id}`);
      setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
      if (editingId === r.id) cancelEdit();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not delete the restaurant",
      );
    }
  };

  const inputClass = "w-full border rounded-lg px-3 py-2 bg-white";

  if (loading) {
    return <div className="p-6 text-gray-500">Loading restaurants...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/admin" className="text-red-500 text-sm">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Manage Restaurants</h1>

      {/* Add / edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-5 mb-8"
      >
        <h2 className="font-semibold mb-3">
          {editingId ? "Edit restaurant" : "Add a restaurant"}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cuisine</label>
            <input
              name="cuisine"
              value={form.cuisine}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Rating (0 to 5)
            </label>
            <input
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Delivery time
            </label>
            <input
              name="deliveryTime"
              placeholder="e.g. 20-30 min"
              value={form.deliveryTime}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emoji</label>
            <input
              name="emoji"
              value={form.emoji}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: press Windows key + . to open the emoji picker.
            </p>
          </div>
        </div>

        {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Save changes"
                : "Add restaurant"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="border px-5 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {actionError && (
        <p className="text-red-500 text-sm mb-4">{actionError}</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl shadow p-4 flex flex-wrap items-center gap-4"
          >
            <div className="text-4xl">{r.emoji}</div>
            <div className="flex-1 min-w-48">
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-gray-500">
                {r.cuisine} · ⭐ {r.rating} · {r.deliveryTime}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/admin/restaurants/${r.id}/dishes`}
                className="border border-red-500 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
              >
                Dishes
              </Link>
              <button
                onClick={() => startEdit(r)}
                className="border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(r)}
                className="border border-red-500 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {restaurants.length === 0 && (
          <p className="text-gray-500">
            No restaurants yet. Add the first one above.
          </p>
        )}
      </div>
    </div>
  );
}

export default ManageRestaurants;
