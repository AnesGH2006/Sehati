import { createContext, useContext, useState, type ReactNode } from "react";

export interface ArtisanSession {
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

export interface CustomerSession {
  id: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  artisan: ArtisanSession | null;
  customer: CustomerSession | null;
  loginArtisan: (a: ArtisanSession) => void;
  loginCustomer: (c: CustomerSession) => void;
  logout: () => void;
  isArtisan: boolean;
  isCustomer: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  artisan: null,
  customer: null,
  loginArtisan: () => {},
  loginCustomer: () => {},
  logout: () => {},
  isArtisan: false,
  isCustomer: false,
  isLoggedIn: false,
});

function loadFromStorage<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [artisan, setArtisan] = useState<ArtisanSession | null>(() => loadFromStorage("herfati_artisan"));
  const [customer, setCustomer] = useState<CustomerSession | null>(() => loadFromStorage("herfati_customer"));

  const loginArtisan = (data: ArtisanSession) => {
    setArtisan(data);
    setCustomer(null);
    localStorage.setItem("herfati_artisan", JSON.stringify(data));
    localStorage.removeItem("herfati_customer");
  };

  const loginCustomer = (data: CustomerSession) => {
    setCustomer(data);
    setArtisan(null);
    localStorage.setItem("herfati_customer", JSON.stringify(data));
    localStorage.removeItem("herfati_artisan");
  };

  const logout = () => {
    setArtisan(null);
    setCustomer(null);
    localStorage.removeItem("herfati_artisan");
    localStorage.removeItem("herfati_customer");
  };

  return (
    <AuthContext.Provider value={{
      artisan,
      customer,
      loginArtisan,
      loginCustomer,
      logout,
      isArtisan: !!artisan,
      isCustomer: !!customer,
      isLoggedIn: !!(artisan || customer),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
