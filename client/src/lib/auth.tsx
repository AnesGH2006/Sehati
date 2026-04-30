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
  /** يُنشئ جلسة زبون-زائر (بدون تسجيل) إذا لم تكن موجودة، ويُعيدها. */
  ensureGuest: () => CustomerSession;
  logout: () => void;
  isArtisan: boolean;
  isCustomer: boolean;
  isLoggedIn: boolean;
  /** صحيح إذا كان الزبون الحالي عبارة عن جلسة زائر تلقائية. */
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  artisan: null,
  customer: null,
  loginArtisan: () => {},
  loginCustomer: () => {},
  ensureGuest: () => ({ id: "guest", name: "زائر", phone: "" }),
  logout: () => {},
  isArtisan: false,
  isCustomer: false,
  isLoggedIn: false,
  isGuest: false,
});

function loadFromStorage<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

function makeGuestId(): string {
  const rnd = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  return `guest-${rnd}`;
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

  const ensureGuest = (): CustomerSession => {
    if (customer) return customer;
    if (artisan) {
      // الحرفي مسجَّل أصلاً — لا تنشئ زائرًا. نُعيد كائن وهمي.
      return { id: `artisan-${artisan.id}`, name: artisan.name, phone: artisan.phone };
    }
    let id = localStorage.getItem("herfati_guest_id");
    if (!id) {
      id = makeGuestId();
      localStorage.setItem("herfati_guest_id", id);
    }
    const guest: CustomerSession = { id, name: "زائر", phone: "" };
    setCustomer(guest);
    localStorage.setItem("herfati_customer", JSON.stringify(guest));
    return guest;
  };

  const logout = () => {
    setArtisan(null);
    setCustomer(null);
    localStorage.removeItem("herfati_artisan");
    localStorage.removeItem("herfati_customer");
    localStorage.removeItem("herfati_guest_id");
  };

  const isGuest = !!customer && customer.id.startsWith("guest-");

  return (
    <AuthContext.Provider value={{
      artisan,
      customer,
      loginArtisan,
      loginCustomer,
      ensureGuest,
      logout,
      isArtisan: !!artisan,
      isCustomer: !!customer && !isGuest,
      isLoggedIn: !!(artisan || (customer && !isGuest)),
      isGuest,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
