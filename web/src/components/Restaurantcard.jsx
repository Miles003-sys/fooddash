import { Link } from "react-router-dom";

function RestaurantCard({ restaurant }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden block"
    >
      <div className="h-32 bg-orange-100 flex items-center justify-center text-6xl">
        {restaurant.emoji}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{restaurant.name}</h3>
        <p className="text-gray-500 text-sm">{restaurant.cuisine}</p>
        <div className="flex justify-between mt-3 text-sm">
          <span className="text-yellow-600 font-medium">
            ⭐ {restaurant.rating}
          </span>
          <span className="text-gray-600">{restaurant.deliveryTime}</span>
        </div>
      </div>
    </Link>
  );
}

export default RestaurantCard;
