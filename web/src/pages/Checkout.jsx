import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

// Display only. The server works out the real total.
const DELIVERY_FEE = 2;

function Checkout() {
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    notes: "",
    payment: "cash",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Please enter your name";
    if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!form.address.trim())
      newErrors.address = "Please enter your delivery address";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        customer: form,
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
      });
      clearCart();
      navigate("/order-success", { state: { order: res.data.order } });
    } catch (err) {
      const missingIds = err.response?.data?.missingIds;

      if (missingIds?.length) {
        const names = items
          .filter((i) => missingIds.includes(i.id))
          .map((i) => i.name);
        missingIds.forEach((id) => removeItem(id));
        setErrors({
          form: `These dishes are no longer available and were removed from your cart: ${names.join(", ")}. Please review your order and try again.`,
        });
      } else {
        setErrors({
          form:
            err.response?.data?.message ||
            "Could not reach the server. Please try again.",
        });
      }
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        {errors.form && (
          <p className="text-red-500 text-sm mb-3">{errors.form}</p>
        )}
        <Link to="/restaurants" className="text-red-500 underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const inputClass = "w-full border rounded-lg px-4 py-2 bg-white";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Delivery details form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Delivery address
            </label>
            <textarea
              name="address"
              rows="3"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes for the rider (optional)
            </label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment method
            </label>
            <select
              name="payment"
              value={form.payment}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="cash">Cash on delivery</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile money</option>
            </select>
          </div>

          {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place Order"}
          </button>
        </form>

        {/* Order summary */}
        <div className="bg-white rounded-xl shadow p-5 h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.emoji} {item.name} × {item.qty}
                </span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span>${DELIVERY_FEE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>${(totalPrice + DELIVERY_FEE).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
