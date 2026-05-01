import { ref, get, set, update, push, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Product } from "@/types";

const PRODUCTS_REF = "products";

export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await get(ref(db, PRODUCTS_REF));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data)
      .map(([id, val]) => ({ id, ...(val as Omit<Product, "id">) }))
      .filter((p) => p.active !== false)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch {
    console.warn("[Products] Failed to load — check Firebase RTDB rules");
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const snapshot = await get(ref(db, PRODUCTS_REF));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.entries(data)
      .map(([id, val]) => ({ id, ...(val as Omit<Product, "id">) }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch {
    console.warn("[Products] Failed to load all — check Firebase RTDB rules");
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const snapshot = await get(ref(db, `${PRODUCTS_REF}/${id}`));
    if (!snapshot.exists()) return null;
    return { id, ...snapshot.val() };
  } catch {
    console.warn("[Products] Failed to load product — check Firebase RTDB rules");
    return null;
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const q = query(ref(db, PRODUCTS_REF), orderByChild("category"), equalTo(category));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data)
    .map(([id, val]) => ({ id, ...(val as Omit<Product, "id">) }))
    .filter((p) => p.active !== false);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.featured);
}

export async function createProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  adminUid: string
): Promise<string> {
  const newRef = push(ref(db, PRODUCTS_REF));
  const id = newRef.key!;
  await set(newRef, {
    ...product,
    createdBy: adminUid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await update(ref(db, `${PRODUCTS_REF}/${id}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await update(ref(db, `${PRODUCTS_REF}/${id}`), { active: false, updatedAt: new Date().toISOString() });
}

export async function decrementStock(productId: string, quantity: number): Promise<void> {
  const stockRef = ref(db, `${PRODUCTS_REF}/${productId}/stock`);
  const snapshot = await get(stockRef);
  const current = typeof snapshot.val() === "number" ? snapshot.val() : 0;
  const newStock = Math.max(0, current - quantity);
  await update(ref(db, `${PRODUCTS_REF}/${productId}`), {
    stock: newStock,
    updatedAt: new Date().toISOString(),
  });
}
