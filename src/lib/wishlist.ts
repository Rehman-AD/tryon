import { ref, get, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";

export async function getWishlist(uid: string): Promise<string[]> {
  try {
    const snapshot = await get(ref(db, `wishlist/${uid}`));
    if (!snapshot.exists()) return [];
    return Object.keys(snapshot.val());
  } catch {
    console.warn("[Wishlist] Failed to load — check Firebase RTDB rules");
    return [];
  }
}

export async function isInWishlist(uid: string, productId: string): Promise<boolean> {
  try {
    const snapshot = await get(ref(db, `wishlist/${uid}/${productId}`));
    return snapshot.exists();
  } catch {
    return false;
  }
}

export async function toggleWishlist(uid: string, productId: string): Promise<boolean> {
  try {
    const itemRef = ref(db, `wishlist/${uid}/${productId}`);
    const snapshot = await get(itemRef);
    if (snapshot.exists()) {
      await remove(itemRef);
      return false;
    } else {
      await set(itemRef, true);
      return true;
    }
  } catch {
    console.warn("[Wishlist] Toggle failed — check Firebase RTDB rules");
    return false;
  }
}
