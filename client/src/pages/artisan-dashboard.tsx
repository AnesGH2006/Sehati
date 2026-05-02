import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useArtisanLocation } from "@/hooks/useArtisanLocation";
import {
  MessageSquare, Star, Eye, Image as ImageIcon,
  MapPin, Save, BadgeCheck, Trash2, Upload, X,
  Phone, Mail, Briefcase, Banknote, Send, ArrowRight,
  Quote, Video, ExternalLink, CheckCheck, TrendingUp,
  BarChart2, ArrowUp, ArrowDown, Minus, Lock, Sparkles,
  Crown, Zap, Play, Wifi, Crosshair,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS, DAIRAS, categoryLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCall } from "@/hooks/useCall";
import { CallUI } from "@/components/CallUI";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import StatusToggle from "@/components/StatusToggle";
import LocationPicker from "@/components/LocationPicker";
import ArtisansMap from "@/components/ArtisansMap";

// ══════════════════════════════════════════════════════════════════════════════
// حدود الخطط
// ══════════════════════════════════════════════════════════════════════════════
const PLAN_LIMITS = {
  free:     { portfolioMax: 2,  analytics: false, videoPortfolio: false, label: "مجاني",    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",       icon: <Star className="h-3 w-3" />,    upgradeColor: "from-zinc-600 to-zinc-700" },
  standard: { portfolioMax: 3,  analytics: false, videoPortfolio: false, label: "قياسي",    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       icon: <Zap className="h-3 w-3" />,     upgradeColor: "from-blue-600 to-blue-700" },
  pro:      { portfolioMax: 5,  analytics: true,  videoPortfolio: true,  label: "احترافي",  color: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: <Crown className="h-3 w-3" />,   upgradeColor: "from-violet-600 to-purple-700" },
  gold:     { portfolioMax: 99, analytics: true,  videoPortfolio: true,  label: "ذهبي",     color: "bg-amber-400/20 text-amber-300 border-amber-400/30",    icon: <Sparkles className="h-3 w-3" />, upgradeColor: "from-amber-500 to-yellow-600" },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS;

function getPlan(sub: string | undefined): PlanKey {
  const s = sub as PlanKey;
  return PLAN_LIMITS[s] ? s : "free";
}

// ══════════════════════════════════════════════════════════════════════════════
// ثوابت ومساعدات
// ══════════════════════════════════════════════════════════════════════════════
const FINISH_SIGNAL = "__CHAT_FINISHED__";
const RATING_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"];

function isImageContent(c: string) {
  return c?.startsWith("data:image") ||
         c?.startsWith("/uploads/") ||
         c?.startsWith("uploads/") ||
         (c?.startsWith("http") && !c?.includes("__"));
}

function getImageSrc(content: string) {
  if (content.startsWith("uploads/")) return `/${content}`;
  return content;
}

function formatTime(d: any) {
  try { return new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// ── شريط التحسن ──────────────────────────────────────────────────────────────
function ImprovementBar({ label, value, change, color }: { label: string; value: number; change: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 200); return () => clearTimeout(t); }, [value]);
  const isPos = change > 0, isNeg = change < 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-400 w-32 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-black text-white w-8 text-left">{value}%</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 w-16 justify-center ${isPos ? "bg-green-500/10 text-green-400" : isNeg ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-400"}`}>
        {isPos ? <ArrowUp className="h-2.5 w-2.5" /> : isNeg ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
        {change !== 0 ? `${Math.abs(change)}%` : "–"}
      </span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    green: "bg-green-500/15 text-green-400 border-green-500/20",
  };
  const isPos = (change ?? 0) > 0, isNeg = (change ?? 0) < 0;
  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="bg-white/[0.03] border-white/10 rounded-2xl h-full">
        <CardContent className="p-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border mb-3 ${colorMap[color]}`}>{icon}</div>
          <div className="text-2xl font-black font-heading">{value}</div>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{label}</div>
          {change !== undefined && (
            <div className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${isPos ? "text-green-400" : isNeg ? "text-red-400" : "text-zinc-500"}`}>
              {isPos ? <ArrowUp className="h-2.5 w-2.5" /> : isNeg ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
              {change !== 0 ? `${Math.abs(change)}% هذا الشهر` : "لا تغيير"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-black">{payload[0].value}</p>
    </div>
  );
};

// ── شاشة الترقية ──────────────────────────────────────────────────────────────
function UpgradeGate({ plan, feature }: { plan: PlanKey; feature: string }) {
  const [, setLocation] = useLocation();
  const limits = PLAN_LIMITS[plan];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
    >
      <div className="relative">
        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${limits.upgradeColor} flex items-center justify-center shadow-2xl`}>
          <Lock className="h-8 w-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <Crown className="h-3 w-3 text-black" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black">{feature}</h3>
        <p className="text-zinc-400 text-sm max-w-xs">
          هذه الميزة متاحة في خطة <span className="text-white font-bold">الاحترافي</span> أو أعلى
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={() => setLocation("/subscription")}
          className="h-12 font-black rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 transition-opacity"
        >
          <Crown className="h-4 w-4 ml-2" />
          ترقية الخطة
        </Button>
        <p className="text-[10px] text-zinc-600">
          خطة الاحترافي: 3,000 دج/شهر • خطة الذهبي: 5,000 دج/شهر
        </p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dashboard الرئيسي
// ══════════════════════════════════════════════════════════════════════════════
export default function ArtisanDashboard() {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { artisan, isArtisan, isLoggedIn, logout, loginArtisan } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "portfolio" | "settings">("overview");
  const [wilaya, setWilaya] = useState(artisan?.wilaya || "الجزائر");
  const [daira, setDaira]   = useState(artisan?.daira  || "");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { location } = useArtisanLocation(artisan?.id ?? null);

  const myId   = String(artisan?.id || "");
  const myName = artisan?.name || "حرفي";

  const { callState, callType, remoteName, isMuted, isCamOff,
          localVideoRef, remoteVideoRef, startCall, acceptCall,
          rejectCall, endCall, toggleMute, toggleCamera } = useCall({ myId, myName });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: serverArtisan, refetch } = useQuery<any>({
    queryKey: ["/api/artisans", artisan?.id],
    queryFn: async () => {
      const data = await fetch(`/api/artisans/${artisan?.id}`).then(r => r.json());
      if (data?.portfolioImages) setPortfolioImages(data.portfolioImages || []);
      return data;
    },
    enabled: !!artisan?.id,
  });
  const realArtisan = serverArtisan || artisan;

  // ── حدود الخطة الحالية ───────────────────────────────────────────────────
  const planKey        = getPlan(realArtisan?.subscriptionType);
  const planMeta       = PLAN_LIMITS[planKey];
  const portfolioMax   = planMeta.portfolioMax;
  const canAnalytics   = planMeta.analytics;
  const canVideo       = planMeta.videoPortfolio;

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/artisans", artisan?.id, "reviews"],
    queryFn: () => fetch(`/api/artisans/${artisan?.id}/reviews`).then(r => r.json()),
    enabled: !!artisan?.id,
    refetchInterval: 30000,
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", String(artisan?.id)],
    queryFn: () => fetch(`/api/conversations/${artisan?.id}?role=artisan`).then(r => r.json()),
    enabled: !!artisan?.id,
    refetchInterval: 5000,
  });

  const { data: convMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", selectedConv?.id, "messages"],
    queryFn: () => fetch(`/api/conversations/${selectedConv?.id}/messages`).then(r => r.json()),
    enabled: !!selectedConv?.id,
    refetchInterval: 2000,
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/artisans", artisan?.id, "analytics"],
    queryFn: () => fetch(`/api/artisans/${artisan?.id}/analytics`).then(r => r.json()),
    enabled: !!artisan?.id && canAnalytics,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const chatFinished = (convMessages as any[]).some(
    (m: any) => m.content === FINISH_SIGNAL && m.senderType === "artisan"
  );

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [convMessages]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (updates: any) => fetch(`/api/artisans/${artisan?.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] });
      if (artisan) loginArtisan({ ...artisan, ...data });
      toast({ title: "تم الحفظ ✓" });
      refetch();
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/artisans/${artisan?.id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { logout(); queryClient.invalidateQueries({ queryKey: ["/api/artisans"] }); toast({ title: "تم حذف الحساب" }); setLocation("/"); },
  });

  const sendReplyMutation = useMutation({
    mutationFn: (content: string) => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv?.id, senderId: String(artisan?.id), receiverId: selectedConv?.customerId, senderType: "artisan", content }),
    }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] }); setReplyText(""); },
  });

  const finishChatMutation = useMutation({
    mutationFn: () => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv?.id, senderId: String(artisan?.id), receiverId: selectedConv?.customerId, senderType: "artisan", content: FINISH_SIGNAL }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id, "analytics"] });
      toast({ title: "✅ تم إنهاء المحادثة", description: "يمكن للزبون الآن تقييمك" });
    },
  });

  const handleSendReply = () => { if (!replyText.trim() || chatFinished) return; sendReplyMutation.mutate(replyText); };

  const uploadImage = async (base64: string): Promise<string> => {
    const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: base64 }) });
    return (await r.json()).url || base64;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = await uploadImage(reader.result as string);
      const cur = serverArtisan?.portfolioImages || portfolioImages;
      const next = [url, ...cur.filter((x: string) => x !== url).slice(0, 4)];
      updateMutation.mutate({ imageUrl: url, portfolioImages: next });
      setPortfolioImages(next);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPortfolioPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const cur = serverArtisan?.portfolioImages || portfolioImages;
    if (cur.length >= portfolioMax) {
      toast({ title: `الحد الأقصى ${portfolioMax} صور للخطة ${planMeta.label}`, description: "قم بترقية خطتك لإضافة المزيد", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = await uploadImage(reader.result as string);
      const next = [...cur, url];
      updateMutation.mutate({ portfolioImages: next });
      setPortfolioImages(next);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePortfolioPhoto = (index: number) => {
    const cur = serverArtisan?.portfolioImages || portfolioImages;
    const next = cur.filter((_: any, i: number) => i !== index);
    updateMutation.mutate({ portfolioImages: next });
    setPortfolioImages(next);
  };

  // ── رفع فيديوهات الأعمال (متعددة) ─────────────────────────────────────────
  const MAX_VIDEOS = 3;
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "الفيديو كبير جداً", description: "الحد الأقصى 50 ميغابايت", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const cur: string[] = serverArtisan?.portfolioVideos || [];
    if (cur.length >= MAX_VIDEOS) {
      toast({ title: "وصلت للحد الأقصى", description: `يمكنك رفع ${MAX_VIDEOS} فيديوهات كحد أقصى`, variant: "destructive" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const r = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: reader.result, filename: file.name }),
        });
        const { url } = await r.json();
        if (url) {
          const next = [...cur, url];
          updateMutation.mutate({ portfolioVideos: next });
          toast({ title: "✅ تم رفع الفيديو بنجاح" });
        }
      } catch {
        toast({ title: "فشل رفع الفيديو", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveVideo = (idx: number) => {
    const cur: string[] = serverArtisan?.portfolioVideos || [];
    const next = cur.filter((_, i) => i !== idx);
    updateMutation.mutate({ portfolioVideos: next });
    toast({ title: "تم حذف الفيديو" });
  };

  if (!isLoggedIn || !isArtisan) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-heading font-bold">يجب تسجيل الدخول أولاً</h2>
            <Button onClick={() => setLocation("/subscription")} className="bg-primary">انضم كحرفي</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const displayPortfolio: string[] = serverArtisan?.portfolioImages?.length > 0 ? serverArtisan.portfolioImages : portfolioImages;
  const portfolioVideos: string[] = serverArtisan?.portfolioVideos || [];
  const dailyData    = analytics?.dailyConversations   || [];
  const monthlyData  = analytics?.monthlyConversations  || [];
  const ratingDist   = analytics?.ratingDistribution   || [];
  const improvements = analytics?.improvements         || [];
  const dailyViews   = analytics?.dailyViews           || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 relative z-10" dir="rtl">

        {/* ══ Hero Header Card ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/10 rounded-3xl overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                {/* Profile section */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative group shrink-0" data-testid="avatar-artisan">
                    <img
                      src={realArtisan?.imageUrl || `https://ui-avatars.com/api/?name=${artisan?.name}&background=2DD4BF&color=fff&size=200`}
                      alt={artisan?.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-primary/30"
                    />
                    {realArtisan?.isOnline && (
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 ring-2 ring-zinc-950" data-testid="indicator-online" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                      <Upload className="h-5 w-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-heading font-black truncate" data-testid="text-artisan-name">{realArtisan?.name || artisan?.name}</h1>
                      <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    </div>
                    <p className="text-zinc-400 text-sm mt-0.5 truncate" data-testid="text-artisan-meta">
                      {categoryLabel(realArtisan?.category || artisan?.category)} • {realArtisan?.wilaya ? `${realArtisan.wilaya} - ` : ""}{realArtisan?.daira || artisan?.daira}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <StatusToggle
                        initialStatus={realArtisan?.isOnline ?? false}
                        onStatusChange={() => queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] })}
                      />
                      <Badge className={`text-xs border flex items-center gap-1 px-2.5 py-1 ${planMeta.color}`} data-testid="badge-plan">
                        {planMeta.icon}{planMeta.label}
                      </Badge>
                      {analytics?.avgRating > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs px-2.5 py-1" data-testid="badge-rating">
                          <Star className="h-3 w-3 ml-1 fill-amber-400" /> {analytics.avgRating}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats strip */}
                <div className="grid grid-cols-3 gap-2 lg:gap-3 lg:w-auto lg:min-w-[400px]">
                  <MiniStat icon={<Eye className="h-3.5 w-3.5" />}           label="مشاهدات" value={analytics?.totalViews ?? 0} color="text-blue-400" />
                  <MiniStat icon={<MessageSquare className="h-3.5 w-3.5" />} label="محادثات" value={analytics?.totalConversations ?? conversations.length} color="text-purple-400" />
                  <MiniStat icon={<Star className="h-3.5 w-3.5" />}          label="تقييمات" value={reviews.length} color="text-amber-400" />
                </div>
              </div>

              {/* Upgrade CTA — bottom strip */}
              {planKey !== "gold" && (
                <button onClick={() => setLocation("/subscription")} data-testid="button-upgrade-banner"
                  className="mt-5 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-amber-400/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-sm font-black text-white truncate">طوّر حسابك واحصل على ميزات حصرية</p>
                      <p className="text-[11px] text-zinc-400 truncate">معرض أكبر، فيديو تعريفي، تحليلات متقدمة وظهور أعلى</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:bg-violet-500/30 shrink-0">ترقية</span>
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══ Tabs ══════════════════════════════════════════════════════ */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 mb-6 flex gap-1 overflow-x-auto">
          {[
            { key: "overview",  label: "نظرة عامة",   icon: <Eye className="h-4 w-4" /> },
            { key: "analytics", label: "التحليلات",    icon: <BarChart2 className="h-4 w-4" />, locked: !canAnalytics },
            { key: "portfolio", label: "معرض الأعمال", icon: <ImageIcon className="h-4 w-4" /> },
            { key: "settings",  label: "الإعدادات",    icon: <Save className="h-4 w-4" /> },
          ].map(tab => (
            <button key={tab.key} data-testid={`tab-${tab.key}`}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab.key as any)}>
              {tab.icon}{tab.label}
              {tab.locked && <Lock className="h-3 w-3 opacity-60" />}
            </button>
          ))}
        </div>

        {/* ══ نظرة عامة ══ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard icon={<Eye className="h-4 w-4" />}           label="المشاهدات"  value={String(analytics?.totalViews ?? "–")}                                             change={analytics?.viewsChange}   color="blue"   />
              <KpiCard icon={<MessageSquare className="h-4 w-4" />} label="المحادثات"  value={String(analytics?.totalConversations ?? conversations.length)}                     change={analytics?.convsChange}   color="purple" />
              <KpiCard icon={<Star className="h-4 w-4" />}          label="التقييم"    value={analytics?.avgRating ? `${analytics.avgRating} ★` : (realArtisan?.rating || "0")} change={analytics?.reviewsChange} color="amber"  />
              <KpiCard icon={<TrendingUp className="h-4 w-4" />}    label="معدل الرد"  value={analytics?.replyRate != null ? `${analytics.replyRate}%` : "–"}                    color="green"  />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem icon={<Mail />}       label="البريد الإلكتروني" value={realArtisan?.email  || artisan?.email  || "–"} />
              <InfoItem icon={<Phone />}      label="الهاتف"            value={realArtisan?.phone  || artisan?.phone  || "–"} />
              <InfoItem icon={<Banknote />}   label="السعر الأدنى"      value={`${realArtisan?.priceStart || "–"} دج`} />
              <InfoItem icon={<Briefcase />}  label="سنوات الخبرة"      value={`${realArtisan?.yearsOfExperience || "–"} سنوات`} />
              <InfoItem icon={<MapPin />}     label="الموقع"            value={`${realArtisan?.wilaya || ""} - ${realArtisan?.daira || artisan?.daira || "–"}`} />
              <InfoItem icon={<BadgeCheck />} label="المهنة"            value={categoryLabel(realArtisan?.category || artisan?.category) || "–"} />
            </div>



            {/* المحادثات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-black">
                    <MessageSquare className="h-5 w-5 text-primary" />المحادثات
                    {conversations.length > 0 && <Badge className="bg-primary text-white text-xs">{conversations.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد محادثات بعد</p></div>
                  ) : conversations.map((conv: any) => (
                    <button key={conv.id} onClick={() => setSelectedConv(selectedConv?.id === conv.id ? null : conv)}
                      className={`w-full p-4 flex items-center gap-4 border-b border-white/5 transition-all text-right ${selectedConv?.id === conv.id ? "bg-primary/10 border-primary/20" : "hover:bg-white/5"}`}>
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-lg">
                          {conv.customerId?.replace("customer-", "").slice(0, 1).toUpperCase() || "؟"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{conv.customerName || `زبون #${conv.customerId?.slice(-6)}`}</p>
                        {conv.lastMessage && (
                          <p className="text-xs truncate mt-0.5 text-zinc-400">
                            {conv.lastMessage === FINISH_SIGNAL ? "✅ تم إنهاء المحادثة" : isImageContent(conv.lastMessage) ? "📷 صورة" : conv.lastMessage}
                          </p>
                        )}
                      </div>
                      <ArrowRight className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${selectedConv?.id === conv.id ? "rotate-90" : ""}`} />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <AnimatePresence>
                {selectedConv && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden flex flex-col h-[480px]">
                      <CardHeader className="p-4 border-b border-white/10 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/20 text-primary font-black text-sm">{selectedConv.customerId?.slice(-1).toUpperCase()}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-bold text-sm">{selectedConv.customerName || `زبون #${selectedConv.customerId?.slice(-6)}`}</p>
                            <p className="text-xs text-green-400">{chatFinished ? "✅ تم إنهاء المحادثة" : "متصل"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => startCall(selectedConv.customerId, selectedConv.customerName || "زبون", "audio")} className="p-1.5 rounded-full bg-white/5 hover:bg-primary/20 text-zinc-400 hover:text-primary transition-colors"><Phone className="h-4 w-4" /></button>
                          <button onClick={() => startCall(selectedConv.customerId, selectedConv.customerName || "زبون", "video")} className="p-1.5 rounded-full bg-white/5 hover:bg-primary/20 text-zinc-400 hover:text-primary transition-colors"><Video className="h-4 w-4" /></button>
                          <button onClick={() => setLocation(`/chat/${selectedConv.artisanId}`)} className="p-1.5 rounded-full bg-white/5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 transition-colors"><ExternalLink className="h-4 w-4" /></button>
                          {!chatFinished && convMessages.length > 0 && (
                            <button onClick={() => { if (confirm("هل تريد إنهاء هذه المحادثة؟")) finishChatMutation.mutate(); }} disabled={finishChatMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold border border-green-500/20">
                              <CheckCheck className="h-3.5 w-3.5" /> إنهاء
                            </button>
                          )}
                          {chatFinished && <span className="text-xs text-green-500/60 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> منتهية</span>}
                          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-zinc-400" onClick={() => setSelectedConv(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      </CardHeader>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={chatScrollRef}>
                        {convMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">لا توجد رسائل</div>
                        ) : convMessages.map((msg: any) => {
                          if (msg.content === FINISH_SIGNAL) return (
                            <div key={msg.id} className="flex items-center gap-2 my-2">
                              <div className="flex-1 h-px bg-green-500/20" />
                              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> أنهيت المحادثة</span>
                              <div className="flex-1 h-px bg-green-500/20" />
                            </div>
                          );
                          const isMe = msg.senderType === "artisan";
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                                {isImageContent(msg.content) ? (
                                  <img
                                    src={getImageSrc(msg.content)}
                                    alt="صورة"
                                    className="max-w-full rounded-xl max-h-40 object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : <p>{msg.content}</p>}
                                <span className="text-[10px] opacity-60 mt-0.5 block">{formatTime(msg.createdAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-3 border-t border-white/10">
                        {chatFinished ? <p className="text-center text-xs text-zinc-500 py-1">تم إنهاء المحادثة</p> : (
                          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/10">
                            <label className="cursor-pointer text-zinc-400 hover:text-primary transition-colors shrink-0">
                              <ImageIcon className="h-4 w-4" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result as string;
                                  fetch("/api/upload", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ data: base64 }),
                                  })
                                    .then(r => r.json())
                                    .then(({ url }) => {
                                      if (url) sendReplyMutation.mutate(url);
                                    })
                                    .catch(() => {});
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }} />
                            </label>
                            <input type="text" className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-zinc-500" placeholder="اكتب ردك..."
                              value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendReply()} />
                            <button onClick={handleSendReply} disabled={!replyText.trim() || sendReplyMutation.isPending}
                              className="p-1.5 bg-primary rounded-full text-white disabled:opacity-40 transition-all hover:bg-primary/80 active:scale-95"><Send className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {reviews.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-black">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />تقييمات الزبائن
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm">
                      {(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)} ★ ({reviews.length})
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="p-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm">{review.customerName?.[0] || "؟"}</div>
                          <span className="font-bold text-sm">{review.customerName}</span>
                        </div>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />)}</div>
                      </div>
                      {review.comment && <p className="text-zinc-400 text-xs leading-relaxed flex gap-1.5"><Quote className="h-3 w-3 shrink-0 mt-0.5 text-zinc-600" />{review.comment}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ══ التحليلات ══ */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!canAnalytics ? <UpgradeGate plan={planKey} feature="صفحة التحليلات" /> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "المشاهدات",       value: analytics?.totalViews        ?? "–", change: analytics?.viewsChange   ?? 0, color: "text-blue-400"   },
                    { label: "المحادثات",       value: analytics?.totalConversations ?? "–", change: analytics?.convsChange   ?? 0, color: "text-purple-400" },
                    { label: "التقييمات",       value: analytics?.totalReviews       ?? "–", change: analytics?.reviewsChange ?? 0, color: "text-amber-400"  },
                    { label: "معدل الرد",       value: analytics?.replyRate  != null ? `${analytics.replyRate}%`  : "–", change: 0, color: "text-green-400" },
                    { label: "إنهاء المحادثات", value: analytics?.finishRate != null ? `${analytics.finishRate}%` : "–", change: 0, color: "text-pink-400"  },
                  ].map(item => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                      <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{item.label}</div>
                      {item.change !== 0 && (
                        <div className={`text-[10px] mt-1 flex items-center gap-0.5 ${item.change > 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}{Math.abs(item.change)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.03] border-white/10 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Eye className="h-4 w-4 text-blue-400" />المشاهدات — آخر 7 أيام</p>
                    {dailyViews.length > 0 && dailyViews.some((d: any) => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={dailyViews}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} /><YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} /></BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[180px] flex items-center justify-center text-zinc-600 text-sm">لا توجد مشاهدات بعد</div>}
                  </Card>
                  <Card className="bg-white/[0.03] border-white/10 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-400" />المحادثات — آخر 7 أيام</p>
                    {dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} /><YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: "#8B5CF6" }} activeDot={{ r: 5 }} /></LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[180px] flex items-center justify-center text-zinc-600 text-sm">لا توجد بيانات كافية</div>}
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ معرض الأعمال ══ */}
        {activeTab === "portfolio" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* ── قسم الفيديو ─────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-heading font-black flex items-center gap-2">
                    <Video className="h-5 w-5 text-violet-400" />
                    فيديوهات الأعمال
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs flex items-center gap-1">
                      <Crown className="h-3 w-3" /> احترافي وذهبي
                    </Badge>
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">
                    أضف حتى {MAX_VIDEOS} فيديوهات لعرض مهاراتك — تظهر في صفحتك للمشتركين
                    {canVideo && <span className="text-violet-300 mr-1">· {portfolioVideos.length} / {MAX_VIDEOS}</span>}
                  </p>
                </div>
                {canVideo && portfolioVideos.length < MAX_VIDEOS && (
                  <label className="cursor-pointer">
                    <Button className="gap-2 rounded-2xl font-black bg-violet-600 hover:bg-violet-700" asChild>
                      <span><Upload className="h-4 w-4" />رفع فيديو</span>
                    </Button>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                )}
              </div>

              {!canVideo ? (
                <div className="border-2 border-dashed border-violet-500/20 rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-black text-lg">الفيديوهات متاحة للمشتركين</p>
                    <p className="text-zinc-500 text-sm mt-1">ارقِ إلى خطة الاحترافي أو الذهبي لإضافة فيديوهات لأعمالك</p>
                  </div>
                  <Button onClick={() => setLocation("/subscription")}
                    className="gap-2 rounded-2xl font-black bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90">
                    <Crown className="h-4 w-4" /> ترقية الخطة
                  </Button>
                </div>
              ) : portfolioVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioVideos.map((vid, i) => (
                    <div key={i} className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-black aspect-video">
                      <video src={vid} controls preload="metadata" playsInline className="w-full h-full object-contain" />
                      <button onClick={() => handleRemoveVideo(i)}
                        className="absolute top-3 left-3 p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors z-10"
                        data-testid={`button-remove-video-${i}`}>
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-violet-500/80 text-white text-[10px]">فيديو {i + 1}</Badge>
                      </div>
                    </div>
                  ))}
                  {portfolioVideos.length < MAX_VIDEOS && (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-violet-500/20 rounded-3xl aspect-video cursor-pointer hover:border-violet-500/40 transition-colors text-zinc-500 hover:text-zinc-300">
                      <Upload className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs font-bold">إضافة فيديو</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-violet-500/20 rounded-3xl py-16 cursor-pointer hover:border-violet-500/40 transition-colors text-zinc-500 hover:text-zinc-300 max-w-2xl">
                  <Video className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-bold">اضغط لرفع أول فيديو</p>
                  <p className="text-xs mt-1 text-zinc-600">MP4, MOV — حتى 50 ميغابايت — حتى {MAX_VIDEOS} فيديوهات</p>
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </label>
              )}
            </div>

            {/* ── قسم الصور ───────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-heading font-black flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    صور الأعمال
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-zinc-400 text-sm">{displayPortfolio.length} / {portfolioMax === 99 ? "∞" : portfolioMax} صورة</p>
                    {portfolioMax < 99 && (
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all bg-gradient-to-r ${planMeta.upgradeColor}`}
                          style={{ width: `${Math.min((displayPortfolio.length / portfolioMax) * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {portfolioMax < 99 && displayPortfolio.length >= portfolioMax && (
                    <button onClick={() => setLocation("/subscription")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 transition-all">
                      <Crown className="h-3 w-3" /> ترقية للمزيد
                    </button>
                  )}
                  <label className={`cursor-pointer ${displayPortfolio.length >= portfolioMax ? "opacity-40 pointer-events-none" : ""}`}>
                    <Button className="gap-2 rounded-2xl font-black" disabled={displayPortfolio.length >= portfolioMax}>
                      <Upload className="h-4 w-4" />إضافة صورة
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} disabled={displayPortfolio.length >= portfolioMax} />
                  </label>
                </div>
              </div>

              {displayPortfolio.length === 0 ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl py-20 text-zinc-500 cursor-pointer hover:border-primary/30 hover:text-zinc-300 transition-all">
                  <ImageIcon className="h-14 w-14 mb-4 opacity-20" />
                  <p className="font-bold text-lg">أضف أول صورة لأعمالك</p>
                  <p className="text-sm mt-1">متاح {portfolioMax === 99 ? "عدد غير محدود" : portfolioMax} {portfolioMax !== 99 && "صور"} في خطة {planMeta.label}</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
                </label>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayPortfolio.map((img: string, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="aspect-square rounded-2xl overflow-hidden relative group border border-white/10 cursor-pointer">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {i === 0 && <span className="text-xs font-bold text-white bg-primary/80 px-2 py-1 rounded-full">الصورة الرئيسية</span>}
                        <button className="h-9 w-9 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors" onClick={() => handleRemovePortfolioPhoto(i)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {displayPortfolio.length < portfolioMax ? (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors text-zinc-500 hover:text-zinc-300">
                      <Upload className="h-6 w-6 mb-2" /><span className="text-xs font-bold">إضافة</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
                    </label>
                  ) : (
                    <button onClick={() => setLocation("/subscription")} className="aspect-square rounded-2xl border-2 border-dashed border-amber-400/20 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400/40 transition-colors text-zinc-600 hover:text-amber-400">
                      <Crown className="h-6 w-6 mb-2" /><span className="text-xs font-bold">ترقية الخطة</span><span className="text-[10px] mt-0.5">للمزيد من الصور</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ الإعدادات ══ */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">

            <section>
              <SectionHeader
                icon={<MapPin className="h-4 w-4" />}
                title="التوفر والموقع الجغرافي"
                subtitle="تحكّم في ظهورك للزبائن وحدّد موقعك على الخريطة"
                color="text-green-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center">
                        <Wifi className="h-4 w-4" />
                      </div>
                      <h3 className="font-black text-sm">حالة التوفر</h3>
                    </div>
                    <StatusToggle
                      variant="full"
                      initialStatus={realArtisan?.isOnline ?? false}
                      onStatusChange={(status) => {
                        queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] });
                        toast({ title: status ? "✅ أنت الآن متاح" : "⏸️ تم إخفاؤك" });
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                        <Crosshair className="h-4 w-4" />
                      </div>
                      <h3 className="font-black text-sm">موقعي على الخريطة</h3>
                    </div>
                    <LocationPicker
                      initialLat={realArtisan?.latitude}
                      initialLng={realArtisan?.longitude}
                      initialName={realArtisan?.locationName || realArtisan?.wilaya || ""}
                      onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] });
                        toast({ title: "📍 تم حفظ موقعك" });
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <SectionHeader
                icon={<BadgeCheck className="h-4 w-4" />}
                title="المعلومات الشخصية"
                subtitle="حرّر بياناتك ومنطقتك الإدارية ونبذتك التعريفية"
                color="text-primary"
              />
              <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                <CardContent className="p-5 md:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "edit-name",  label: "الاسم",            val: realArtisan?.name,              type: "text",   ph: "اسمك" },
                      { id: "edit-phone", label: "الهاتف",            val: realArtisan?.phone,             type: "text",   ph: "06XXXXXXXX" },
                      { id: "edit-price", label: "السعر الأدنى (دج)", val: realArtisan?.priceStart,        type: "number", ph: "1000" },
                      { id: "edit-exp",   label: "سنوات الخبرة",      val: realArtisan?.yearsOfExperience, type: "number", ph: "5" },
                    ].map(f => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{f.label}</Label>
                        <input id={f.id} data-testid={`input-${f.id}`} defaultValue={f.val || ""} type={f.type} placeholder={f.ph}
                          className="w-full bg-white/5 border border-white/10 h-11 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-primary/50" />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الولاية</Label>
                      <Select value={wilaya} onValueChange={v => { setWilaya(v); setDaira((LOCATIONS as any)[v]?.[0] || ""); }} dir="rtl">
                        <SelectTrigger data-testid="select-wilaya" className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue placeholder="اختر ولاية" /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">{DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الدائرة</Label>
                      <Select value={daira} onValueChange={setDaira} disabled={!wilaya} dir="rtl">
                        <SelectTrigger data-testid="select-daira" className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue placeholder="اختر دائرة" /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">{wilaya && (LOCATIONS as any)[wilaya]?.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نبذة تعريفية</Label>
                    <textarea id="edit-desc" data-testid="input-edit-desc" defaultValue={realArtisan?.description || ""} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="اكتب نبذة عن نفسك ومهاراتك..." />
                  </div>

                  <div className="flex justify-end">
                    <Button data-testid="button-save-info" onClick={() => {
                      const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
                      updateMutation.mutate({
                        name: g("edit-name"),
                        phone: g("edit-phone"),
                        priceStart: parseInt(g("edit-price")),
                        yearsOfExperience: parseInt(g("edit-exp")),
                        description: (document.getElementById("edit-desc") as HTMLTextAreaElement)?.value,
                        wilaya, daira,
                      });
                    }} className="gap-2 rounded-xl font-black h-11 px-6" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4" />{updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeader
                icon={<Crown className="h-4 w-4" />}
                title="خطة الاشتراك"
                subtitle="اطّلع على خطتك الحالية والمميزات المتاحة"
                color="text-amber-400"
              />
              <Card className="bg-white/[0.03] border-white/10 rounded-2xl overflow-hidden">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${planMeta.upgradeColor} text-white shadow-lg`}>{planMeta.icon}</div>
                      <div>
                        <p className="font-black text-lg" data-testid="text-current-plan">خطة {planMeta.label}</p>
                        <p className="text-xs text-zinc-500">{planKey === "free" ? "مجاني" : planKey === "standard" ? "2,000 دج/شهر" : planKey === "pro" ? "3,000 دج/شهر" : "5,000 دج/شهر"}</p>
                      </div>
                    </div>
                    {planKey !== "gold" && (
                      <Button data-testid="button-upgrade-plan" onClick={() => setLocation("/subscription")} className="gap-2 rounded-xl font-black bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 h-11">
                        <Crown className="h-4 w-4" /> ترقية الخطة
                      </Button>
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-base font-black text-white">{portfolioMax === 99 ? "∞" : portfolioMax}</p><p className="text-[10px] text-zinc-500 mt-1">صور</p></div>
                    <div className="bg-white/5 rounded-xl p-3 text-center"><p className={`text-base font-black ${canVideo ? "text-green-400" : "text-zinc-600"}`}>{canVideo ? "✓" : "✗"}</p><p className="text-[10px] text-zinc-500 mt-1">فيديو</p></div>
                    <div className="bg-white/5 rounded-xl p-3 text-center"><p className={`text-base font-black ${canAnalytics ? "text-green-400" : "text-zinc-600"}`}>{canAnalytics ? "✓" : "✗"}</p><p className="text-[10px] text-zinc-500 mt-1">تحليلات</p></div>
                    <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-base font-black text-white">{planKey === "gold" ? "الأعلى" : planKey === "pro" ? "عالي" : planKey === "standard" ? "متوسط" : "عادي"}</p><p className="text-[10px] text-zinc-500 mt-1">الظهور</p></div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeader
                icon={<Trash2 className="h-4 w-4" />}
                title="منطقة الخطر"
                subtitle="حذف الحساب لا يمكن التراجع عنه"
                color="text-red-400"
              />
              <Card className="bg-red-500/[0.03] border-red-500/20 rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-sm text-white">حذف الحساب نهائياً</p>
                    <p className="text-xs text-zinc-500 mt-1">سيتم حذف جميع بياناتك وأعمالك من المنصة بشكل نهائي.</p>
                  </div>
                  <Button data-testid="button-delete-account" variant="destructive" className="gap-2 rounded-xl h-11"
                    onClick={() => { if (confirm("هل أنت متأكد من حذف حسابك نهائياً؟")) deleteMutation.mutate(); }}
                    disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" />حذف حسابي
                  </Button>
                </CardContent>
              </Card>
            </section>
          </motion.div>
        )}
      </main>
      <Footer />

      <CallUI callState={callState} callType={callType} remoteName={remoteName}
        isMuted={isMuted} isCamOff={isCamOff} localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef}
        onAccept={acceptCall} onReject={rejectCall} onEnd={endCall}
        onToggleMute={toggleMute} onToggleCamera={toggleCamera} />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
      <div className="text-primary shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-white truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white/[0.04] border border-white/10 rounded-2xl p-3">
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="text-lg font-black font-heading">{value}</span>
      </div>
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, color = "text-primary" }: { icon: React.ReactNode; title: string; subtitle?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-heading font-black text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}