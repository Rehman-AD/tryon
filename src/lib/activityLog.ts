/**
 * Client-side activity logger — writes user actions to Firebase RTDB.
 * Path: activity/{uid}/{timestamp}
 */
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";

export type ActivityType =
  | "login"
  | "signup"
  | "logout"
  | "image_upload"
  | "image_capture"
  | "analysis_start"
  | "analysis_complete"
  | "analysis_error"
  | "tryon_upload"
  | "tryon_garment_select"
  | "chat_message"
  | "voice_input"
  | "profile_update"
  | "avatar_upload";

export async function logActivity(
  uid: string,
  type: ActivityType,
  details?: Record<string, unknown>
) {
  try {
    const activityRef = ref(db, `activity/${uid}`);
    await push(activityRef, {
      type,
      timestamp: new Date().toISOString(),
      ...details,
    });
  } catch {
    // Activity logging should never break the app
    console.warn("[ActivityLog] Failed to log:", type);
  }
}
