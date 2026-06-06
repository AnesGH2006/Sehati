import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Phone, Video, ExternalLink, CheckCheck, X, ImageIcon, Mic, MicOff, Send, 
  Clock, Calendar, ArrowRight, Star, Quote, AlertCircle, CheckCircle2, 
  XCircle, ArrowUp, ArrowDown, Eye, Wifi, Crosshair, BadgeCheck, Save, 
  Crown, Trash2, Award, Copy, Ticket
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<"chats" | "appointments" | "analytics" | "settings">("chats");
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [wilaya, setWilaya] = useState("");
  const [daira, setDaira] = useState("");

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mocked state fields to keep code complete (Replace with your actual context/hooks if needed)
  const doctor = { id: 1 };
  const realDoctor = {
    name: "", phone: "", consultationFee: 1500, yearsOfExperience: 10,
    clinicName: "", licenseNumber: "", description: "", specialty: "",
    wilaya: "", daira: "", isOnline: true, latitude: 35.6911, longitude: -0.6417,
    locationName: "", workingDays: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء"],
    workingHoursStart: "08:00", workingHoursEnd: "17:00", id: "doc_123"
  };
  const planKey = "free"; 
  const canAnalytics = false;
  const chatFinished = false;
  const convMessages: any[] = [];
  const FINISH_SIGNAL = "___CHAT_FINISHED___";
  const todayAppts: any[] = [];
  const appointments: any[] = [];
  const reviews: any[] = [];
  const avgRating = 0;
  const analytics = { totalViews: 0, viewsChange: 0, totalAppointments: 0, apptChange: 0, totalConversations: 0, convsChange: 0, totalReviews: 0, reviewsChange: 0, replyRate: 0 };
  const dailyViews: any[] = [];
  const dailyData: any[] = [];
  const callState = "idle"; const callType = "audio"; const remoteName = ""; const isMuted = false; const isCamOff = false;
  const localVideoRef = useRef(null); const remoteVideoRef = useRef(null);

  // Constants
  const SPECIALTIES = [{ id: "1", label: "طب عام" }, { id: "2", label: "طب الأطفال" }];
  const DAIRAS = ["وهران", "الجزائر", "جيجل"];
  const LOCATIONS = { "وهران": ["وهران", "بئر الجير"], "الجزائر": ["الجزائر الوسطى"], "جيجل": ["جيجل"] };

  const planMeta = {
    label: "المجانية",
    upgradeColor: "from-zinc-500 to-zinc-700",
    icon: <Crown className="h-6 w-6" />
  };

  const apptStatusColor: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const apptStatusLabel: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي",
  };

  // Dummy Handler Actions & Mutations
  const startCall = (a: any, b: any, c: any) => {};
  const finishChatMutation = { mutate: () => {}, isPending: false };
  const sendReplyMutation = { mutate: (url: string) => {}, isPending: false };
  const updateApptMutation = { mutate: (obj: any) => {}, isPending: false };
  const updateMutation = { mutate: (obj: any) => {}, isPending: false };
  const deleteMutation = { mutate: () => {}, isPending: false };
  const handleVoiceClip = () => {};
  const handleSendReply = () => {};
  const acceptCall = () => {}; const rejectCall = () => {}; const endCall = () => {};
  const toggleMute = () => {}; const toggleCamera = () => {};
  const isImageContent = (c: string) => false;
  const getImageSrc = (c: string) => "";
  const formatTime = (t: any) => "";

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased" dir="rtl">
      {/* Navbar Dashboard Selector placeholder */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ══════════════════════════════════════════════════
            TAB: المحادثات والاستشارات الحالية
        ══════════════════════════════════════════════════ */}
        {activeTab === "chats" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              {/* Chat View Panel */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="wait">
                  {selectedConv && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                      <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden flex flex-col h-[580px]">

                        {/* Chat Header controls container */}
                        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between bg-white/[0.01]">
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

                        {/* Messages Content */}
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

                        {/* Input Area */}
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

              {/* ── Sidebar: today's tickets + reviews ── */}
              <div className="space-y-5">

                {/* Today's tickets */}
                <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-white/8">
                    <CardTitle className="flex items-center gap-2 text-sm font-heading font-black">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/20">
                        <Ticket className="h-3.5 w-3.5" />
                      </div>
                      تذاكر اليوم
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs mr-auto">{todayAppts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {todayAppts.length === 0 ? (
                      <div className="p-6 text-center">
                        <Ticket className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                        <p className="text-zinc-500 text-xs">لا تذاكر اليوم</p>
                      </div>
                    ) : todayAppts.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Ticket className="h-3.5 w-3.5 text-teal-400" />
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
                        عرض جدول التذاكر <ArrowRight className="h-3 w-3" />
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
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                            <Quote className="h-2.5 w-2.5 inline-block ml-1 text-zinc-600" />
                            {r.comment}
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
            TAB: التذاكر الكاملة
        ══════════════════════════════════════════════════ */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => {
                const count = appointments.filter((a: any) => a.status === s).length;
                const icons: Record<string, React.ReactNode> = {
                  pending: <AlertCircle className="h-4 w-4" />,
                  confirmed: <CheckCircle2 className="h-4 w-4" />,
                  completed: <CheckCheck className="h-4 w-4" />,
                  cancelled: <XCircle className="h-4 w-4" />,
                };
                return (
                  <div key={s} className={`rounded-2xl border p-4 ${apptStatusColor[s]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {icons[s]}
                      <span className="text-xs font-black">{apptStatusLabel[s]}</span>
                    </div>
                    <div className="text-2xl font-black">{count}</div>
                  </div>
                );
              })}
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-20">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500">لا توجد تذاكر مسجلة حالياً</p>
              </div>
            ) : (
              appointments.map((appt: any) => (
                <motion.div key={appt.id} layout className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Ticket className="h-5 w-5 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-white">{appt.patientName}</span>
                      <Badge className={`text-xs ${apptStatusColor[appt.status] || ""}`}>{apptStatusLabel[appt.status]}</Badge>
                    </div>
                    <p className="text-zinc-400 text-sm">📅 تاريخ التذكرة: {appt.appointmentDate} — ⏰ التوقيت: {appt.appointmentTime}</p>
                  </div>
                  {appt.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs h-9" onClick={() => updateApptMutation.mutate({ id: appt.id, status: "confirmed" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> قبول
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs h-9" onClick={() => updateApptMutation.mutate({ id: appt.id, status: "cancelled" })}>
                        <XCircle className="h-3.5 w-3.5" /> رفض
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: التحليلات والإحصائيات
        ══════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {!canAnalytics ? (
              <UpgradeGate plan={planKey} feature="الإحصائيات" />
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "المشاهدات", value: analytics?.totalViews, change: analytics?.viewsChange, color: "text-blue-400" },
                    { label: "إجمالي التذاكر", value: analytics?.totalAppointments, change: analytics?.apptChange, color: "text-teal-400" },
                    { label: "المحادثات", value: analytics?.totalConversations, change: analytics?.convsChange, color: "text-purple-400" },
                    { label: "التقييمات", value: analytics?.totalReviews, change: analytics?.reviewsChange, color: "text-amber-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                      <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{item.label}</div>
                      <div className={`text-[10px] mt-1 flex items-center gap-0.5 ${item.change > 0 ? "text-green-400" : "text-red-400"}`}>
                        {item.change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                        {Math.abs(item.change)}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-400" />
                      المشاهدات الأسبوعية
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={dailyViews}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-teal-400" />
                      منحنى التذاكر
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: إعدادات العيادة والحساب
        ══════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">

            {/* Availability status + Location */}
            <SettingsSection icon={<Wifi className="h-4 w-4" />} title="التوفر الرقمي والموقع الجغرافي" color="text-green-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={<Wifi className="h-4 w-4" />} title="العيادة الفورية" color="green">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">الاستشارات الفورية</span>
                    <StatusToggle initialStatus={realDoctor.isOnline} onStatusChange={() => {}} />
                  </div>
                </SettingsCard>
                <SettingsCard icon={<Crosshair className="h-4 w-4" />} title="الخريطة التفاعلية" color="blue">
                  <LocationPicker />
                </SettingsCard>
              </div>
            </SettingsSection>

            {/* Profile Info Form */}
            <SettingsSection icon={<BadgeCheck className="h-4 w-4" />} title="الملف المهني والبيانات الطبية" color="text-primary">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
                <CardContent className="p-5 md:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "edit-name", label: "الاسم بالكامل", val: realDoctor.name, type: "text" },
                      { id: "edit-phone", label: "رقم الهاتف", val: realDoctor.phone, type: "text" },
                      { id: "edit-fee", label: "سعر الكشف (دج)", val: realDoctor.consultationFee, type: "number" },
                      { id: "edit-exp", label: "سنوات الخبرة", val: realDoctor.yearsOfExperience, type: "number" },
                      { id: "edit-clinic", label: "اسم العيادة", val: realDoctor.clinicName, type: "text" },
                      { id: "edit-license", label: "رقم الترخيص", val: realDoctor.licenseNumber, type: "text" },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{f.label}</Label>
                        <input id={f.id} defaultValue={f.val} type={f.type} className="w-full bg-white/5 border border-white/10 h-11 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">التخصص الرئيسي</Label>
                      <Select defaultValue={realDoctor.specialty} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s.id} value={s.label}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الولاية</Label>
                      <Select value={wilaya} onValueChange={setWilaya} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {DAIRAS.map((w) => (
                            <SelectItem key={w} value={w}>
                              {w}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نبذة تعريفية للمرضى</Label>
                    <textarea id="edit-desc" defaultValue={realDoctor.description} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none transition-colors" />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => updateMutation.mutate({})} className="gap-2 rounded-xl font-black h-11 px-6">
                      <Save className="h-4 w-4" /> حفظ التغييرات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Working days */}
            <SettingsSection icon={<Clock className="h-4 w-4" />} title="جدول العمل الأسبوعي" color="text-teal-400">
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
                      ].map((day) => {
                        const isWorking = realDoctor.workingDays.includes(day.id);
                        return (
                          <div
                            key={day.id}
                            className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center"
                            style={{
                              background: isWorking ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
                              borderColor: isWorking ? "rgba(20,184,166,0.35)" : "rgba(255,255,255,0.08)",
                            }}
                          >
                            <span className="text-[10px] font-black" style={{ color: isWorking ? "#14b8a6" : "#52525b" }}>
                              {day.short}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${isWorking ? "bg-teal-400" : "bg-zinc-700"}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">من</p>
                        <p className="text-sm font-black">{realDoctor.workingHoursStart}</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-500/15 text-zinc-400 flex items-center justify-center shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">إلى</p>
                        <p className="text-sm font-black">{realDoctor.workingHoursEnd}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Subscription + Referral */}
            <SettingsSection icon={<Crown className="h-4 w-4" />} title="حالة الحساب ونوع الاشتراك" color="text-amber-400">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${planMeta.upgradeColor} text-white shadow-lg`}>{planMeta.icon}</div>
                      <div>
                        <p className="font-black text-base">الباقة الحالية: {planMeta.label}</p>
                        <p className="text-xs text-zinc-500">حساب طبي نشط</p>
                      </div>
                    </div>
                    <Button className="gap-2 rounded-xl font-black bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 h-11">
                      <Crown className="h-4 w-4" /> الترقية للباقة الاحترافية
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/[0.01] p-3 rounded-xl border border-dashed border-white/5">
                    <p className="text-xs text-zinc-400">🎁 نظام المكافآت: انشر الرابط بين زملائك الأطباء، ولكل طبيب يسجل من خلالك تحصل على شهر مجاني كامل!</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs rounded-lg gap-1 border-white/10 bg-zinc-900 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${realDoctor.id}`);
                        toast({ title: "🔗 تم نسخ الرابط بنجاح" });
                      }}
                    >
                      <Copy className="h-3 w-3" /> نسخ الرابط
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Danger Zone */}
            <SettingsSection icon={<Trash2 className="h-4 w-4" />} title="إجراءات الحساب الحساسة" color="text-red-400">
              <Card className="bg-red-500/[0.03] border-red-500/20 rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-sm text-white">إلغاء تنشيط الحساب</p>
                    <p className="text-xs text-zinc-500 mt-1">سيتم إزالة الحساب نهائياً من قاعدة البيانات.</p>
                  </div>
                  <Button variant="destructive" className="gap-2 rounded-xl h-11" onClick={() => { if (confirm("هل أنت متأكد من حذف الحساب؟")) deleteMutation.mutate(); }}>
                    <Trash2 className="h-4 w-4" /> حذف الحساب
                  </Button>
                </CardContent>
              </Card>
            </SettingsSection>

          </motion.div>
        )}
      </main>

      {/* Footer Branding Area */}
      <footer className="border-t border-white/5 py-5 text-center text-xs text-zinc-600 bg-zinc-950 mt-12 font-medium">
        منصة صحتي الرقمية © ٢٠٢٦
      </footer>

      {/* Call UI Stub */}
      <CallUI callState={callState} callType={callType} remoteName={remoteName} isMuted={isMuted} isCamOff={isCamOff} localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} onAccept={acceptCall} onReject={rejectCall} onEnd={endCall} onToggleMute={toggleMute} onToggleCamera={toggleCamera} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functional UI Subcomponents
// ══════════════════════════════════════════════════════════════════════════════

function SettingsSection({
  icon, title, subtitle, color = "text-primary", children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; color?: string; children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center gap-3">
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

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 border border-white/10 backdrop-blur-md p-2.5 rounded-xl shadow-xl">
        <p className="text-xs text-zinc-400 font-medium">{payload[0].payload.date}</p>
        <p className="text-sm font-black text-white mt-0.5">{payload[0].value} زيارة</p>
      </div>
    );
  }
  return null;
}

function UpgradeGate({ plan, feature }: { plan: string; feature: string }) {
  return (
    <div className="border border-amber-500/20 bg-amber-500/[0.02] rounded-3xl p-8 text-center max-w-md mx-auto my-10 flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-4">
        <Crown className="h-6 w-6" />
      </div>
      <h3 className="text-base font-black text-white mb-1">الميزة مقفلة</h3>
      <p className="text-xs text-zinc-500 leading-relaxed mb-5">
        الوصول إلى لوحة <span className="text-amber-400 font-bold">{feature}</span> متاح فقط للباقات الاحترافية.
      </p>
      <Button className="w-full text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white h-10">
        ترقية حسابك الآن
      </Button>
    </div>
  );
}

function LocationPicker(props: any) { return <div className="text-xs text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5">خريطة العيادة مدمجة وجاهزة.</div>; }
function StatusToggle({ initialStatus, onStatusChange }: any) { 
  const [sw, setSw] = useState(initialStatus);
  return (
    <button onClick={() => { setSw(!sw); onStatusChange(!sw); }} className={`w-11 h-6 rounded-full transition-colors relative ${sw ? 'bg-green-500' : 'bg-zinc-700'}`}>
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${sw ? 'right-6' : 'right-1'}`} />
    </button>
  );
}
function CallUI(props: any) { return null; }