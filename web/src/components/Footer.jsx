import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-white border-t mt-10 px-6 py-6 text-sm text-gray-500">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="font-semibold text-red-500">FoodDash</span> · A
          practice food delivery project
        </p>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-red-500">
            Home
          </Link>
          <Link to="/restaurants" className="hover:text-red-500">
            Restaurants
          </Link>
          <Link to="/cart" className="hover:text-red-500">
            Cart
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
