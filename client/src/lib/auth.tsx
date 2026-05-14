import { createContext, useContext, useState, type ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DoctorSession {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  wilaya: string;
  daira: string;
  subscriptionType: string;
  imageUrl: string;
}

export interface PatientSession {
  id: string;
  name: string;
  phone: string;
}

// توافق مع الكود القديم
export type ArtisanSession  = DoctorSession;
export type CustomerSession = PatientSession;

interface AuthContextType {
  // جديد
  doctor:       DoctorSession  | null;
  patient:      PatientSession | null;
  loginDoctor:  (d: DoctorSession)  => void;
  loginPatient: (p: PatientSession) => void;
  isDoctor:     boolean;
  isPatient:    boolean;

  // قديم — للتوافق مع المكونات التي لم تُحوَّل بعد
  artisan:      DoctorSession  | null;
  customer:     PatientSession | null;
  loginArtisan: (a: DoctorSession)  => void;
  loginCustomer:(c: PatientSession) => void;
  isArtisan:    boolean;
  isCustomer:   boolean;

  ensureGuest: () => PatientSession;
  logout:      () => void;
  isLoggedIn:  boolean;
  isGuest:     boolean;
}

const AuthContext = createContext<AuthContextType>({
  doctor: null, patient: null,
  loginDoctor: () => {}, loginPatient: () => {},
  isDoctor: false, isPatient: false,
  artisan: null, customer: null,
  loginArtisan: () => {}, loginCustomer: () => {},
  isArtisan: false, isCustomer: false,
  ensureGuest: () => ({ id: "guest", name: "زائر", phone: "" }),
  logout: () => {},
  isLoggedIn: false, isGuest: false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function load<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

function makeGuestId(): string {
  return `guest-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [doctor,  setDoctor]  = useState<DoctorSession  | null>(() =>
    load("tabib_doctor") || load("herfati_artisan")
  );
  const [patient, setPatient] = useState<PatientSession | null>(() =>
    load("tabib_patient") || load("herfati_customer")
  );

  const loginDoctor = (data: DoctorSession) => {
    setDoctor(data); setPatient(null);
    localStorage.setItem("tabib_doctor", JSON.stringify(data));
    localStorage.removeItem("tabib_patient");
    localStorage.removeItem("herfati_artisan");
    localStorage.removeItem("herfati_customer");
  };

  const loginPatient = (data: PatientSession) => {
    setPatient(data); setDoctor(null);
    localStorage.setItem("tabib_patient", JSON.stringify(data));
    localStorage.removeItem("tabib_doctor");
    localStorage.removeItem("herfati_artisan");
    localStorage.removeItem("herfati_customer");
  };

  const ensureGuest = (): PatientSession => {
    if (patient) return patient;
    if (doctor) return { id: `doctor-${doctor.id}`, name: doctor.name, phone: doctor.phone };
    let id = localStorage.getItem("tabib_guest_id");
    if (!id) { id = makeGuestId(); localStorage.setItem("tabib_guest_id", id); }
    const guest: PatientSession = { id, name: "زائر", phone: "" };
    setPatient(guest);
    localStorage.setItem("tabib_patient", JSON.stringify(guest));
    return guest;
  };

  const logout = () => {
    setDoctor(null); setPatient(null);
    ["tabib_doctor","tabib_patient","tabib_guest_id",
     "herfati_artisan","herfati_customer","herfati_guest_id"].forEach(k => localStorage.removeItem(k));
  };

  const isGuest   = !!patient && patient.id.startsWith("guest-");
  const isLoggedIn = !!(doctor || patient) && !isGuest;

  const value: AuthContextType = {
    // جديد
    doctor, patient, loginDoctor, loginPatient,
    isDoctor: !!doctor, isPatient: !!patient && !isGuest,

    // قديم — aliases للتوافق
    artisan:      doctor,
    customer:     patient,
    loginArtisan: loginDoctor,
    loginCustomer: loginPatient,
    isArtisan:    !!doctor,
    isCustomer:   !!patient && !isGuest,

    ensureGuest, logout, isLoggedIn, isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}