// GlamVerse type definitions

// ============ AI Analysis Types ============

export interface FaceAnalysisResult {
  face_detected: boolean;
  face_bbox: number[];
  confidence: number;
  face_shape: string;
  landmarks_count: number;
  skin_tone: string;
  skin_tone_hex: string;
}

export interface BodyAnalysisResult {
  body_type: string;
  confidence: number;
  measurements: {
    shoulder_width: number;
    hip_width: number;
    waist_width: number;
    shoulder_to_hip_ratio: number;
    waist_to_hip_ratio: number;
  };
}

export interface Recommendations {
  color_palette: string[];
  colors_to_avoid: string[];
  outfit_styles: string[];
  neckline_suggestions: string[];
  accessory_suggestions: string[];
  occasion_items: string[];
  weather_additions: string[];
  weather_removals: string[];
  budget_tier: string;
}

export interface FullAnalysisResult {
  analysis: {
    face_shape: string;
    skin_tone: string;
    body_type: string;
  };
  recommendations: Recommendations;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface UserPreferences {
  occasion: string;
  weather: string;
  budget: string;
}

// ============ Auth & RBAC ============

export type UserRole = "user" | "admin";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  role: UserRole;
  photoBase64?: string;
  fullBodyBase64?: string;
  bodyType?: string;
  skinTone?: string;
  skinToneHex?: string;
  faceShape?: string;
  preferences?: StylePreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface StylePreferences {
  stylePreference?: string[];
  colorPreference?: string[];
  sizePreference?: string;
}

// ============ E-Commerce ============

export type ProductCategory = "dress" | "top" | "bottom" | "accessory";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  price: number;
  currency: string;
  sizes: string[];
  colors: string[];
  tags?: string[];
  imageThumbnail: string;
  imageMedium: string;
  stock: number;
  featured: boolean;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
  addedAt: string;
  // Populated from product lookup
  product?: Product;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  imageThumbnail?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  phone: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt?: string;
}

// ============ Virtual Try-On ============

export interface TryOnResult {
  id: string;
  productId: string;
  resultBase64: string;
  description?: string;
  createdAt: string;
}
