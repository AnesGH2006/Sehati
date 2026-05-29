import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Check, Mail, User, Briefcase, Phone, Clock,
  Star, Sparkles, Stethoscope, MapPin, Navigation,
  Calendar,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DAIRAS, SPECIALTIES, LOCATIONS } from "@/lib/constants";

// ── أيام الأسبوع ──────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { id: "السبت",    label: "سبت" },
  { id: "الأحد",    label: "أحد" },
  { id: "الاثنين",  label: "اثنين" },
  { id: "الثلاثاء", label: "ثلاثاء" },
  { id: "الأربعاء", label: "أربعاء" },
  { id: "الخميس",  label: "خميس" },
  { id: "الجمعة",  label: "جمعة" },
];

// ── تعريف الخطط ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    nameAr: "مجاني",
    price: 0,
    icon: Star,
    tag: null,
    color: "#71717a",
    isDisabled: false,
    glow: "rgba(113,113,122,0.3)",
    gradient: "linear-gradient(145deg, #27272a 0%, #1c1c1f 100%)",
    btnGradient: "linear-gradient(135deg, #3f3f46, #27272a)",
    features: [
      "ملف طبي احترافي",
      "عرض التخصص والعيادة",
      "تواصل مباشر مع المرضى",
      "ظهور عادي في البحث",
      "مجاني للأبد",
    ],
  },
  {
    id: "gold",
    nameAr: "ذهبي",
    price: 10000,
    icon: Sparkles,
    tag: "الأفضل",
    color: "#fbbf24",
    isDisabled: false,
    glow: "rgba(251,191,36,0.35)",
    gradient: "linear-gradient(145deg, #1f1400 0%, #170f00 100%)",
    btnGradient: "linear-gradient(135deg, #b45309, #d97706)",
    features: [
      "كل مزايا المجاني",
      "أعلى ظهور في البحث",
      "شارة ذهبية مميزة",
      "صفحة التحليلات الكاملة",
      "الأولوية القصوى في ولايتك",
      "دعم مخصص على واتساب",
      "إدارة المواعيد المتقدمة",
    ],
  },
];

export default function Subscription() {
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { loginDoctor } = useAuth();
  const [done, setDone] = useState(false);
  const isRtl = i18n.language === "ar";

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create doctor");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setDone(true);
      loginDoctor({
        id: data.id, name: data.name, email: data.email,
        phone: data.phone, specialty: data.specialty,
        wilaya: data.wilaya, daira: data.daira,
        subscriptionType: data.subscriptionType, imageUrl: data.imageUrl,
      });
      toast({ title: "تم التسجيل بنجاح! 🎉", description: "جاري التوجيه للوحة التحكم..." });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setTimeout(() => setLocation("/doctor/dashboard"), 1500);
    },
    onError: (e: Error) =>
      toast({ title: "فشل التسجيل", description: e.message, variant: "destructive" }),
  });

  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <p className="text-zinc-400 font-medium">جاري التوجيه للوحة التحكم...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a] text-white" dir="rtl">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-900/20 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 relative z-10 py-16 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/8 bg-white/3 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-5">
              <Stethoscope className="h-3 w-3" /> اختر خطتك
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-4">
              انضم إلى صحتي
            </h1>
            <p className="text-zinc-500 text-lg">ابدأ مجاناً أو اختر الخطة الذهبية</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isFeatured = !!plan.tag;

              return (
                <div key={plan.id} className="relative group">
                  {plan.tag && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{
                        background: plan.btnGradient,
                        color: "#fff",
                        boxShadow: `0 0 16px ${plan.glow}`
                      }}
                    >
                      {plan.tag}
                    </div>
                  )}

                  <div
                    className="relative rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1"
                    style={{
                      background: plan.gradient,
                      border: `1px solid ${plan.color}22`,
                      boxShadow: isFeatured ? `0 0 40px ${plan.glow}` : "none",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${plan.glow} 0%, transparent 70%)` }}
                    />

                    <div className="p-6 pb-4 relative">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: plan.color }} />
                      </div>

                      <p className="text-lg font-black text-white mb-1">{plan.nameAr}</p>

                      {plan.price === 0 ? (
                        <div>
                          <span className="text-3xl font-black" style={{ color: plan.color }}>مجاني</span>
                          <span className="text-xs text-zinc-500 block mt-0.5">للأبد بدون شرط</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black" style={{ color: plan.color }}>
                            {plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm font-bold text-zinc-500">دج</span>
                          <span className="text-xs text-zinc-600">/ شهر</span>
                        </div>
                      )}
                    </div>

                    <div className="mx-5 h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}30, transparent)` }} />

                    <div className="p-5 flex-1 space-y-2.5">
                      {plan.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2.5">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${plan.color}18` }}
                          >
                            <Check className="h-2.5 w-2.5" style={{ color: plan.color }} />
                          </div>
                          <span className="text-xs text-zinc-300 leading-relaxed">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 pt-0">
                      <RegisterDialog plan={plan} registerMutation={registerMutation} isRtl={isRtl} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-white/6" style={{ background: "rgba(255,255,255,0.018)" }}>
            <div className="p-5 border-b border-white/6">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">مقارنة الخطط</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-right py-3 px-5 text-zinc-600 font-medium w-1/2">الميزة</th>
                    <th className="py-3 px-4 text-center font-black" style={{ color: "#71717a" }}>مجاني</th>
                    <th className="py-3 px-4 text-center font-black" style={{ color: "#fbbf24" }}>ذهبي</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "الظهور في البحث",   vals: ["عادي", "الأعلى"] },
                    { label: "صفحة التحليلات",     vals: [false, true] },
                    { label: "شارة مميزة",          vals: [false, "ذهبية"] },
                    { label: "إدارة المواعيد",      vals: [true, true] },
                    { label: "دعم واتساب",          vals: [false, true] },
                    { label: "جدول مواعيد متقدم",  vals: [false, true] },
                  ].map((row, ri) => (
                    <tr key={ri} className="border-b border-white/4 last:border-0 hover:bg-white/[0.012] transition-colors">
                      <td className="py-3 px-5 text-zinc-400">{row.label}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} className="py-3 px-4 text-center">
                          {v === true
                            ? <span className="text-green-400 font-bold">✓</span>
                            : v === false
                            ? <span className="text-zinc-700">—</span>
                            : <span className="font-bold" style={{ color: vi === 0 ? "#71717a" : "#fbbf24" }}>{v}</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Registration Dialog ───────────────────────────────────────────────────────
function RegisterDialog({ plan, registerMutation, isRtl }: any) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", specialty: "", daira: "",
    yearsOfExperience: "",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    latitude: "",
    longitude: "",
    locationName: "",
  });
  const [workingDays, setWorkingDays] = useState<string[]>(["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"]);
  const [gettingLocation, setGettingLocation] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getGpsLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "تنبيه", description: "متصفحك لا يدعم تحديد الموقع", variant: "destructive" });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGettingLocation(false);
        toast({ title: "✅ تم تحديد موقعك" });
      },
      () => {
        setGettingLocation(false);
        toast({ title: "تعذّر تحديد الموقع", description: "أدخله يدوياً", variant: "destructive" });
      },
      { timeout: 10000 }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.specialty || !wilaya || !form.daira) {
      toast({ title: "تنبيه", description: "الرجاء ملء جميع الحقول", variant: "destructive" }); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "خطأ", description: "البريد الإلكتروني غير صحيح", variant: "destructive" }); return;
    }
    registerMutation.mutate({
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      specialty: form.specialty, wilaya, daira: form.daira,
      yearsOfExperience: parseInt(form.yearsOfExperience) || 1,
      subscriptionType: plan.id,
      subscriptionDuration: 1,
      description: "طبيب محترف في منصة صحتي",
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=2DD4BF&color=fff&size=400`,
      isVerified: false,
      workingDays,
      workingHoursStart: form.workingHoursStart,
      workingHoursEnd: form.workingHoursEnd,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      locationName: form.locationName || undefined,
    });
    setOpen(false);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff",
    borderRadius: "10px",
    height: "42px",
    width: "100%",
    padding: "0 36px 0 10px",
    fontSize: "13px",
    outline: "none",
  };

  const selectTriggerStyle = "h-[42px] rounded-[10px] text-[13px] text-white bg-white/[0.04] border-white/[0.09]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full h-11 rounded-xl text-sm font-black transition-all duration-200 hover:opacity-90 active:scale-[0.97] relative overflow-hidden"
          style={{ background: plan.btnGradient, color: "#fff", boxShadow: `0 4px 24px ${plan.glow}` }}
        >
          {plan.price === 0 ? "سجّل مجاناً" : `اختر ${plan.nameAr}`}
        </button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-white/10"
        style={{ background: "#0d0d10", borderRadius: "20px" }}
        dir="rtl"
      >
        <div
          className="p-6 pb-5"
          style={{ background: `linear-gradient(135deg, ${plan.color}12 0%, transparent 70%)`, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}28` }}>
              <plan.icon className="h-4 w-4" style={{ color: plan.color }} />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-white leading-none">خطة {plan.nameAr}</DialogTitle>
              <p className="text-xs mt-0.5" style={{ color: plan.color }}>
                {plan.price === 0 ? "مجاني للأبد" : `${plan.price.toLocaleString()} دج / شهر`}
              </p>
            </div>
          </div>
          <DialogDescription className="text-zinc-500 text-xs mt-2">
            أدخل بياناتك لبدء رحلتك مع صحتي
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-2 gap-3">
            <FLabel label="الاسم الكامل">
              <div className="relative">
                <User className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <input style={inputStyle} placeholder="د. محمد علي" value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
            </FLabel>
            <FLabel label="البريد الإلكتروني">
              <div className="relative">
                <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <input style={inputStyle} type="email" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </FLabel>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FLabel label="رقم الهاتف">
              <div className="relative">
                <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <input style={inputStyle} type="tel" placeholder="06XXXXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
            </FLabel>
            <FLabel label="سنوات الخبرة">
              <div className="relative">
                <Briefcase className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <input style={inputStyle} type="number" placeholder="5" value={form.yearsOfExperience} onChange={e => set("yearsOfExperience", e.target.value)} />
              </div>
            </FLabel>
          </div>

          <FLabel label="التخصص الطبي">
            <Select value={form.specialty} onValueChange={v => set("specialty", v)} dir="rtl">
              <SelectTrigger className={selectTriggerStyle}><SelectValue placeholder="اختر تخصصك" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60 overflow-y-auto">
                {SPECIALTIES.map(s => <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FLabel>

          <div className="grid grid-cols-2 gap-3">
            <FLabel label="الولاية">
              <Select value={wilaya || ""} onValueChange={v => { setWilaya(v); set("daira", (LOCATIONS as any)[v]?.[0] || ""); }} dir="rtl">
                <SelectTrigger className={selectTriggerStyle}><SelectValue placeholder="الولاية" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60 overflow-y-auto">
                  {DAIRAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </FLabel>
            <FLabel label="الدائرة">
              <Select value={form.daira} onValueChange={v => set("daira", v)} disabled={!wilaya} dir="rtl">
                <SelectTrigger className={selectTriggerStyle}><SelectValue placeholder="الدائرة" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60 overflow-y-auto">
                  {wilaya && (LOCATIONS as any)[wilaya]?.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </FLabel>
          </div>

          {/* جدول العمل */}
          <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">جدول أوقات العمل</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: workingDays.includes(day.id) ? `${plan.color}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${workingDays.includes(day.id) ? plan.color + "55" : "rgba(255,255,255,0.08)"}`,
                    color: workingDays.includes(day.id) ? plan.color : "#71717a",
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FLabel label="من الساعة">
                <input
                  type="time"
                  value={form.workingHoursStart}
                  onChange={e => set("workingHoursStart", e.target.value)}
                  style={{ ...inputStyle, padding: "0 10px", colorScheme: "dark" }}
                />
              </FLabel>
              <FLabel label="إلى الساعة">
                <input
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={e => set("workingHoursEnd", e.target.value)}
                  style={{ ...inputStyle, padding: "0 10px", colorScheme: "dark" }}
                />
              </FLabel>
            </div>
          </div>

          {/* الموقع الجغرافي */}
          <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">موقع العيادة (اختياري)</span>
              </div>
              <button
                type="button"
                onClick={getGpsLocation}
                disabled={gettingLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <Navigation className="h-3 w-3" />
                {gettingLocation ? "جاري التحديد..." : "تحديد GPS"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FLabel label="خط العرض">
                <input
                  style={inputStyle}
                  placeholder="36.123456"
                  value={form.latitude}
                  onChange={e => set("latitude", e.target.value)}
                  type="number"
                  step="any"
                />
              </FLabel>
              <FLabel label="خط الطول">
                <input
                  style={inputStyle}
                  placeholder="2.123456"
                  value={form.longitude}
                  onChange={e => set("longitude", e.target.value)}
                  type="number"
                  step="any"
                />
              </FLabel>
            </div>

            <FLabel label="اسم العنوان (اختياري)">
              <input
                style={inputStyle}
                placeholder="مثال: عيادة النور، شارع باستور"
                value={form.locationName}
                onChange={e => set("locationName", e.target.value)}
              />
            </FLabel>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full h-11 rounded-xl font-black text-sm mt-1 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: plan.btnGradient, color: "#fff", boxShadow: `0 4px 20px ${plan.glow}` }}
          >
            {registerMutation.isPending ? "جاري التسجيل..." : "إنشاء الحساب"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
