import { ref, get, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import type { CartItem, Product } from "@/types";

function cartRef(uid: string) {
  return ref(db, `cart/${uid}`);
}

function cartItemRef(uid: string, productId: string) {
  return ref(db, `cart/${uid}/${productId}`);
}

export async function getCart(uid: string): Promise<CartItem[]> {
  try {
    const snapshot = await get(cartRef(uid));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data).map(([productId, val]) => ({
      productId,
      ...(val as Omit<CartItem, "productId">),
    }));
  } catch {
    console.warn("[Cart] Failed to load cart — check Firebase RTDB rules");
    return [];
  }
}

export async function addToCart(
  uid: string,
  productId: string,
  size: string,
  color: string
): Promise<void> {
  const existing = await get(cartItemRef(uid, productId));
  if (existing.exists()) {
    const current = existing.val();
    await update(cartItemRef(uid, productId), {
      quantity: (current.quantity || 1) + 1,
    });
  } else {
    await set(cartItemRef(uid, productId), {
      quantity: 1,
      size,
      color,
      addedAt: new Date().toISOString(),
    });
  }
}

export async function updateCartQuantity(
  uid: string,
  productId: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await removeFromCart(uid, productId);
    return;
  }
  await update(cartItemRef(uid, productId), { quantity });
}

export async function removeFromCart(uid: string, productId: string): Promise<void> {
  await remove(cartItemRef(uid, productId));
}

export async function clearCart(uid: string): Promise<void> {
  await remove(cartRef(uid));
}

export function calculateTotal(items: CartItem[], products: Product[]): number {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + product.price * item.quantity;
  }, 0);
}
