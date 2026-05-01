/**
 * Seed Products — Fetches images from /public/products/, converts to Base64 via fetch+canvas,
 * and stores in Firebase RTDB. Also auto-sets calling user as admin.
 */

import { ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase";

// ─── Image Helpers ───────────────────────────────────────────────────

async function fetchImageAsBase64(url: string, targetWidth: number, quality: number): Promise<string> {
  // Fetch as blob, then draw on canvas for compression
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = targetWidth / img.width;
      canvas.width = targetWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error(`Failed to process: ${url}`));
    };
    img.src = URL.createObjectURL(blob);
  });
}

// ─── Product Catalog ─────────────────────────────────────────────────

const CATALOG = [
  { id: "p1", name: "Midnight Velvet Dress", desc: "Luxurious velvet evening dress with a flattering silhouette. Perfect for formal events and galas.", category: "dress", sub: "Evening", price: 4500, sizes: ["S", "M", "L"], colors: ["Black", "Navy"], tags: ["evening", "party", "elegant", "velvet"], featured: true, img: "/products/dress1.jpg" },
  { id: "p2", name: "Coral Summer Maxi", desc: "Flowing maxi dress in vibrant coral. Lightweight fabric ideal for summer days and beach outings.", category: "dress", sub: "Maxi", price: 3200, sizes: ["XS", "S", "M", "L"], colors: ["Coral", "Pink"], tags: ["summer", "casual", "floral", "maxi"], featured: true, img: "/products/dress2.jpg" },
  { id: "p3", name: "Floral Wrap Dress", desc: "Classic wrap dress with delicate floral print. Adjustable waist tie for a customized fit.", category: "dress", sub: "Wrap", price: 3800, sizes: ["S", "M", "L"], colors: ["Peach", "Floral"], tags: ["casual", "brunch", "spring", "wrap"], featured: false, img: "/products/dress3.jpg" },
  { id: "p4", name: "Sage Evening Gown", desc: "Elegant sage-toned evening gown with structured bodice. Ideal for weddings and formal events.", category: "dress", sub: "Gown", price: 6500, sizes: ["S", "M", "L", "XL"], colors: ["Sage", "Olive"], tags: ["formal", "wedding", "gown", "elegant"], featured: true, img: "/products/dress4.jpg" },
  { id: "p5", name: "Emerald Silk Blouse", desc: "Premium silk blouse in rich emerald green. Soft drape with a relaxed fit for office or casual.", category: "top", sub: "Blouse", price: 2800, sizes: ["S", "M", "L", "XL"], colors: ["Emerald", "Forest Green"], tags: ["formal", "office", "silk", "blouse"], featured: true, img: "/products/top1.jpg" },
  { id: "p6", name: "Classic White Shirt", desc: "Timeless white button-down shirt in breathable cotton. A wardrobe essential for any occasion.", category: "top", sub: "Shirt", price: 1800, sizes: ["S", "M", "L", "XL", "XXL"], colors: ["White", "Off-White"], tags: ["casual", "business", "classic", "cotton"], featured: false, img: "/products/top2.jpg" },
  { id: "p7", name: "Navy Blazer", desc: "Tailored navy blazer with structured shoulders and modern slim fit. Elevates any outfit instantly.", category: "top", sub: "Blazer", price: 5500, sizes: ["S", "M", "L", "XL"], colors: ["Navy", "Dark Blue"], tags: ["business", "formal", "winter", "blazer"], featured: true, img: "/products/top3.jpg" },
  { id: "p8", name: "Striped Casual Shirt", desc: "Relaxed-fit striped shirt in soft cotton. Perfect for weekends and casual layering.", category: "top", sub: "Shirt", price: 2200, sizes: ["M", "L", "XL"], colors: ["Blue Stripe", "White"], tags: ["casual", "summer", "relaxed", "stripe"], featured: false, img: "/products/top4.jpg" },
  { id: "p9", name: "Dark Denim Jeans", desc: "Premium dark wash denim with modern straight-leg cut. Comfortable stretch with classic styling.", category: "bottom", sub: "Jeans", price: 2500, sizes: ["S", "M", "L", "XL"], colors: ["Dark Blue", "Indigo"], tags: ["casual", "denim", "everyday", "jeans"], featured: false, img: "/products/bottom1.jpg" },
  { id: "p10", name: "Beige Palazzo Pants", desc: "Flowy palazzo pants in warm beige. High-waisted with wide leg for comfort and elegance.", category: "bottom", sub: "Palazzo", price: 2200, sizes: ["S", "M", "L"], colors: ["Beige", "Tan"], tags: ["formal", "summer", "elegant", "palazzo"], featured: true, img: "/products/bottom2.jpg" },
  { id: "p11", name: "Statement Gold Necklace", desc: "Bold gold-plated statement necklace with intricate chain design. Adds instant glamour.", category: "accessory", sub: "Jewelry", price: 1500, sizes: ["One Size"], colors: ["Gold"], tags: ["jewelry", "party", "statement", "gold"], featured: false, img: "/products/accessory1.jpg" },
  { id: "p12", name: "Leather Crossbody Bag", desc: "Genuine leather crossbody bag with adjustable strap. Multiple compartments for organized storage.", category: "accessory", sub: "Bag", price: 3500, sizes: ["One Size"], colors: ["Brown", "Tan"], tags: ["bag", "casual", "leather", "crossbody"], featured: true, img: "/products/accessory2.jpg" },
];

// ─── Seed Function ───────────────────────────────────────────────────

export async function seedDummyProducts(adminUid: string): Promise<number> {
  // Auto-set user as admin so they can manage products
  try {
    await update(ref(db, `users/${adminUid}`), { role: "admin" });
    console.log("[Seed] Admin role set for:", adminUid);
  } catch (err) {
    console.warn("[Seed] Could not set admin role:", err);
  }

  let count = 0;
  for (const p of CATALOG) {
    try {
      const [thumbnail, medium] = await Promise.all([
        fetchImageAsBase64(p.img, 150, 0.7),
        fetchImageAsBase64(p.img, 400, 0.8),
      ]);

      await set(ref(db, `products/${p.id}`), {
        name: p.name,
        description: p.desc,
        category: p.category,
        subcategory: p.sub,
        price: p.price,
        currency: "PKR",
        sizes: p.sizes,
        colors: p.colors,
        tags: p.tags,
        imageThumbnail: thumbnail,
        imageMedium: medium,
        stock: Math.floor(Math.random() * 50) + 10,
        featured: p.featured,
        active: true,
        createdBy: adminUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      count++;
      console.log(`[Seed] ${count}/${CATALOG.length} — ${p.name}`);
    } catch (err) {
      console.error(`[Seed] Failed: ${p.name}`, err);
    }
  }

  return count;
}
