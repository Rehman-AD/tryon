import { ref, get, push, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Order, OrderItem, ShippingAddress, OrderStatus } from "@/types";

export async function createOrder(
  uid: string,
  items: OrderItem[],
  total: number,
  shippingAddress: ShippingAddress
): Promise<string> {
  const orderRef = push(ref(db, `orders/${uid}`));
  const id = orderRef.key!;
  await set(orderRef, {
    items,
    total,
    status: "pending" as OrderStatus,
    shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function getOrders(uid: string): Promise<Order[]> {
  try {
    const snapshot = await get(ref(db, `orders/${uid}`));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data)
      .map(([id, val]) => ({ id, ...(val as Omit<Order, "id">) }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch {
    console.warn("[Orders] Failed to load — check Firebase RTDB rules");
    return [];
  }
}

export async function getAllOrders(): Promise<{ uid: string; order: Order }[]> {
  try {
    const snapshot = await get(ref(db, "orders"));
    if (!snapshot.exists()) return [];
    const allOrders: { uid: string; order: Order }[] = [];
    const data = snapshot.val();
    for (const [uid, userOrders] of Object.entries(data)) {
      for (const [id, val] of Object.entries(userOrders as Record<string, unknown>)) {
        allOrders.push({ uid, order: { id, ...(val as Omit<Order, "id">) } });
      }
    }
    return allOrders.sort((a, b) => (b.order.createdAt || "").localeCompare(a.order.createdAt || ""));
  } catch {
    console.warn("[Orders] Failed to load all — check Firebase RTDB rules");
    return [];
  }
}

export async function updateOrderStatus(
  uid: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await update(ref(db, `orders/${uid}/${orderId}`), {
    status,
    updatedAt: new Date().toISOString(),
  });
}
