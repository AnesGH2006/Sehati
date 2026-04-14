// client/src/pages/emergency.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Phone, MapPin, Send, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ─── التخصصات ─────────────────────────────────────────
const CATEGORIES = [
  { value: "electrical",   label: "كهربائي",   icon: "⚡", desc: "انقطاع كهرباء، ماس كهربائي" },
  { value: "plumbing",    label: "سباك",      icon: "💧", desc: "تسريب مياه، انسداد" },
  { value: "gas",      label: "غاز",       icon: "🔥", desc: "تسريب غاز، مشكلة قنون" },
  { value: "masonry",     label: "بناء",      icon: "🧱", desc: "تشقق، انهيار جزئي" },
  { value: "carpentry",    label: "نجار",      icon: "🪚", desc: "باب، نافذة، أثاث" },
  { value: "mechanic",  label: "ميكانيك",   icon: "🔧", desc: "سيارة، محرك" },
];

interface EmergencyResult {
  success: boolean;
  conversationId: string;
  artisan: {
    id: number;
    name: string;
    category: string;
    phone: string;
    rating: number;
    distanceKm: number | null;
  };
}

export default function EmergencyPage() {
  const [, setLocation] = useLocation();
  const { customer, artisan, isLoggedIn, isArtisan } = useAuth();
  const { toast } = useToast();

  const [category, setCategory]     = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult]         = useState<EmergencyResult | null>(null);
  const [userLat, setUserLat]       = useState<number | null>(null);
  const [userLng, setUserLng]       = useState<number | null>(null);

  const user = customer || artisan;

  // ─── تحديد الموقع ────────────────────────────────────
  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
      toast({ title: "✅ تم تحديد موقعك", description: "سيتم إرسال أقرب حرفي إليك" });
    });
  };

  // ─── إرسال الطلب ─────────────────────────────────────
  const { mutate: sendEmergency, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId:   user?.id || "guest",
          customerName: (user as any)?.name || "زبون",
          category,
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
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast({ title: "❌ فشل الطلب", description: err.message, variant: "destructive" });
    },
  });

  const canSend = category && description.trim().length >= 10;

  // ─── نتيجة النجاح ────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          {/* Success card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">تم إرسال طلبك!</h2>
            <p className="text-sm text-muted-foreground">تم إشعار الحرفي وسيتواصل معك فوراً</p>
          </div>

          {/* Artisan info */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 mb-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">الحرفي المختار</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {result.artisan.name[0]}
              </div>
              <div>
                <p className="font-bold text-foreground">{result.artisan.name}</p>
                <p className="text-sm text-primary">{result.artisan.category}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>⭐ {result.artisan.rating.toFixed(1)}</span>
                  {result.artisan.distanceKm && (
                    <span>📍 {result.artisan.distanceKm} كم</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 gap-2 rounded-xl"
                onClick={() => isArtisan ? setLocation('/artisan/dashboard') : setLocation(`/chat/${result.artisan.id}`)}
              >
                <MessageCircle className="h-4 w-4" />
                فتح المحادثة
              </Button>
              <a href={`tel:${result.artisan.phone}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2 rounded-xl border-primary/40 text-primary">
                  <Phone className="h-4 w-4" />
                  اتصال مباشر
                </Button>
              </a>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => { setResult(null); setCategory(""); setDescription(""); }}
          >
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
            <h1 className="text-xl font-bold text-foreground">طلب طارئ</h1>
            <p className="text-sm text-muted-foreground">سنجد لك أقرب حرفي متاح فوراً</p>
          </div>
        </div>

        {/* موقعك */}
        <div className={`rounded-xl border p-3 mb-5 flex items-center gap-3 cursor-pointer transition-all ${
          userLat ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/30"
        }`} onClick={locateUser}>
          <MapPin className={`h-5 w-5 flex-shrink-0 ${userLat ? "text-primary" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {userLat ? "✅ تم تحديد موقعك" : "اضغط لتحديد موقعك"}
            </p>
            <p className="text-xs text-muted-foreground">
              {userLat ? "سيتم إرسال أقرب حرفي إليك" : "اختياري — لإرسال أقرب حرفي"}
            </p>
          </div>
          {!userLat && (
            <Button variant="outline" size="sm" className="rounded-full text-xs border-primary/40 text-primary">
              تحديد
            </Button>
          )}
        </div>

        {/* التخصص */}
        <div className="mb-5">
          <p className="text-sm font-medium text-foreground mb-3">نوع المشكلة</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  category === c.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 hover:border-primary/30 text-foreground"
                }`}>
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="text-xs font-medium">{c.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* وصف المشكلة */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">اشرح المشكلة</p>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="مثال: انقطع التيار الكهربائي في الطابق الثاني وظهر دخان من اللوحة..."
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
          {isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> جاري البحث عن حرفي...</>
          ) : (
            <><Send className="h-5 w-5" /> إرسال طلب طارئ</>
          )}
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