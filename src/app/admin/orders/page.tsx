"use client";

import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "@/lib/orders";
import type { Order, OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<{ uid: string; order: Order }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    getAllOrders().then((o) => { setOrders(o); setLoading(false); });
  }, []);

  const handleStatusChange = async (uid: string, orderId: string, status: OrderStatus) => {
    await updateOrderStatus(uid, orderId, status);
    setOrders((prev) =>
      prev.map((o) =>
        o.order.id === orderId ? { ...o, order: { ...o.order, status } } : o
      )
    );
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.order.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === "all" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition ${filter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            {s} ({orders.filter((o) => o.order.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ uid, order }) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString()} &bull; User: {uid.slice(0, 8)}...
                  </p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(uid, order.id, e.target.value as OrderStatus)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 text-sm">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>{item.name} ({item.size}/{item.color}) x{item.quantity}</span>
                    <span className="font-medium text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm">
                <span className="text-gray-500">
                  {order.shippingAddress?.line1}, {order.shippingAddress?.city} &bull; {order.shippingAddress?.phone}
                </span>
                <span className="font-bold text-gray-900">Rs. {order.total?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
