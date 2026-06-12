"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  tier: string;
  isBot: boolean;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
  refreshUsers: () => Promise<void>;
  globalLang: string;
  setGlobalLang: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [globalLang, setGlobalLang] = useState<string>("en");

  const refreshUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // Load saved mock user from local storage
        const saved = localStorage.getItem("mock_user_id");
        if (saved) {
          const found = data.find((u: User) => u.id === saved);
          if (found) {
            setCurrentUserState(found);
            return;
          }
        }
        
        // Default to a non-bot user if available, otherwise any user
        const defaultUser = data.find((u: User) => !u.isBot) || data[0];
        if (defaultUser) {
          setCurrentUserState(defaultUser);
          localStorage.setItem("mock_user_id", defaultUser.id);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem("mock_user_id", user.id);
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
