import { useEffect, useState } from "react";
import RestaurantCard from "../components/RestaurantCard";
import api from "../services/api";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() => setError("Could not reach the server. Is it running?"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Restaurants</h1>
      <input
        type="text"
        placeholder="Search by name or cuisine..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-96 border rounded-lg px-4 py-2 mb-6 bg-white"
      />

      {loading && <p className="text-gray-500">Loading restaurants...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">No restaurants found.</p>
      )}
    </div>
  );
}

export default Restaurants;
