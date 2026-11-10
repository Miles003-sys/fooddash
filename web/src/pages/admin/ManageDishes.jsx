import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const EMPTY_FORM = { name: "", description: "", price: "", emoji: "🍽️" };

function ManageDishes() {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api
      .get(`/restaurants/${id}`)
      .then((res) => setRestaurant(res.data))
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? "Restaurant not found."
            : "Could not load this restaurant. Is the server running?",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const startEdit = (dish) => {
    setEditingId(dish.id);
    setForm({
      name: dish.name,
      description: dish.description || "",
      price: String(dish.price),
      emoji: dish.emoji,
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
        const res = await api.put(`/admin/dishes/${editingId}`, form);
        setRestaurant((prev) => ({
          ...prev,
          menu: prev.menu.map((d) => (d.id === editingId ? res.data.dish : d)),
        }));
      } else {
        const res = await api.post(`/admin/restaurants/${id}/dishes`, form);
        setRestaurant((prev) => ({
          ...prev,
          menu: [...prev.menu, res.data.dish],
        }));
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

  const handleDelete = async (dish) => {
    if (!window.confirm(`Delete ${dish.name}?`)) return;
    setActionError("");
    try {
      await api.delete(`/admin/dishes/${dish.id}`);
      setRestaurant((prev) => ({
        ...prev,
        menu: prev.menu.filter((d) => d.id !== dish.id),
      }));
      if (editingId === dish.id) cancelEdit();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not delete the dish",
      );
    }
  };

  const inputClass = "w-full border rounded-lg px-3 py-2 bg-white";

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (error || !restaurant) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
        <Link to="/admin/restaurants" className="text-red-500 underline">
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/admin/restaurants" className="text-red-500 text-sm">
        ← Restaurants
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">
        {restaurant.emoji} {restaurant.name}: dishes
      </h1>

      {/* Add / edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-5 mb-8"
      >
        <h2 className="font-semibold mb-3">
          {editingId ? "Edit dish" : "Add a dish"}
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
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <input
              name="description"
              value={form.description}
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
          </div>
        </div>

        {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add dish"}
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
        {restaurant.menu.map((dish) => (
          <div
            key={dish.id}
            className="bg-white rounded-xl shadow p-4 flex flex-wrap items-center gap-4"
          >
            <div className="text-3xl">{dish.emoji}</div>
            <div className="flex-1 min-w-48">
              <p className="font-semibold">{dish.name}</p>
              <p className="text-sm text-gray-500">{dish.description}</p>
              <p className="text-sm font-medium mt-1">
                ${dish.price.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(dish)}
                className="border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(dish)}
                className="border border-red-500 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {restaurant.menu.length === 0 && (
          <p className="text-gray-500">
            No dishes yet. Add the first one above.
          </p>
        )}
      </div>
    </div>
  );
}

export default ManageDishes;
