import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard";
import api from "../services/api";

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() => setError("Could not reach the server. Is it running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-red-500 text-white text-center py-16 px-6">
        <h1 className="text-4xl font-bold">Hungry? We've got you.</h1>
        <p className="mt-3 text-lg">
          Order from your favorite restaurants, delivered fast.
        </p>
        <Link
          to="/restaurants"
          className="inline-block mt-6 bg-white text-red-500 font-semibold px-6 py-3 rounded-full hover:bg-orange-100"
        >
          Browse Restaurants
        </Link>
      </section>

      <section className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Popular Restaurants</h2>

        {loading && <p className="text-gray-500">Loading restaurants...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
