import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, Star, Eye, Image as ImageIcon,
  MapPin, Save, BadgeCheck, Trash2, Upload, X,
  Phone, Mail, Briefcase, Banknote, Send, ArrowRight,
  Quote, Video, ExternalLink, CheckCheck, TrendingUp,
  BarChart2, ArrowUp, ArrowDown, Minus, Lock, Sparkles,
  Crown, Zap, Wifi, Crosshair, Mic, MicOff, Calendar,
  Clock, CheckCircle2, XCircle, AlertCircle, UserCircle,
  LayoutDashboard, Settings, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS, DAIRAS, SPECIALTIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCall } from "@/hooks/useCall";
import { CallUI } from "@/components/CallUI";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import StatusToggle from "@/components/StatusToggle";
import LocationPicker from "@/components/LocationPicker";

// ══════════════════════════════════════════════════════════════════════════════
// Plan limits
// ══════════════════════════════════════════════════════════════════════════════
const PLAN_LIMITS = {
  free:     { portfolioMax: 2,  analytics: false, videoPortfolio: false, label: "مجاني",   color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",       icon: <Star className="h-3 w-3" />,     upgradeColor: "from-zinc-600 to-zinc-700" },
  standard: { portfolioMax: 3,  analytics: false, videoPortfolio: false, label: "قياسي",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       icon: <Zap className="h-3 w-3" />,      upgradeColor: "from-blue-600 to-blue-700" },
  pro:      { portfolioMax: 5,  analytics: true,  videoPortfolio: true,  label: "احترافي", color: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: <Crown className="h-3 w-3" />,    upgradeColor: "from-violet-600 to-purple-700" },
  gold:     { portfolioMax: 99, analytics: true,  videoPortfolio: true,  label: "ذهبي",    color: "bg-amber-400/20 text-amber-300 border-amber-400/30",    icon: <Sparkles className="h-3 w-3" />, upgradeColor: "from-amber-500 to-yellow-600" },
} as const;
type PlanKey = keyof typeof PLAN_LIMITS;
function getPlan(sub: string | undefined): PlanKey {
  const s = sub as PlanKey;
  return PLAN_LIMITS[s] ? s : "free";
}

const FINISH_SIGNAL = "__CHAT_FINISHED__";
function isImageContent(c: string) {
  return c?.startsWith("data:image") || c?.startsWith("/uploads/") || c?.startsWith("uploads/") || (c?.startsWith("http") && !c?.includes("__"));
}
function getImageSrc(content: string) {
  return content.startsWith("uploads/") ? `/${content}` : content;
}
function formatTime(d: any) {
  try { return new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-black">{payload[0].value}</p>
    </div>
  );
};

// ── Upgrade Gate ──────────────────────────────────────────────────────────────
function UpgradeGate({ plan, feature }: { plan: PlanKey; feature: string }) {
  const [, setLocation] = useLocation();
  const limits = PLAN_LIMITS[plan];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
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
        <p className="text-zinc-400 text-sm max-w-xs">هذه الميزة متاحة في خطة <span className="text-white font-bold">الاحترافي</span> أو أعلى</p>
      </div>
      <Button onClick={() => setLocation("/subscription")} className="h-12 font-black rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90">
        <Crown className="h-4 w-4 ml-2" /> ترقية الخطة
      </Button>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dashboard الرئيسي
// ══════════════════════════════════════════════════════════════════════════════
export default function DoctorDashboard() {
  const { toast } = useToast();
  const { doctor, isDoctor, isLoggedIn, logout, loginDoctor } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "analytics" | "settings">("overview");
  const [wilaya, setWilaya] = useState(doctor?.wilaya || "الجزائر");
  const [daira,  setDaira]  = useState(doctor?.daira  || "");
  const [selectedConv, setSelectedConv]     = useState<any>(null);
  const [replyText, setReplyText]           = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const chatScrollRef    = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef   = useRef<BlobPart[]>([]);

  const myId   = String(doctor?.id || "");
  const myName = doctor?.name || "طبيب";

  const { callState, callType, remoteName, isMuted, isCamOff,
          localVideoRef, remoteVideoRef, startCall, acceptCall,
          rejectCall, endCall, toggleMute, toggleCamera } = useCall({ myId, myName });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: serverDoctor, refetch } = useQuery<any>({
    queryKey: ["/api/doctors", doctor?.id],
    queryFn:  () => fetch(`/api/doctors/${doctor?.id}`).then(r => r.json()),
    enabled:  !!doctor?.id,
  });
  const realDoctor = serverDoctor || doctor;
  const planKey    = getPlan(realDoctor?.subscriptionType);
  const planMeta   = PLAN_LIMITS[planKey];
  const canAnalytics = planMeta.analytics;

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors", doctor?.id, "reviews"],
    queryFn: () =>
      fetch(`/api/doctors/${doctor?.id}/reviews`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? data : data?.reviews ?? data?.data ?? []),
    enabled: !!doctor?.id,
    refetchInterval: 30000,
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", String(doctor?.id)],
    queryFn: () =>
      fetch(`/api/conversations/${doctor?.id}?role=doctor`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? data : data?.conversations ?? data?.data ?? []),
    enabled: !!doctor?.id,
    refetchInterval: 5000,
  });

  const { data: convMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", selectedConv?.id, "messages"],
    queryFn: () =>
      fetch(`/api/conversations/${selectedConv?.id}/messages`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? data : data?.messages ?? data?.data ?? []),
    enabled: !!selectedConv?.id,
    refetchInterval: 2000,
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/appointments/doctor", doctor?.id],
    queryFn: () =>
      fetch(`/api/appointments/doctor/${doctor?.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? data : data?.appointments ?? data?.data ?? []),
    enabled: !!doctor?.id,
    refetchInterval: 15000,
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/doctors", doctor?.id, "analytics"],
    queryFn:  () => fetch(`/api/doctors/${doctor?.id}/analytics`).then(r => r.json()),
    enabled:  !!doctor?.id && canAnalytics,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const chatFinished = convMessages.some(
    (m: any) => m.content === FINISH_SIGNAL && m.senderType === "doctor"
  );

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [convMessages]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (updates: any) => fetch(`/api/doctors/${doctor?.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] });
      if (doctor) loginDoctor({ ...doctor, ...data });
      toast({ title: "تم الحفظ ✓" });
      refetch();
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/doctors/${doctor?.id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      logout();
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({ title: "تم حذف الحساب" });
      setLocation("/");
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: (content: string) => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv?.id, senderId: String(doctor?.id), receiverId: selectedConv?.patientId, senderType: "doctor", content }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] });
      setReplyText("");
    },
  });

  const finishChatMutation = useMutation({
    mutationFn: () => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv?.id, senderId: String(doctor?.id), receiverId: selectedConv?.patientId, senderType: "doctor", content: FINISH_SIGNAL }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] });
      toast({ title: "✅ تم إنهاء المحادثة", description: "يمكن للمريض الآن تقييمك" });
    },
  });

  const updateApptMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/appointments/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", doctor?.id] });
      toast({ title: "تم تحديث حالة الموعد" });
    },
    onError: () => toast({ title: "فشل تحديث الموعد", variant: "destructive" }),
  });

  const handleSendReply = () => {
    if (!replyText.trim() || chatFinished) return;
    sendReplyMutation.mutate(replyText);
  };

  const handleVoiceClip = async () => {
    if (!selectedConv || chatFinished) return;
    if (isRecordingVoice) { mediaRecorderRef.current?.stop(); setIsRecordingVoice(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob   = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.onerror   = rej;
          reader.readAsDataURL(blob);
        });
        fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: base64 }) })
          .then(r => r.json()).then(({ url }) => { if (url) sendReplyMutation.mutate(url); }).catch(() => {});
      };
      recorder.start();
      setIsRecordingVoice(true);
    } catch { setIsRecordingVoice(false); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const r   = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: reader.result }) });
      const url = (await r.json()).url;
      if (url) updateMutation.mutate({ imageUrl: url });
    };
    reader.readAsDataURL(file);
  };

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isLoggedIn || !isDoctor) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-heading font-bold">يجب تسجيل الدخول أولاً</h2>
            <Button onClick={() => setLocation("/subscription")} className="bg-primary rounded-xl h-12 px-8 font-bold">انضم كطبيب</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const dailyData    = analytics?.dailyConversations || [];
  const dailyViews   = analytics?.dailyViews         || [];
  const pendingAppts = appointments.filter((a: any) => a.status === "pending");
  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayAppts   = appointments.filter((a: any) => a.appointmentDate === todayStr);
  const avgRating    = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "–";

  const apptStatusColor: Record<string, string> = {
    pending:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  const apptStatusLabel: Record<string, string> = {
    pending: "⏳ انتظار", confirmed: "✅ مؤكد", cancelled: "❌ ملغي", completed: "🏁 مكتمل",
  };

  const TABS = [
    { key: "overview",     label: "نظرة عامة",  icon: <LayoutDashboard className="h-4 w-4" />, badge: 0 },
    { key: "appointments", label: "المواعيد",    icon: <Calendar className="h-4 w-4" />,        badge: pendingAppts.length },
    { key: "analytics",    label: "التحليلات",   icon: <BarChart2 className="h-4 w-4" />,       badge: 0, locked: !canAnalytics },
    { key: "settings",     label: "الإعدادات",   icon: <Settings className="h-4 w-4" />,        badge: 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans">
      <Navbar />

      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-blue-500/8 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10" dir="rtl">

        {/* ══════════════════════════════════════════════════
            HEADER CARD
        ══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">

                {/* Avatar + upload */}
                <div className="relative group shrink-0">
                  <img
                    src={realDoctor?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor?.name || "د")}&background=2DD4BF&color=fff&size=200`}
                    alt={doctor?.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30"
                  />
                  {realDoctor?.isOnline && (
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-400 ring-2 ring-zinc-950" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <Upload className="h-5 w-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {/* Name / specialty */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl md:text-2xl font-heading font-black">د. {realDoctor?.name || doctor?.name}</h1>
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    <Badge className={`text-[11px] border flex items-center gap-1 px-2 py-0.5 ${planMeta.color}`}>
                      {planMeta.icon}{planMeta.label}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    🩺 {realDoctor?.specialty || doctor?.specialty}
                    {realDoctor?.wilaya ? ` • ${realDoctor.wilaya}` : ""}
                    {realDoctor?.daira   ? ` — ${realDoctor.daira}` : ""}
                  </p>
                  {realDoctor?.clinicName && (
                    <p className="text-zinc-500 text-xs mt-0.5">🏥 {realDoctor.clinicName}</p>
                  )}

                  {/* Status + pending badge */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <StatusToggle
                      initialStatus={realDoctor?.isOnline ?? false}
                      onStatusChange={() => queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] })}
                    />
                    {pendingAppts.length > 0 && (
                      <button
                        onClick={() => setActiveTab("appointments")}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-bold hover:bg-yellow-500/25 transition-colors"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {pendingAppts.length} موعد بانتظار موافقتك
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick KPIs — compact strip */}
                <div className="flex sm:flex-col gap-2 shrink-0 sm:items-end w-full sm:w-auto">
                  <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                    {[
                      { icon: <Eye className="h-3.5 w-3.5" />,          val: analytics?.totalViews         ?? 0,              label: "مشاهدات", color: "text-blue-400"   },
                      { icon: <Calendar className="h-3.5 w-3.5" />,      val: appointments.length,                             label: "مواعيد",  color: "text-teal-400"   },
                      { icon: <MessageSquare className="h-3.5 w-3.5" />, val: conversations.length,                            label: "رسائل",   color: "text-purple-400" },
                      { icon: <Star className="h-3.5 w-3.5" />,          val: reviews.length ? `${avgRating}★` : 0,            label: "تقييم",   color: "text-amber-400"  },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center bg-white/[0.04] border border-white/8 rounded-xl p-2.5">
                        <div className={`flex items-center gap-1 ${s.color}`}>
                          {s.icon}<span className="text-base font-black font-heading">{s.val}</span>
                        </div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upgrade banner (non-gold plans) */}
              {planKey !== "gold" && (
                <button
                  onClick={() => setLocation("/subscription")}
                  className="mt-4 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/8 to-amber-400/8 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Crown className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-sm font-black text-white truncate">طوّر حسابك واحصل على ميزات حصرية</p>
                      <p className="text-[11px] text-zinc-500 truncate">تحليلات متقدمة • ظهور أعلى • دعم مخصص</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:bg-violet-500/30 shrink-0 whitespace-nowrap">
                    ترقية الآن
                  </span>
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            TAB BAR
        ══════════════════════════════════════════════════ */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/8 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black text-[10px] font-black flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {tab.locked && <Lock className="h-3 w-3 opacity-50" />}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB: نظرة عامة
        ══════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Eye className="h-4 w-4" />,        label: "المشاهدات", value: String(analytics?.totalViews        ?? "–"), change: analytics?.viewsChange,   color: "blue-400",   bg: "blue-500"   },
                { icon: <Calendar className="h-4 w-4" />,   label: "المواعيد",  value: String(appointments.length),                  change: analytics?.apptChange,    color: "teal-400",   bg: "teal-500"   },
                { icon: <Star className="h-4 w-4" />,       label: "متوسط التقييم", value: reviews.length ? `${avgRating} ★` : "–",  change: analytics?.reviewsChange, color: "amber-400",  bg: "amber-500"  },
                { icon: <TrendingUp className="h-4 w-4" />, label: "معدل الرد", value: analytics?.replyRate != null ? `${analytics.replyRate}%` : "–", change: undefined, color: "green-400",  bg: "green-500"  },
              ].map(kpi => (
                <motion.div key={kpi.label} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-white/[0.03] border-white/8 rounded-2xl h-full">
                    <CardContent className="p-4">
                      <div className={`w-9 h-9 rounded-xl bg-${kpi.bg}/15 text-${kpi.color} border border-${kpi.bg}/20 flex items-center justify-center mb-3`}>
                        {kpi.icon}
                      </div>
                      <div className="text-2xl font-black font-heading">{kpi.value}</div>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{kpi.label}</div>
                      {kpi.change !== undefined && (
                        <div className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${kpi.change > 0 ? "text-green-400" : kpi.change < 0 ? "text-red-400" : "text-zinc-500"}`}>
                          {kpi.change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : kpi.change < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                          {kpi.change !== 0 ? `${Math.abs(kpi.change)}% هذا الشهر` : "لا تغيير"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Main grid: conversations (2/3) + sidebar (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── Conversations ───────────────────────────── */}
              <div className="lg:col-span-2 space-y-5">
                <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden">
                  <CardHeader className="p-5 border-b border-white/8 pb-4">
                    <CardTitle className="flex items-center gap-3 text-base font-heading font-black">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      المحادثات
                      {conversations.length > 0 && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{conversations.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {conversations.length === 0 ? (
                      <div className="p-10 text-center">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                        <p className="text-zinc-500 text-sm">لا توجد محادثات بعد</p>
                        <p className="text-zinc-600 text-xs mt-1">ستظهر رسائل المرضى هنا</p>
                      </div>
                    ) : conversations.map((conv: any) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(selectedConv?.id === conv.id ? null : conv)}
                        className={`w-full px-5 py-3.5 flex items-center gap-3.5 border-b border-white/5 transition-all text-right last:border-0 ${
                          selectedConv?.id === conv.id ? "bg-primary/8 border-r-2 border-r-primary" : "hover:bg-white/4"
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary font-black">
                            {conv.patientName?.[0] || "؟"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white">{conv.patientName || `مريض #${String(conv.patientId).slice(-6)}`}</p>
                          {conv.lastMessage && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {conv.lastMessage === FINISH_SIGNAL ? "✅ تم إنهاء المحادثة" : isImageContent(conv.lastMessage) ? "📷 صورة" : conv.lastMessage}
                            </p>
                          )}
                        </div>
                        <ChevronLeft className={`h-4 w-4 text-zinc-600 shrink-0 transition-transform ${selectedConv?.id === conv.id ? "-rotate-90" : ""}`} />
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Inline chat panel */}
                <AnimatePresence>
                  {selectedConv && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
                      <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden flex flex-col" style={{ height: "520px" }}>
                        {/* Chat header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/20 text-primary font-black text-sm">
                                {selectedConv.patientName?.[0] || "؟"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm">{selectedConv.patientName || `مريض #${String(selectedConv.patientId).slice(-6)}`}</p>
                              <p className={`text-xs ${chatFinished ? "text-zinc-500" : "text-green-400"}`}>
                                {chatFinished ? "✅ تم إنهاء المحادثة" : "● متصل"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "audio")} className="p-2 rounded-xl bg-white/5 hover:bg-primary/15 text-zinc-400 hover:text-primary transition-colors"><Phone className="h-4 w-4" /></button>
                            <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "video")} className="p-2 rounded-xl bg-white/5 hover:bg-primary/15 text-zinc-400 hover:text-primary transition-colors"><Video className="h-4 w-4" /></button>
                            <button onClick={() => setLocation(`/chat/${selectedConv.doctorId}`)} className="p-2 rounded-xl bg-white/5 hover:bg-blue-500/15 text-zinc-400 hover:text-blue-400 transition-colors"><ExternalLink className="h-4 w-4" /></button>
                            {!chatFinished && convMessages.length > 0 && (
                              <button
                                onClick={() => { if (confirm("هل تريد إنهاء هذه المحادثة؟")) finishChatMutation.mutate(); }}
                                disabled={finishChatMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold border border-green-500/20"
                              >
                                <CheckCheck className="h-3.5 w-3.5" /> إنهاء
                              </button>
                            )}
                            <button onClick={() => setSelectedConv(null)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={chatScrollRef}>
                          {convMessages.map((msg: any) => {
                            if (msg.content === FINISH_SIGNAL) return (
                              <div key={msg.id} className="flex items-center gap-2 my-3">
                                <div className="flex-1 h-px bg-green-500/20" />
                                <span className="text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                  <CheckCheck className="h-3 w-3" /> أنهيت المحادثة
                                </span>
                                <div className="flex-1 h-px bg-green-500/20" />
                              </div>
                            );
                            const isMe = msg.senderType === "doctor";
                            return (
                              <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                                  {isImageContent(msg.content)
                                    ? <img src={getImageSrc(msg.content)} alt="صورة" className="max-w-full rounded-xl max-h-40 object-cover" />
                                    : <p>{msg.content}</p>}
                                  <span className="text-[10px] opacity-50 mt-0.5 block">{formatTime(msg.createdAt)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-white/8">
                          {chatFinished ? (
                            <p className="text-center text-xs text-zinc-600 py-1">تم إنهاء هذه المحادثة</p>
                          ) : (
                            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/8">
                              <label className="cursor-pointer text-zinc-500 hover:text-primary transition-colors shrink-0">
                                <ImageIcon className="h-4 w-4" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0]; if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = () =>
                                    fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: reader.result }) })
                                      .then(r => r.json()).then(({ url }) => { if (url) sendReplyMutation.mutate(url); }).catch(() => {});
                                  reader.readAsDataURL(file);
                                  e.target.value = "";
                                }} />
                              </label>
                              <button onClick={handleVoiceClip} className={`shrink-0 p-1 transition-colors rounded-lg ${isRecordingVoice ? "bg-red-500/20 text-red-400" : "text-zinc-500 hover:text-primary"}`}>
                                {isRecordingVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                              </button>
                              <input
                                type="text"
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-zinc-600"
                                placeholder="اكتب ردك..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSendReply()}
                              />
                              <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || sendReplyMutation.isPending}
                                className="p-1.5 bg-primary rounded-xl text-white disabled:opacity-30 transition-all hover:bg-primary/80 shrink-0"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Sidebar: today's appointments + reviews ── */}
              <div className="space-y-5">

                {/* Today's appointments */}
                <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-white/8">
                    <CardTitle className="flex items-center gap-2 text-sm font-heading font-black">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/20">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      مواعيد اليوم
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs mr-auto">{todayAppts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {todayAppts.length === 0 ? (
                      <div className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                        <p className="text-zinc-500 text-xs">لا مواعيد اليوم</p>
                      </div>
                    ) : todayAppts.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="h-3.5 w-3.5 text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white truncate">{a.patientName}</p>
                          <p className="text-zinc-500 text-xs">⏰ {a.appointmentTime}</p>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${apptStatusColor[a.status] || ""}`}>{apptStatusLabel[a.status]}</Badge>
                      </div>
                    ))}
                    {appointments.length > 0 && (
                      <button
                        onClick={() => setActiveTab("appointments")}
                        className="w-full py-3 text-xs text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-white/5"
                      >
                        عرض كل المواعيد <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </CardContent>
                </Card>

                {/* Reviews summary */}
                <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-white/8">
                    <CardTitle className="flex items-center gap-2 text-sm font-heading font-black">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </div>
                      آخر التقييمات
                      {reviews.length > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs mr-auto">{avgRating} ★</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {reviews.length === 0 ? (
                      <div className="p-6 text-center">
                        <Star className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                        <p className="text-zinc-500 text-xs">لا توجد تقييمات بعد</p>
                      </div>
                    ) : reviews.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0">
                              {r.patientName?.[0] || "؟"}
                            </div>
                            <span className="font-bold text-xs text-white">{r.patientName}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                            <Quote className="h-2.5 w-2.5 inline-block ml-1 text-zinc-600" />{r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: المواعيد
        ══════════════════════════════════════════════════ */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Status summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["pending","confirmed","completed","cancelled"] as const).map(s => {
                const count = appointments.filter((a: any) => a.status === s).length;
                const icons: Record<string, React.ReactNode> = {
                  pending:   <AlertCircle className="h-4 w-4" />,
                  confirmed: <CheckCircle2 className="h-4 w-4" />,
                  completed: <CheckCheck className="h-4 w-4" />,
                  cancelled: <XCircle className="h-4 w-4" />,
                };
                return (
                  <div key={s} className={`rounded-2xl border p-4 ${apptStatusColor[s]}`}>
                    <div className="flex items-center gap-2 mb-2">{icons[s]}<span className="text-xs font-black">{apptStatusLabel[s]}</span></div>
                    <div className="text-2xl font-black">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Appointment list */}
            {appointments.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500">لا توجد مواعيد بعد</p>
              </div>
            ) : appointments.map((appt: any) => (
              <motion.div key={appt.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-white">{appt.patientName}</span>
                    {appt.isUrgent && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">🚨 عاجل</Badge>}
                    <Badge className={`text-xs ${apptStatusColor[appt.status] || ""}`}>{apptStatusLabel[appt.status]}</Badge>
                  </div>
                  <p className="text-zinc-400 text-sm">📅 {appt.appointmentDate} — ⏰ {appt.appointmentTime}</p>
                  {appt.patientPhone && <p className="text-zinc-500 text-xs mt-0.5">📞 {appt.patientPhone}</p>}
                  {appt.notes && <p className="text-zinc-600 text-xs mt-0.5 italic">"{appt.notes}"</p>}
                </div>
                {appt.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs h-9"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "confirmed" })}
                      disabled={updateApptMutation.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> تأكيد
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs h-9"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "cancelled" })}
                      disabled={updateApptMutation.isPending}>
                      <XCircle className="h-3.5 w-3.5" /> إلغاء
                    </Button>
                  </div>
                )}
                {appt.status === "confirmed" && (
                  <Button size="sm" className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs shrink-0 h-9"
                    onClick={() => updateApptMutation.mutate({ id: appt.id, status: "completed" })}
                    disabled={updateApptMutation.isPending}>
                    <CheckCheck className="h-3.5 w-3.5" /> إتمام الكشف
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: التحليلات
        ══════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {!canAnalytics ? <UpgradeGate plan={planKey} feature="صفحة التحليلات" /> : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "المشاهدات",  value: analytics?.totalViews        ?? "–", change: analytics?.viewsChange   ?? 0, color: "text-blue-400"   },
                    { label: "المواعيد",   value: analytics?.totalAppointments ?? "–", change: analytics?.apptChange    ?? 0, color: "text-teal-400"   },
                    { label: "المحادثات",  value: analytics?.totalConversations ?? "–", change: analytics?.convsChange   ?? 0, color: "text-purple-400" },
                    { label: "التقييمات", value: analytics?.totalReviews       ?? "–", change: analytics?.reviewsChange ?? 0, color: "text-amber-400"  },
                    { label: "معدل الرد", value: analytics?.replyRate != null ? `${analytics.replyRate}%` : "–", change: 0, color: "text-green-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
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
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Eye className="h-4 w-4 text-blue-400" />المشاهدات — آخر 7 أيام</p>
                    {dailyViews.length > 0 && dailyViews.some((d: any) => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={dailyViews}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[180px] flex items-center justify-center text-zinc-700 text-sm">لا توجد مشاهدات بعد</div>}
                  </Card>
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-400" />المواعيد — آخر 7 أيام</p>
                    {dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[180px] flex items-center justify-center text-zinc-700 text-sm">لا توجد بيانات كافية</div>}
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: الإعدادات
        ══════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">

            {/* ── Availability & location ── */}
            <SettingsSection icon={<Wifi className="h-4 w-4" />} title="التوفر والموقع" subtitle="تحكّم في ظهورك وحدّد موقع عيادتك" color="text-green-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={<Wifi className="h-4 w-4" />} title="حالة التوفر" color="green">
                  <StatusToggle variant="full" initialStatus={realDoctor?.isOnline ?? false}
                    onStatusChange={(status) => {
                      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] });
                      toast({ title: status ? "✅ أنت الآن متاح" : "⏸️ تم إخفاؤك" });
                    }} />
                </SettingsCard>
                <SettingsCard icon={<Crosshair className="h-4 w-4" />} title="موقع العيادة" color="blue">
                  <LocationPicker
                    initialLat={realDoctor?.latitude} initialLng={realDoctor?.longitude}
                    initialName={realDoctor?.locationName || realDoctor?.wilaya || ""}
                    onSaved={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] });
                      toast({ title: "📍 تم حفظ موقعك" });
                    }} />
                </SettingsCard>
              </div>
            </SettingsSection>

            {/* ── Professional info ── */}
            <SettingsSection icon={<BadgeCheck className="h-4 w-4" />} title="المعلومات المهنية" subtitle="حرّر بياناتك الطبية ومعلومات العيادة" color="text-primary">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
                <CardContent className="p-5 md:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "edit-name",    label: "الاسم",             val: realDoctor?.name,              type: "text",   ph: "د. محمد علي" },
                      { id: "edit-phone",   label: "الهاتف",            val: realDoctor?.phone,             type: "text",   ph: "06XXXXXXXX" },
                      { id: "edit-fee",     label: "سعر الكشف (دج)",    val: realDoctor?.consultationFee,   type: "number", ph: "1500" },
                      { id: "edit-exp",     label: "سنوات الخبرة",      val: realDoctor?.yearsOfExperience, type: "number", ph: "10" },
                      { id: "edit-clinic",  label: "اسم العيادة",       val: realDoctor?.clinicName,        type: "text",   ph: "عيادة النور" },
                      { id: "edit-license", label: "رقم الترخيص الطبي", val: realDoctor?.licenseNumber,     type: "text",   ph: "DZ-12345" },
                    ].map(f => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{f.label}</Label>
                        <input id={f.id} defaultValue={f.val || ""} type={f.type} placeholder={f.ph}
                          className="w-full bg-white/5 border border-white/10 h-11 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">التخصص</Label>
                      <Select defaultValue={realDoctor?.specialty} onValueChange={v => updateMutation.mutate({ specialty: v })} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {SPECIALTIES.map(s => <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الولاية</Label>
                      <Select value={wilaya} onValueChange={v => { setWilaya(v); setDaira((LOCATIONS as any)[v]?.[0] || ""); }} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الدائرة</Label>
                      <Select value={daira} onValueChange={setDaira} disabled={!wilaya} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {wilaya && (LOCATIONS as any)[wilaya]?.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نبذة تعريفية</Label>
                    <textarea id="edit-desc" defaultValue={realDoctor?.description || ""} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none transition-colors"
                      placeholder="اكتب نبذة عن تخصصك وخبرتك..." />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
                        updateMutation.mutate({
                          name:              g("edit-name"),
                          phone:             g("edit-phone"),
                          consultationFee:   parseInt(g("edit-fee")),
                          yearsOfExperience: parseInt(g("edit-exp")),
                          clinicName:        g("edit-clinic"),
                          licenseNumber:     g("edit-license"),
                          description:       (document.getElementById("edit-desc") as HTMLTextAreaElement)?.value,
                          wilaya, daira,
                        });
                      }}
                      className="gap-2 rounded-xl font-black h-11 px-6"
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* ── Working hours ── */}
            <SettingsSection icon={<Clock className="h-4 w-4" />} title="جدول أوقات العمل" subtitle="مواعيد عمل العيادة" color="text-teal-400">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">أيام العمل</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { id: "السبت", short: "سبت" }, { id: "الأحد", short: "أحد" },
                        { id: "الاثنين", short: "اثن" }, { id: "الثلاثاء", short: "ثلث" },
                        { id: "الأربعاء", short: "أرب" }, { id: "الخميس", short: "خمس" },
                        { id: "الجمعة", short: "جمع" },
                      ].map(day => {
                        const isWorking = (realDoctor?.workingDays ?? ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"]).includes(day.id);
                        return (
                          <div key={day.id} className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center"
                            style={{
                              background: isWorking ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
                              borderColor: isWorking ? "rgba(20,184,166,0.35)" : "rgba(255,255,255,0.08)",
                            }}>
                            <span className="text-[10px] font-black" style={{ color: isWorking ? "#14b8a6" : "#52525b" }}>{day.short}</span>
                            <div className={`w-2 h-2 rounded-full ${isWorking ? "bg-teal-400" : "bg-zinc-700"}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0"><Clock className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">يبدأ من</p>
                        <p className="text-sm font-black">{realDoctor?.workingHoursStart ?? "08:00"}</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-500/15 text-zinc-400 flex items-center justify-center shrink-0"><Clock className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">ينتهي عند</p>
                        <p className="text-sm font-black">{realDoctor?.workingHoursEnd ?? "17:00"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* ── Subscription ── */}
            <SettingsSection icon={<Crown className="h-4 w-4" />} title="خطة الاشتراك" color="text-amber-400">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${planMeta.upgradeColor} text-white shadow-lg`}>
                        {planMeta.icon}
                      </div>
                      <div>
                        <p className="font-black text-base">خطة {planMeta.label}</p>
                        <p className="text-xs text-zinc-500">{planKey === "free" ? "مجاني" : "10,000 دج/شهر"}</p>
                      </div>
                    </div>
                    {planKey !== "gold" && (
                      <Button onClick={() => setLocation("/subscription")} className="gap-2 rounded-xl font-black bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 h-11">
                        <Crown className="h-4 w-4" /> ترقية الخطة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* ── Danger zone ── */}
            <SettingsSection icon={<Trash2 className="h-4 w-4" />} title="منطقة الخطر" subtitle="حذف الحساب لا يمكن التراجع عنه" color="text-red-400">
              <Card className="bg-red-500/[0.03] border-red-500/20 rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-sm text-white">حذف الحساب نهائياً</p>
                    <p className="text-xs text-zinc-500 mt-1">سيتم حذف جميع بياناتك من المنصة بشكل نهائي.</p>
                  </div>
                  <Button variant="destructive" className="gap-2 rounded-xl h-11"
                    onClick={() => { if (confirm("هل أنت متأكد من حذف حسابك نهائياً؟")) deleteMutation.mutate(); }}
                    disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" /> حذف حسابي
                  </Button>
                </CardContent>
              </Card>
            </SettingsSection>

          </motion.div>
        )}
      </main>

      <Footer />

      <CallUI
        callState={callState} callType={callType} remoteName={remoteName}
        isMuted={isMuted} isCamOff={isCamOff}
        localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef}
        onAccept={acceptCall} onReject={rejectCall} onEnd={endCall}
        onToggleMute={toggleMute} onToggleCamera={toggleCamera}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper components
// ══════════════════════════════════════════════════════════════════════════════

function SettingsSection({
  icon, title, subtitle, color = "text-primary", children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; color?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <h2 className="text-base font-heading font-black text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsCard({
  icon, title, color = "primary", children,
}: {
  icon: React.ReactNode; title: string; color?: string; children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/15 text-primary border-primary/20",
    green:   "bg-green-500/15 text-green-400 border-green-500/20",
    blue:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
    amber:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  return (
    <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
            {icon}
          </div>
          <h3 className="font-black text-sm">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
