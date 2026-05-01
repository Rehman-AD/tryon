"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  photoBase64: string | null;
  fullBodyBase64: string | null;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: "user",
  isAdmin: false,
  userProfile: null,
  photoBase64: null,
  fullBodyBase64: null,
  logout: async () => {},
  getToken: async () => null,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [fullBodyBase64, setFullBodyBase64] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("user");

  const loadProfile = async (uid: string) => {
    try {
      const snapshot = await get(ref(db, `users/${uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const profile: UserProfile = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
          role: data.role || "user",
          photoBase64: data.photoBase64 || "",
          fullBodyBase64: data.fullBodyBase64 || "",
          bodyType: data.bodyType || "",
          skinTone: data.skinTone || "",
          skinToneHex: data.skinToneHex || "",
          faceShape: data.faceShape || "",
          preferences: data.preferences || {},
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
        };
        setUserProfile(profile);
        setPhotoBase64(data.photoBase64 || null);
        setFullBodyBase64(data.fullBodyBase64 || null);
        setRole(data.role || "user");
      }
    } catch {
      // Profile load failed silently
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadProfile(user.uid);
      } else {
        setUserProfile(null);
        setPhotoBase64(null);
        setFullBodyBase64(null);
        setRole("user");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setPhotoBase64(null);
    setFullBodyBase64(null);
    setRole("user");
    window.location.href = "/";
  };

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isAdmin: role === "admin",
        userProfile,
        photoBase64,
        fullBodyBase64,
        logout,
        getToken,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
