import { NavLink } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-red-500 font-semibold"
      : "text-gray-700 hover:text-red-500";

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex flex-wrap items-center justify-between gap-3">
      <NavLink to="/" className="text-2xl font-bold text-red-500">
        FoodDash
      </NavLink>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/restaurants" className={linkClass}>
          Restaurants
        </NavLink>
        <NavLink to="/cart" className={linkClass}>
          Cart ({totalItems})
        </NavLink>

        {user ? (
          <>
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
            {user.role === "admin" && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
            <span className="text-gray-700">Hi, {user.name.split(" ")[0]}</span>
            <button
              onClick={logout}
              className="text-gray-700 hover:text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
