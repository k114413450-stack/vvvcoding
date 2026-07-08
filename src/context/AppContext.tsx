"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  tier: string;
  isBot: boolean;
  email?: string;
  vipTier?: string; // "FREE" | "VIP"
  vipExpiresAt?: string | null;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
  refreshUsers: () => Promise<void>;
  globalLang: string;
  setGlobalLang: (lang: string) => void;
  isRealUser: boolean;
  logIn: (user: User) => void;
  logOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isRealUser, setIsRealUser] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [globalLang, setGlobalLang] = useState<string>("en");

  // 刷新真实账户会话
  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn && data.user) {
          setCurrentUserState(data.user);
          setIsRealUser(true);
          return true;
        }
      }
    } catch (e) {
      console.error("Session refresh failed", e);
    }
    setIsRealUser(false);
    return false;
  };

  const refreshUsers = async () => {
    // 1. 先尝试获取真实用户 Session
    const hasRealSession = await refreshSession();
    
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // 2. 如果没有真实 Session，才走 mock 游客测试逻辑
        if (!hasRealSession) {
          const saved = localStorage.getItem("mock_user_id");
          if (saved) {
            const found = data.find((u: User) => u.id === saved);
            if (found) {
              setCurrentUserState(found);
              return;
            }
          }
          
          const defaultUser = data.find((u: User) => !u.isBot) || data[0];
          if (defaultUser) {
            setCurrentUserState(defaultUser);
            localStorage.setItem("mock_user_id", defaultUser.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    setIsRealUser(false); // 切换回 mock 用户则不再标记为 real
    localStorage.setItem("mock_user_id", user.id);
  };

  const logIn = (user: User) => {
    setCurrentUserState(user);
    setIsRealUser(true);
    localStorage.removeItem("mock_user_id"); // 清除游客标识
  };

  const logOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    setIsRealUser(false);
    setCurrentUserState(null);
    refreshUsers(); // 重置回默认游客账号
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        refreshUsers,
        globalLang,
        setGlobalLang,
        isRealUser,
        logIn,
        logOut,
        refreshSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

