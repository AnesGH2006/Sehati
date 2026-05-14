// client/src/pages/emergency.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Phone, MapPin, Send, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { specialtyLabel } from "@/lib/constants";

// ─── التخصصات الطارئة ─────────────────────────────────
const EMERGENCY_SPECIALTIES = [
  { value: "general",      label: "طب عام",       icon: "🩺", desc: "حالة عامة، حمى، آلام" },
  { value: "cardiology",   label: "قلب",           icon: "❤️", desc: "ألم في الصدر، ضيق تنفس" },
  { value: "pediatrics",   label: "أطفال",         icon: "👶", desc: "طفل مريض، حمى شديدة" },
  { value: "orthopedics",  label: "عظام",          icon: "🦴", desc: "كسر، إصابة، التواء" },
  { value: "neurology",    label: "أعصاب",         icon: "🧠", desc: "صداع شديد، إغماء" },
  { value: "surgery",      label: "جراحة",         icon: "🔪", desc: "جرح، نزيف، حادث" },
];

interface EmergencyResult {
  success: boolean;
  conversationId: string;
  doctor: {
    id: number;
    name: string;
    specialty: string;
    phone: string;
    rating: number;
    distanceKm: number | null;
  };
}

export default function EmergencyPage() {
  const [, setLocation] = useLocation();
  const { customer, isLoggedIn, isDoctor, ensureGuest } = useAuth();
  const { toast } = useToast();

  const [specialty, setSpecialty]       = useState("");
  const [description, setDescription]   = useState("");
  const [result, setResult]             = useState<EmergencyResult | null>(null);
  const [userLat, setUserLat]           = useState<number | null>(null);
  const [userLng, setUserLng]           = useState<number | null>(null);
  const [locating, setLocating]         = useState(false);

  const user = customer;

  // ─── تحديد الموقع ────────────────────────────────────
  const locateUser = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      toast({ title: "❌ غير مدعوم", description: "متصفحك لا يدعم تحديد الموقع", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocating(false);
        toast({ title: "✅ تم تحديد موقعك", description: "سيتم إرسال أقرب طبيب إليك" });
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED      ? "تم رفض الإذن. فعّل خدمة الموقع في إعدادات المتصفح" :
          err.code === err.POSITION_UNAVAILABLE   ? "تعذّر الوصول للموقع. تأكد من تفعيل GPS" :
          err.code === err.TIMEOUT                ? "انتهت مهلة الاستجابة. حاول مجدداً" :
                                                    "خطأ في تحديد الموقع";
        toast({ title: "❌ تعذّر تحديد الموقع", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ─── إرسال الطلب ─────────────────────────────────────
  const { mutate: sendEmergency, isPending } = useMutation({
    mutationFn: async () => {
      const me = user || ensureGuest();
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:   me.id,
          patientName: (me as any).name || "مريض",
          specialty,
          description,
          latitude:  userLat,
          longitude: userLng,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "خطأ في الإرسال");
      }
      return res.json() as Promise<EmergencyResult>;
    },
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => {
      toast({ title: "❌ فشل الطلب", description: err.message, variant: "destructive" });
    },
  });

  const canSend = specialty && description.trim().length >= 10;

  // ─── نتيجة النجاح ────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">تم إرسال طلبك!</h2>
            <p className="text-sm text-muted-foreground">تم إشعار الطبيب وسيتواصل معك فوراً</p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-5 mb-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">الطبيب المختار</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {result.doctor.name[0]}
              </div>
              <div>
                <p className="font-bold text-foreground">د. {result.doctor.name}</p>
                <p className="text-sm text-primary">{specialtyLabel(result.doctor.specialty)}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>⭐ {result.doctor.rating.toFixed(1)}</span>
                  {result.doctor.distanceKm && <span>📍 {result.doctor.distanceKm} كم</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 gap-2 rounded-xl"
                onClick={() => setLocation(`/chat/${result.doctor.id}`)}
              >
                <MessageCircle className="h-4 w-4" />
                فتح المحادثة
              </Button>
              <a href={`tel:${result.doctor.phone}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2 rounded-xl border-primary/40 text-primary">
                  <Phone className="h-4 w-4" />
                  اتصال مباشر
                </Button>
              </a>
            </div>
          </div>

          <Button variant="ghost" className="w-full text-muted-foreground"
            onClick={() => { setResult(null); setSpecialty(""); setDescription(""); }}>
            إرسال طلب جديد
          </Button>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-lg mx-auto p-4 pt-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">طلب طبي طارئ</h1>
            <p className="text-sm text-muted-foreground">سنجد لك أقرب طبيب متاح فوراً</p>
          </div>
        </div>

        {/* الموقع */}
        <button
          type="button"
          disabled={locating}
          onClick={locateUser}
          className={`w-full rounded-xl border p-3 mb-5 flex items-center gap-3 text-right transition-all disabled:opacity-60 ${
            userLat ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/30"
          }`}>
          {locating
            ? <Loader2 className="h-5 w-5 flex-shrink-0 text-primary animate-spin" />
            : <MapPin className={`h-5 w-5 flex-shrink-0 ${userLat ? "text-primary" : "text-muted-foreground"}`} />
          }
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {locating ? "جاري تحديد موقعك..." : userLat ? "✅ تم تحديد موقعك" : "اضغط لتحديد موقعك"}
            </p>
            <p className="text-xs text-muted-foreground">
              {userLat
                ? `${userLat.toFixed(4)}, ${userLng?.toFixed(4)} — سيتم إرسال أقرب طبيب إليك`
                : "اختياري — لإرسال أقرب طبيب"}
            </p>
          </div>
          {!userLat && !locating && (
            <span className="rounded-full text-xs border border-primary/40 text-primary px-3 py-1.5 font-medium">تحديد</span>
          )}
        </button>

        {/* التخصص */}
        <div className="mb-5">
          <p className="text-sm font-medium text-foreground mb-3">نوع الحالة الطبية</p>
          <div className="grid grid-cols-3 gap-2">
            {EMERGENCY_SPECIALTIES.map(s => (
              <button key={s.value} onClick={() => setSpecialty(s.value)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  specialty === s.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 hover:border-primary/30 text-foreground"
                }`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* وصف الحالة */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">اشرح الحالة</p>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="مثال: المريض يعاني من ألم شديد في الصدر مع ضيق في التنفس منذ نصف ساعة..."
            className="resize-none rounded-xl border-border/40 bg-muted/30 min-h-[120px] text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5 text-left">{description.length}/10 حرف على الأقل</p>
        </div>

        {/* زر الإرسال */}
        <Button
          onClick={() => sendEmergency()}
          disabled={!canSend || isPending}
          className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-base gap-2 disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 className="h-5 w-5 animate-spin" /> جاري البحث عن طبيب...</>
            : <><Send className="h-5 w-5" /> إرسال طلب طارئ</>
          }
        </Button>

        {!isLoggedIn && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            يمكنك الإرسال بدون تسجيل دخول، لكن{" "}
            <a href="/auth" className="text-primary underline">سجّل دخولك</a>
            {" "}لتتبع طلباتك
          </p>
        )}
      </div>
    </div>
  );
}