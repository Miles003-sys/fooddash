import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";

function Cart() {
  const { items, updateQty, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <Link to="/restaurants" className="text-red-500 underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow p-4 flex items-center gap-4"
          >
            <div className="text-3xl">{item.emoji}</div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, -1)}
                className="w-8 h-8 rounded-full border"
              >
                −
              </button>
              <span className="w-6 text-center">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, 1)}
                className="w-8 h-8 rounded-full border"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right font-medium">
              ${(item.price * item.qty).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</p>
        <Link
          to="/checkout"
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

export default Cart;
