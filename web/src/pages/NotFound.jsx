import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="max-w-xl mx-auto p-10 text-center">
      <div className="text-6xl mb-3">🍽️</div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 mb-4">
        We couldn't find the page you were looking for.
      </p>
      <Link to="/" className="text-red-500 underline">
        Back to home
      </Link>
    </div>
  );
}

export default NotFound;
