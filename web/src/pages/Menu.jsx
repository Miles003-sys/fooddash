import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import api from "../services/api";

function Menu() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/restaurants/${id}`)
      .then((res) => setRestaurant(res.data))
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? "Restaurant not found."
            : "Could not reach the server. Is it running?",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading menu...</div>;
  }

  if (error || !restaurant) {
    return (
      <div className="p-6">
        <p>{error}</p>
        <Link to="/restaurants" className="text-red-500 underline">
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/restaurants" className="text-red-500 text-sm">
        ← Back
      </Link>
      <h1 className="text-3xl font-bold mt-2">
        {restaurant.emoji} {restaurant.name}
      </h1>
      <p className="text-gray-500 mb-6">
        {restaurant.cuisine} · ⭐ {restaurant.rating} ·{" "}
        {restaurant.deliveryTime}
      </p>

      <div className="space-y-4">
        {restaurant.menu.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow p-4 flex items-center gap-4"
          >
            <div className="text-4xl">{item.emoji}</div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="mt-1 font-medium">${item.price.toFixed(2)}</p>
            </div>
            <button
              onClick={() => addToCart(item)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Menu;
