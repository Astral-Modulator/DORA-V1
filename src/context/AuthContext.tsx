import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "github" | "email";
  verified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithEmail: (email: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "dora_user_session_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read user session from storage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUser = (profile: UserProfile | null) => {
    setUser(profile);
    try {
      if (profile) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist user session:", e);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    // Simulating OAuth verification latency
    await new Promise((resolve) => setTimeout(resolve, 600));
    const googleUser: UserProfile = {
      id: "usr_google_" + Math.random().toString(36).substring(2, 9),
      email: "researcher@gmail.com",
      name: "Google Researcher",
      provider: "google",
      verified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces&auto=format&q=80",
    };
    persistUser(googleUser);
    setIsLoading(false);
  };

  const loginWithGithub = async () => {
    setIsLoading(true);
    // Simulating OAuth verification latency
    await new Promise((resolve) => setTimeout(resolve, 600));
    const githubUser: UserProfile = {
      id: "usr_gh_" + Math.random().toString(36).substring(2, 9),
      email: "developer@github.com",
      name: "GitHub Developer",
      provider: "github",
      verified: true,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=faces&auto=format&q=80",
    };
    persistUser(githubUser);
    setIsLoading(false);
  };

  const loginWithEmail = async (email: string, name?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const emailUser: UserProfile = {
      id: "usr_email_" + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split("@")[0] || "Researcher",
      provider: "email",
      verified: true,
    };
    persistUser(emailUser);
    setIsLoading(false);
  };

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
