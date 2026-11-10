import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-gray-500 mb-3">
          This area is for administrators only.
        </p>
        <Link to="/" className="text-red-500 underline">
          Back to home
        </Link>
      </div>
    );
  }

  return children;
}

export default AdminRoute;
