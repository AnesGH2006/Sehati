import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface ArtisanSession {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  wilaya: string;
  daira: string;
  subscriptionType: string;
  imageUrl: string;
}

interface AuthContextType {
  artisan: ArtisanSession | null;
  login: (artisan: ArtisanSession) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  artisan: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [artisan, setArtisan] = useState<ArtisanSession | null>(() => {
    try {
      const stored = localStorage.getItem("herfati_artisan");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (data: ArtisanSession) => {
    setArtisan(data);
    localStorage.setItem("herfati_artisan", JSON.stringify(data));
  };

  const logout = () => {
    setArtisan(null);
    localStorage.removeItem("herfati_artisan");
  };

  return (
    <AuthContext.Provider value={{ artisan, login, logout, isLoggedIn: !!artisan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
