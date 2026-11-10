import { Link, useLocation } from "react-router-dom";

const paymentLabels = {
  cash: "Cash on delivery",
  card: "Card",
  mobile: "Mobile money",
};

function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">No recent order found</h1>
        <Link to="/orders" className="text-red-500 underline">
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-6xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold">Order placed!</h1>
        <p className="text-gray-500 mt-1">
          Order #{String(order.id).padStart(5, "0")} · Thank you,{" "}
          {order.customer.name}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h2 className="font-semibold mb-3">Your items</h2>
        <div className="space-y-2 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.emoji} {item.name} × {item.qty}
              </span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t mt-4 pt-4 text-sm space-y-1">
          <p>
            <span className="font-medium">Delivering to:</span>{" "}
            {order.customer.address}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {order.customer.phone}
          </p>
          <p>
            <span className="font-medium">Payment:</span>{" "}
            {paymentLabels[order.customer.payment]}
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link
          to="/restaurants"
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
        >
          Order something else
        </Link>
        <Link to="/orders" className="ml-3 text-red-500 underline">
          View my orders
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;
