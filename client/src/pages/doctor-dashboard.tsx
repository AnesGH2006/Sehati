import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import  { useDoctorLocation } from "@/hooks/useDoctorLocation";
import {
  MessageSquare, Star, Eye, Image as ImageIcon,
  MapPin, Save, BadgeCheck, Trash2, Upload, X,
  Phone, Mail, Briefcase, Banknote, Send, ArrowRight,
  Quote, Video, ExternalLink, CheckCheck, TrendingUp,
  BarChart2, ArrowUp, ArrowDown, Minus, Lock, Sparkles,
  Crown, Zap, Wifi, Crosshair, Mic, MicOff, Calendar,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS, DAIRAS, SPECIALTIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
// حدود الخطط
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    amber:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
    green:  "bg-green-500/15 text-green-400 border-green-500/20",
    teal:   "bg-teal-500/15 text-teal-400 border-teal-500/20",
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
    queryFn: () => fetch(`/api/appointments/doctor/${doctor?.id}`)
    .then(r => r.json())
    .then(data => Array.isArray(data) ? data : []),
    enabled:  !!doctor?.id,
  });
  const realDoctor = serverDoctor || doctor;

  const planKey      = getPlan(realDoctor?.subscriptionType);
  const planMeta     = PLAN_LIMITS[planKey];
  const canAnalytics = planMeta.analytics;

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors", doctor?.id, "reviews"],
    queryFn:  () => fetch(`/api/doctors/${doctor?.id}/reviews`).then(r => r.json()),
    enabled:  !!doctor?.id, refetchInterval: 30000,
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", String(doctor?.id)],
    queryFn:  () => fetch(`/api/conversations/${doctor?.id}?role=doctor`).then(r => r.json()),
    enabled:  !!doctor?.id, refetchInterval: 5000,
  });

  const { data: convMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", selectedConv?.id, "messages"],
    queryFn:  () => fetch(`/api/conversations/${selectedConv?.id}/messages`).then(r => r.json()),
    enabled:  !!selectedConv?.id, refetchInterval: 2000,
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/appointments/doctor", doctor?.id],
    queryFn:  () => fetch(`/api/appointments/doctor/${doctor?.id}`).then(r => r.json()),
    enabled:  !!doctor?.id, refetchInterval: 15000,
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/doctors", doctor?.id, "analytics"],
    queryFn:  () => fetch(`/api/doctors/${doctor?.id}/analytics`).then(r => r.json()),
    enabled:  !!doctor?.id && canAnalytics,
    refetchInterval: 60000, staleTime: 30000,
  });

  const chatFinished = (convMessages as any[]).some(
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
    onSuccess:  () => { logout(); queryClient.invalidateQueries({ queryKey: ["/api/doctors"] }); toast({ title: "تم حذف الحساب" }); setLocation("/"); },
  });

  const sendReplyMutation = useMutation({
    mutationFn: (content: string) => fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv?.id, senderId: String(doctor?.id), receiverId: selectedConv?.patientId, senderType: "doctor", content }),
    }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] }); setReplyText(""); },
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
    mutationFn: ({ id, status, doctorNotes }: { id: number; status: string; doctorNotes?: string }) =>
      fetch(`/api/appointments/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, doctorNotes }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor", doctor?.id] });
      toast({ title: "تم تحديث حالة الموعد" });
    },
    onError: () => toast({ title: "فشل تحديث الموعد", variant: "destructive" }),
  });

  const handleSendReply = () => { if (!replyText.trim() || chatFinished) return; sendReplyMutation.mutate(replyText); };

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

  if (!isLoggedIn || !isDoctor) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-heading font-bold">يجب تسجيل الدخول أولاً</h2>
            <Button onClick={() => setLocation("/subscription")} className="bg-primary">انضم كطبيب</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const dailyData    = analytics?.dailyConversations  || [];
  const dailyViews   = analytics?.dailyViews          || [];
  const pendingAppts = (appointments as any[]).filter(a => a.status === "pending");
  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayAppts   = (appointments as any[]).filter(a => a.appointmentDate === todayStr);

  const apptStatusColor: Record<string, string> = {
    pending:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  const apptStatusLabel: Record<string, string> = {
    pending: "⏳ انتظار", confirmed: "✅ مؤكد", cancelled: "❌ ملغي", completed: "🏁 مكتمل",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 relative z-10" dir="rtl">

        {/* ══ Hero Header Card ══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/10 rounded-3xl overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative group shrink-0">
                    <img
                      src={realDoctor?.imageUrl || `https://ui-avatars.com/api/?name=${doctor?.name}&background=2DD4BF&color=fff&size=200`}
                      alt={doctor?.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-primary/30"
                    />
                    {realDoctor?.isOnline && (
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 ring-2 ring-zinc-950" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                      <Upload className="h-5 w-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-heading font-black truncate">د. {realDoctor?.name || doctor?.name}</h1>
                      <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    </div>
                    <p className="text-zinc-400 text-sm mt-0.5 truncate">
                      🩺 {realDoctor?.specialty || doctor?.specialty} • {realDoctor?.wilaya ? `${realDoctor.wilaya} - ` : ""}{realDoctor?.daira || doctor?.daira}
                    </p>
                    {realDoctor?.clinicName && <p className="text-zinc-500 text-xs mt-0.5">🏥 {realDoctor.clinicName}</p>}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <StatusToggle
                        initialStatus={realDoctor?.isOnline ?? false}
                        onStatusChange={() => queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] })}
                      />
                      <Badge className={`text-xs border flex items-center gap-1 px-2.5 py-1 ${planMeta.color}`}>
                        {planMeta.icon}{planMeta.label}
                      </Badge>
                      {pendingAppts.length > 0 && (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs px-2.5 py-1">
                          <Calendar className="h-3 w-3 ml-1" /> {pendingAppts.length} موعد بانتظار
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 lg:gap-3 lg:w-auto lg:min-w-[480px]">
                  <MiniStat icon={<Eye className="h-3.5 w-3.5" />}           label="مشاهدات"  value={analytics?.totalViews          ?? 0} color="text-blue-400"   />
                  <MiniStat icon={<Calendar className="h-3.5 w-3.5" />}      label="مواعيد"   value={(appointments as any[]).length} color="text-teal-400"   />
                  <MiniStat icon={<MessageSquare className="h-3.5 w-3.5" />} label="محادثات"  value={analytics?.totalConversations  ?? conversations.length} color="text-purple-400" />
                  <MiniStat icon={<Star className="h-3.5 w-3.5" />}          label="تقييمات"  value={reviews.length}                 color="text-amber-400"  />
                </div>
              </div>
              {planKey !== "gold" && (
                <button onClick={() => setLocation("/subscription")}
                  className="mt-5 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-amber-400/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-sm font-black text-white truncate">طوّر حسابك واحصل على ميزات حصرية</p>
                      <p className="text-[11px] text-zinc-400 truncate">تحليلات متقدمة، ظهور أعلى، دعم مخصص</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:bg-violet-500/30 shrink-0">ترقية</span>
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══ Tabs ══ */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 mb-6 flex gap-1 overflow-x-auto">
          {[
            { key: "overview",      label: "نظرة عامة",    icon: <Eye className="h-4 w-4" /> },
            { key: "appointments",  label: "المواعيد",      icon: <Calendar className="h-4 w-4" />, badge: pendingAppts.length },
            { key: "analytics",     label: "التحليلات",     icon: <BarChart2 className="h-4 w-4" />, locked: !canAnalytics },
            { key: "settings",      label: "الإعدادات",     icon: <Save className="h-4 w-4" /> },
          ].map(tab => (
            <button key={tab.key}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab.key as any)}>
              {tab.icon}{tab.label}
              {(tab as any).badge > 0 && <span className="ml-1 bg-yellow-500 text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">{(tab as any).badge}</span>}
              {(tab as any).locked && <Lock className="h-3 w-3 opacity-60" />}
            </button>
          ))}
        </div>

        {/* ══ نظرة عامة ══ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard icon={<Eye className="h-4 w-4" />}           label="المشاهدات"  value={String(analytics?.totalViews         ?? "–")} change={analytics?.viewsChange}   color="blue"   />
              <KpiCard icon={<Calendar className="h-4 w-4" />}      label="المواعيد"   value={String(analytics?.totalAppointments  ?? (appointments as any[]).length)} change={analytics?.apptChange} color="teal"   />
              <KpiCard icon={<Star className="h-4 w-4" />}          label="التقييم"    value={analytics?.avgRating ? `${analytics.avgRating} ★` : (realDoctor?.rating || "0")} change={analytics?.reviewsChange} color="amber"  />
              <KpiCard icon={<TrendingUp className="h-4 w-4" />}    label="معدل الرد"  value={analytics?.replyRate != null ? `${analytics.replyRate}%` : "–"} color="green" />
            </div>

            {/* اليوم */}
            {todayAppts.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-black">
                    <Clock className="h-5 w-5 text-teal-400" /> مواعيد اليوم
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">{todayAppts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {todayAppts.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{a.patientName}</p>
                        <p className="text-zinc-400 text-xs">⏰ {a.appointmentTime} {a.patientPhone && `• 📞 ${a.patientPhone}`}</p>
                        {a.notes && <p className="text-zinc-500 text-xs italic mt-0.5">"{a.notes}"</p>}
                      </div>
                      <Badge className={`text-xs shrink-0 ${apptStatusColor[a.status] || ""}`}>{apptStatusLabel[a.status] || a.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* معلومات الطبيب */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem icon={<Mail />}       label="البريد الإلكتروني"  value={realDoctor?.email              || "–"} />
              <InfoItem icon={<Phone />}      label="الهاتف"             value={realDoctor?.phone              || "–"} />
              <InfoItem icon={<Banknote />}   label="سعر الكشف"          value={`${realDoctor?.consultationFee || "–"} دج`} />
              <InfoItem icon={<Briefcase />}  label="سنوات الخبرة"       value={`${realDoctor?.yearsOfExperience || "–"} سنوات`} />
              <InfoItem icon={<MapPin />}     label="الموقع"             value={`${realDoctor?.wilaya || ""} - ${realDoctor?.daira || "–"}`} />
              <InfoItem icon={<BadgeCheck />} label="التخصص"             value={realDoctor?.specialty || "–"} />
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
                          {conv.patientName?.[0] || "؟"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{conv.patientName || `مريض #${conv.patientId?.slice(-6)}`}</p>
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
                    <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden flex flex-col h-[70vh] min-h-[560px]">
                      <CardHeader className="p-4 border-b border-white/10 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/20 text-primary font-black text-sm">{selectedConv.patientName?.[0] || "؟"}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-bold text-sm">{selectedConv.patientName || `مريض #${selectedConv.patientId?.slice(-6)}`}</p>
                            <p className="text-xs text-green-400">{chatFinished ? "✅ تم إنهاء المحادثة" : "متصل"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "audio")} className="p-1.5 rounded-full bg-white/5 hover:bg-primary/20 text-zinc-400 hover:text-primary transition-colors"><Phone className="h-4 w-4" /></button>
                          <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "video")} className="p-1.5 rounded-full bg-white/5 hover:bg-primary/20 text-zinc-400 hover:text-primary transition-colors"><Video className="h-4 w-4" /></button>
                          <button onClick={() => setLocation(`/chat/${selectedConv.doctorId}`)} className="p-1.5 rounded-full bg-white/5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 transition-colors"><ExternalLink className="h-4 w-4" /></button>
                          {!chatFinished && convMessages.length > 0 && (
                            <button onClick={() => { if (confirm("هل تريد إنهاء هذه المحادثة؟")) finishChatMutation.mutate(); }} disabled={finishChatMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold border border-green-500/20">
                              <CheckCheck className="h-3.5 w-3.5" /> إنهاء
                            </button>
                          )}
                          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-zinc-400" onClick={() => setSelectedConv(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      </CardHeader>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={chatScrollRef}>
                        {convMessages.map((msg: any) => {
                          if (msg.content === FINISH_SIGNAL) return (
                            <div key={msg.id} className="flex items-center gap-2 my-2">
                              <div className="flex-1 h-px bg-green-500/20" />
                              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> أنهيت المحادثة</span>
                              <div className="flex-1 h-px bg-green-500/20" />
                            </div>
                          );
                          const isMe = msg.senderType === "doctor";
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                                {isImageContent(msg.content) ? <img src={getImageSrc(msg.content)} alt="صورة" className="max-w-full rounded-xl max-h-40 object-cover" /> : <p>{msg.content}</p>}
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
                                const file = e.target.files?.[0]; if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: reader.result }) }).then(r => r.json()).then(({ url }) => { if (url) sendReplyMutation.mutate(url); }).catch(() => {});
                                reader.readAsDataURL(file); e.target.value = "";
                              }} />
                            </label>
                            <button onClick={handleVoiceClip} className={`shrink-0 rounded-full p-1.5 transition-colors ${isRecordingVoice ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-primary"}`}>
                              {isRecordingVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>
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

            {/* التقييمات */}
            {reviews.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-black">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />تقييمات المرضى
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
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm">{review.patientName?.[0] || "؟"}</div>
                          <span className="font-bold text-sm">{review.patientName}</span>
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

        {/* ══ المواعيد ══ */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {(["pending","confirmed","completed","cancelled"] as const).map(s => {
                const count = (appointments as any[]).filter(a => a.status === s).length;
                const icons: any = { pending: <AlertCircle className="h-4 w-4" />, confirmed: <CheckCircle2 className="h-4 w-4" />, completed: <CheckCheck className="h-4 w-4" />, cancelled: <XCircle className="h-4 w-4" /> };
                return (
                  <div key={s} className={`rounded-2xl border p-4 ${apptStatusColor[s]}`}>
                    <div className="flex items-center gap-2 mb-1">{icons[s]}<span className="text-xs font-black uppercase">{apptStatusLabel[s]}</span></div>
                    <div className="text-2xl font-black">{count}</div>
                  </div>
                );
              })}
            </div>

            {(appointments as any[]).length === 0 ? (
              <div className="text-center py-20 text-zinc-500"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>لا توجد مواعيد بعد</p></div>
            ) : (appointments as any[]).map((appt: any) => (
              <motion.div key={appt.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-white">{appt.patientName}</span>
                    {appt.isUrgent && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">🚨 عاجل</Badge>}
                    <Badge className={`text-xs ${apptStatusColor[appt.status] || ""}`}>{apptStatusLabel[appt.status]}</Badge>
                  </div>
                  <p className="text-zinc-300 text-sm">📅 {appt.appointmentDate} — ⏰ {appt.appointmentTime}</p>
                  {appt.patientPhone && <p className="text-zinc-500 text-xs mt-0.5">📞 {appt.patientPhone}</p>}
                  {appt.notes && <p className="text-zinc-500 text-xs mt-0.5 italic">"{appt.notes}"</p>}
                </div>
                {appt.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="gap-1 rounded-xl bg-green-600 hover:bg-green-700 text-xs"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "confirmed" })}
                      disabled={updateApptMutation.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> تأكيد
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1 rounded-xl text-xs"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "cancelled" })}
                      disabled={updateApptMutation.isPending}>
                      <XCircle className="h-3.5 w-3.5" /> إلغاء
                    </Button>
                  </div>
                )}
                {appt.status === "confirmed" && (
                  <Button size="sm" className="gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs shrink-0"
                    onClick={() => updateApptMutation.mutate({ id: appt.id, status: "completed" })}
                    disabled={updateApptMutation.isPending}>
                    <CheckCheck className="h-3.5 w-3.5" /> إتمام
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ التحليلات ══ */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!canAnalytics ? <UpgradeGate plan={planKey} feature="صفحة التحليلات" /> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "المشاهدات",  value: analytics?.totalViews         ?? "–", change: analytics?.viewsChange   ?? 0, color: "text-blue-400" },
                    { label: "المواعيد",   value: analytics?.totalAppointments  ?? "–", change: analytics?.apptChange    ?? 0, color: "text-teal-400" },
                    { label: "المحادثات", value: analytics?.totalConversations  ?? "–", change: analytics?.convsChange   ?? 0, color: "text-purple-400" },
                    { label: "التقييمات", value: analytics?.totalReviews        ?? "–", change: analytics?.reviewsChange ?? 0, color: "text-amber-400" },
                    { label: "معدل الرد", value: analytics?.replyRate != null ? `${analytics.replyRate}%` : "–", change: 0, color: "text-green-400" },
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
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-400" />المواعيد — آخر 7 أيام</p>
                    {dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} /><YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={2} dot={{ r: 3, fill: "#14B8A6" }} activeDot={{ r: 5 }} /></LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[180px] flex items-center justify-center text-zinc-600 text-sm">لا توجد بيانات كافية</div>}
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ الإعدادات ══ */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
            <section>
              <SectionHeader icon={<MapPin className="h-4 w-4" />} title="التوفر والموقع" subtitle="تحكّم في ظهورك وحدّد موقع عيادتك على الخريطة" color="text-green-400" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center"><Wifi className="h-4 w-4" /></div>
                      <h3 className="font-black text-sm">حالة التوفر</h3>
                    </div>
                    <StatusToggle variant="full" initialStatus={realDoctor?.isOnline ?? false}
                      onStatusChange={(status) => { queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] }); toast({ title: status ? "✅ أنت الآن متاح" : "⏸️ تم إخفاؤك" }); }} />
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center"><Crosshair className="h-4 w-4" /></div>
                      <h3 className="font-black text-sm">موقع العيادة</h3>
                    </div>
                    <LocationPicker initialLat={realDoctor?.latitude} initialLng={realDoctor?.longitude}
                      initialName={realDoctor?.locationName || realDoctor?.wilaya || ""}
                      onSaved={() => { queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctor?.id] }); toast({ title: "📍 تم حفظ موقعك" }); }} />
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <SectionHeader icon={<BadgeCheck className="h-4 w-4" />} title="المعلومات المهنية" subtitle="حرّر بياناتك الطبية ومعلومات العيادة" color="text-primary" />
              <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
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
                          className="w-full bg-white/5 border border-white/10 h-11 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-primary/50" />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">التخصص</Label>
                      <Select defaultValue={realDoctor?.specialty} onValueChange={v => updateMutation.mutate({ specialty: v })} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">{SPECIALTIES.map(s => <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الولاية</Label>
                      <Select value={wilaya} onValueChange={v => { setWilaya(v); setDaira((LOCATIONS as any)[v]?.[0] || ""); }} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">{DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الدائرة</Label>
                      <Select value={daira} onValueChange={setDaira} disabled={!wilaya} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">{wilaya && (LOCATIONS as any)[wilaya]?.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نبذة تعريفية</Label>
                    <textarea id="edit-desc" defaultValue={realDoctor?.description || ""} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="اكتب نبذة عن تخصصك وخبرتك..." />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => {
                      const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
                      updateMutation.mutate({
                        name: g("edit-name"), phone: g("edit-phone"),
                        consultationFee: parseInt(g("edit-fee")),
                        yearsOfExperience: parseInt(g("edit-exp")),
                        clinicName: g("edit-clinic"), licenseNumber: g("edit-license"),
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
              <SectionHeader icon={<Crown className="h-4 w-4" />} title="خطة الاشتراك" color="text-amber-400" />
              <Card className="bg-white/[0.03] border-white/10 rounded-2xl overflow-hidden">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${planMeta.upgradeColor} text-white shadow-lg`}>{planMeta.icon}</div>
                      <div>
                        <p className="font-black text-lg">خطة {planMeta.label}</p>
                        <p className="text-xs text-zinc-500">{planKey === "free" ? "مجاني" : planKey === "standard" ? "2,000 دج/شهر" : planKey === "pro" ? "3,000 دج/شهر" : "5,000 دج/شهر"}</p>
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
            </section>

            <section>
              <SectionHeader icon={<Trash2 className="h-4 w-4" />} title="منطقة الخطر" subtitle="حذف الحساب لا يمكن التراجع عنه" color="text-red-400" />
              <Card className="bg-red-500/[0.03] border-red-500/20 rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-sm text-white">حذف الحساب نهائياً</p>
                    <p className="text-xs text-zinc-500 mt-1">سيتم حذف جميع بياناتك من المنصة بشكل نهائي.</p>
                  </div>
                  <Button variant="destructive" className="gap-2 rounded-xl h-11"
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
        {icon}<span className="text-lg font-black font-heading">{value}</span>
      </div>
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, color = "text-primary" }: { icon: React.ReactNode; title: string; subtitle?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <h2 className="text-base font-heading font-black text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}