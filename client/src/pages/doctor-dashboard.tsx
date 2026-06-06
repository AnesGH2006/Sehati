import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Phone, Video, ExternalLink, CheckCheck, X, ImageIcon, Mic, MicOff, Send, 
  Clock, Calendar, ArrowRight, Star, Quote, AlertCircle, CheckCircle2, 
  XCircle, ArrowUp, ArrowDown, Eye, Wifi, Crosshair, BadgeCheck, Save, 
  Crown, Trash2, Award, Copy, MessageSquare
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
  const [wilaya, setWilaya] = useState("وهران");
  const [daira, setDaira] = useState("وهران");

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mocked state fields populated with viewable data for presentation
  const doctor = { id: 1 };
  const realDoctor = {
    name: "د. عبد الرحمن", phone: "0661234567", consultationFee: 1500, yearsOfExperience: 12,
    clinicName: "عيادة الشفاء الطبية", licenseNumber: "DZ-2026-99", description: "طبيب متخصص في الرعاية الصحية الأولية ومتابعة الحالات المزمنة.", specialty: "طب عام",
    wilaya: "وهران", daira: "وهران", isOnline: true, latitude: 35.6911, longitude: -0.6417,
    locationName: "حي العقيد لطفي، وهران", workingDays: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء"],
    workingHoursStart: "08:00", workingHoursEnd: "17:00", id: "doc_123"
  };
  const planKey = "free"; 
  const canAnalytics = true; // Set to true so charts are visible immediately
  const chatFinished = false;
  const convMessages: any[] = [
    { id: 1, content: "مرحباً دكتور، أعاني من صداع مستمر منذ يومين.", senderType: "patient", createdAt: new Date() },
    { id: 2, content: "أهلاً بك. هل الصداع مصحوب بزغللة في العين أو ارتفاع في ضغط الدم؟", senderType: "doctor", createdAt: new Date() }
  ];
  const FINISH_SIGNAL = "___CHAT_FINISHED___";

  // Viewable Mock Data to fully populate dashboard panels
  const todayAppts: any[] = [
    { id: "a1", patientName: "كريم بلقاسم", appointmentTime: "10:30", status: "confirmed" },
    { id: "a2", patientName: "أمال زروقي", appointmentTime: "13:00", status: "pending" }
  ];
  const appointments: any[] = [
    { id: "a1", patientName: "كريم بلقاسم", appointmentDate: "2026-06-06", appointmentTime: "10:30", status: "confirmed", patientPhone: "0555123456", notes: "مراجعة دورية للسكر" },
    { id: "a2", patientName: "أمال زروقي", appointmentDate: "2026-06-06", appointmentTime: "13:00", status: "pending", patientPhone: "0770987654", isUrgent: true },
    { id: "a3", patientName: "يوسف بومدين", appointmentDate: "2026-06-07", appointmentTime: "09:15", status: "completed" }
  ];
  const reviews: any[] = [
    { id: "r1", patientName: "سليم. م", rating: 5, comment: "طبيب ممتاز ومستمع جيد، تشخيصه كان دقيقاً جداً وعاملني باحترافية." },
    { id: "r2", patientName: "فاطمة. ع", rating: 4, comment: "العيادة نظيفة والتعامل راقٍ، واجهت فقط تأخيراً بسيطاً في الموعد." }
  ];
  const avgRating = 4.8;
  const analytics = { totalViews: 342, viewsChange: 12, totalAppointments: 48, apptChange: 8, totalConversations: 19, convsChange: 15, totalReviews: 14, reviewsChange: 4, replyRate: 95 };

  const dailyViews: any[] = [
    { date: "05/31", count: 24 }, { date: "06/01", count: 35 }, { date: "06/02", count: 42 },
    { date: "06/03", count: 29 }, { date: "06/04", count: 51 }, { date: "06/05", count: 68 }, { date: "06/06", count: 93 }
  ];
  const dailyData: any[] = [
    { date: "05/31", count: 2 }, { date: "06/01", count: 5 }, { date: "06/02", count: 4 },
    { date: "06/03", count: 7 }, { date: "06/04", count: 6 }, { date: "06/05", count: 9 }, { date: "06/06", count: 11 }
  ];

  // Dummy Conversations List for Fallback UI Screen
  const fallbackConversations = [
    { id: "c1", patientId: "p1", patientName: "أحمد بن عودة", clinicName: "استشارة طب عام ممتدة", time: "منذ 5 دقائق" },
    { id: "c2", patientId: "p2", patientName: "عائشة جيلالي", clinicName: "متابعة نتائج التحاليل السنوية", time: "منذ ساعتين" }
  ];

  const callState = "idle"; const callType = "audio"; const remoteName = ""; const isMuted = false; const isCamOff = false;
  const localVideoRef = useRef(null); const remoteVideoRef = useRef(null);

  // Constants
  const SPECIALTIES = [{ id: "1", label: "طب عام" }, { id: "2", label: "طب الأطفال" }, { id: "3", label: "طب أمراض القلب" }];
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
  const startCall = (a: any, b: any, c: any) => { toast({ title: "📞 جاري الاتصال بالمنصة..." }); };
  const finishChatMutation = { mutate: () => { toast({ title: "✅ تم إنهاء الاستشارة بنجاح" }); }, isPending: false };
  const sendReplyMutation = { mutate: (url: string) => {}, isPending: false };
  const updateApptMutation = { mutate: (obj: any) => { toast({ title: "📅 تم تحديث حالة الموعد" }); }, isPending: false };
  const updateMutation = { mutate: (obj: any) => { toast({ title: "💾 تم حفظ التغييرات بنجاح" }); }, isPending: false };
  const deleteMutation = { mutate: () => {}, isPending: false };
  const handleVoiceClip = () => { setIsRecordingVoice(!isRecordingVoice); };
  const handleSendReply = () => { if(replyText.trim()) { setReplyText(""); toast({ title: "✉️ تم إرسال الرسالة" }); } };
  const acceptCall = () => {}; const rejectCall = () => {}; const endCall = () => {};
  const toggleMute = () => {}; const toggleCamera = () => {};
  const isImageContent = (c: string) => false;
  const getImageSrc = (c: string) => "";
  const formatTime = (t: any) => "19:30";

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased" dir="rtl">
      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ══════════════════════════════════════════════════
            Dashboard Navigation Tab Bar Control
        ══════════════════════════════════════════════════ */}
        <div className="flex gap-2 border-b border-white/5 pb-4 mb-6 overflow-x-auto scrollbar-none">
          {[
            { id: "chats", label: "💬 الاستشارات الحالية" },
            { id: "appointments", label: "📅 إدارة المواعيد" },
            { id: "analytics", label: "📊 الإحصائيات والتحليلات" },
            { id: "settings", label: "⚙️ إعدادات العيادة" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB: المحادثات والاستشارات الحالية
        ══════════════════════════════════════════════════ */}
        {activeTab === "chats" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              {/* Left/Center Panel: Active Chat Room or Selection Fallback List */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="wait">
                  {selectedConv ? (
                    <motion.div key="active-chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                      <Card className="bg-white/[0.03] border-white/8 rounded-3xl overflow-hidden flex flex-col h-[580px]">

                        {/* Chat Header controls container */}
                        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between bg-white/[0.01]">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm">
                              {selectedConv.patientName?.[0] || "م"}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">{selectedConv.patientName}</h3>
                              <p className="text-[10px] text-green-400 flex items-center gap-1">● في الانتظار بالعيادة الافتراضية</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "audio")} className="p-2 rounded-xl bg-white/5 hover:bg-primary/15 text-zinc-400 hover:text-primary transition-colors"><Phone className="h-4 w-4" /></button>
                            <button onClick={() => startCall(selectedConv.patientId, selectedConv.patientName || "مريض", "video")} className="p-2 rounded-xl bg-white/5 hover:bg-primary/15 text-zinc-400 hover:text-primary transition-colors"><Video className="h-4 w-4" /></button>
                            <button onClick={() => setLocation(`/chat/${selectedConv.doctorId}`)} className="p-2 rounded-xl bg-white/5 hover:bg-blue-500/15 text-zinc-400 hover:text-blue-400 transition-colors"><ExternalLink className="h-4 w-4" /></button>
                            {!chatFinished && convMessages.length > 0 && (
                              <button
                                onClick={() => { if (confirm("هل تريد إنهاء هذه المحادثة وحفظ ملف المريض؟")) finishChatMutation.mutate(); }}
                                disabled={finishChatMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-bold border border-green-500/20"
                              >
                                <CheckCheck className="h-3.5 w-3.5" /> إنهاء الاستشارة
                              </button>
                            )}
                            <button onClick={() => setSelectedConv(null)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Messages Content Room */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatScrollRef}>
                          {convMessages.map((msg: any) => {
                            const isMe = msg.senderType === "doctor";
                            return (
                              <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                                  <p>{msg.content}</p>
                                  <span className="text-[10px] opacity-50 mt-0.5 block text-left">{formatTime(msg.createdAt)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input Area Interface */}
                        <div className="px-4 py-3 border-t border-white/8">
                          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/8">
                            <label className="cursor-pointer text-zinc-500 hover:text-primary transition-colors shrink-0">
                              <ImageIcon className="h-4 w-4" />
                              <input type="file" accept="image/*" className="hidden" />
                            </label>
                            <button onClick={handleVoiceClip} className={`shrink-0 p-1 transition-colors rounded-lg ${isRecordingVoice ? "bg-red-500/20 text-red-400" : "text-zinc-500 hover:text-primary"}`}>
                              {isRecordingVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>
                            <input
                              type="text"
                              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-zinc-600"
                              placeholder="اكتب توجيهاتك الطبية هنا..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleSendReply()}
                            />
                            <button
                              onClick={handleSendReply}
                              disabled={!replyText.trim()}
                              className="p-1.5 bg-primary rounded-xl text-white disabled:opacity-30 transition-all hover:bg-primary/80 shrink-0"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    /* Dynamic Fallback Screen fixing the layout void */
                    <motion.div key="fallback-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-6 h-[580px] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-black font-heading text-white">الاستشارات الطبية والطلبات الواردة</h3>
                          </div>
                          <p className="text-xs text-zinc-500 mb-5">اضغط على ملف المريض لفتح لوحة الاستشارة الفورية ومراجعة الرسائل أو بدء المكالمة الطبية:</p>

                          <div className="space-y-3">
                            {fallbackConversations.map((c) => (
                              <div 
                                key={c.id} 
                                onClick={() => setSelectedConv(c)}
                                className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/5 cursor-pointer transition-all duration-200 group border-r-4 border-r-primary"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                                    {c.patientName[0]}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.patientName}</h4>
                                    <p className="text-xs text-zinc-500">{c.clinicName}</p>
                                  </div>
                                </div>
                                <div className="text-left flex flex-col items-end gap-1">
                                  <span className="text-[11px] text-zinc-500">{c.time}</span>
                                  <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">قيد الانتظار</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-center text-xs text-zinc-600 border-t border-white/5 pt-4">
                          💡 يمكنك إدارة أوقات عيادتك وتغيير سعر الكشف عبر الانتقال إلى تبويب <b>إعدادات العيادة</b> في الأعلى.
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Sidebar: Today's Appointments + Reviews */}
              <div className="space-y-5">

                {/* Today's appointments panel */}
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
                      <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
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
                        className="w-full py-3 text-xs text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-white/5 font-bold"
                      >
                        عرض جدول المواعيد بالكامل <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </CardContent>
                </Card>

                {/* Reviews summary panel */}
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
            TAB: المواعيد الكاملة
        ══════════════════════════════════════════════════ */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Status summary tiles */}
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

            {/* Appointment listings view stack */}
            {appointments.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500">لا توجد مواعيد مسجلة حالياً</p>
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
                    {appt.isUrgent && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30 animated-pulse">🚨 كشف عاجل</Badge>}
                    <Badge className={`text-xs ${apptStatusColor[appt.status] || ""}`}>{apptStatusLabel[appt.status]}</Badge>
                  </div>
                  <p className="text-zinc-400 text-sm">📅 تاريخ الكشف: {appt.appointmentDate} — ⏰ التوقيت: {appt.appointmentTime}</p>
                  {appt.patientPhone && <p className="text-zinc-500 text-xs mt-0.5">📞 رقم التواصل: {appt.patientPhone}</p>}
                  {appt.notes && <p className="text-zinc-600 text-xs mt-0.5 italic">"{appt.notes}"</p>}
                </div>
                {appt.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs h-9"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "confirmed" })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> قبول وتأكيد
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs h-9"
                      onClick={() => updateApptMutation.mutate({ id: appt.id, status: "cancelled" })}>
                      <XCircle className="h-3.5 w-3.5" /> رفض
                    </Button>
                  </div>
                )}
                {appt.status === "confirmed" && (
                  <Button size="sm" className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs shrink-0 h-9"
                    onClick={() => updateApptMutation.mutate({ id: appt.id, status: "completed" })}>
                    <CheckCheck className="h-3.5 w-3.5" /> إتمام الكشف وإغلاق الملف
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: التحليلات والإحصائيات
        ══════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {!canAnalytics ? <UpgradeGate plan={planKey} feature="صفحة الإحصائيات المتقدمة" /> : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "زيارات العيادة",  value: analytics?.totalViews, change: analytics?.viewsChange, color: "text-blue-400" },
                    { label: "إجمالي المواعيد", value: analytics?.totalAppointments, change: analytics?.apptChange, color: "text-teal-400" },
                    { label: "المحادثات",  value: analytics?.totalConversations, change: analytics?.convsChange, color: "text-purple-400" },
                    { label: "التقييمات", value: analytics?.totalReviews, change: analytics?.reviewsChange, color: "text-amber-400" },
                    { label: "معدل الرد الفوري", value: `${analytics.replyRate}%`, change: 0, color: "text-green-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                      <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{item.label}</div>
                      {item.change !== 0 && (
                        <div className={`text-[10px] mt-1 flex items-center gap-0.5 ${item.change > 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}{Math.abs(item.change)}% هذا الشهر
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Eye className="h-4 w-4 text-blue-400" />معدل مشاهدات المرضى لملفك — آخر 7 أيام</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={dailyViews}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card className="bg-white/[0.03] border-white/8 rounded-3xl p-5">
                    <p className="text-sm font-black mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-teal-400" />منحنى الحجوزات والمواعيد — آخر 7 أيام</p>
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
            <SettingsSection icon={<Wifi className="h-4 w-4" />} title="التوفر الرقمي والموقع الجغرافي" subtitle="تحكّم في ظهورك الفوري للمرضى في ولايتك" color="text-green-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={<Wifi className="h-4 w-4" />} title="العيادة الفورية (Online)" color="green">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">استقبال مكالمات واستشارات فورية الآن</span>
                    <StatusToggle initialStatus={realDoctor.isOnline} onStatusChange={(s: boolean) => toast({ title: "تم تحديث حالة التوفر" })} />
                  </div>
                </SettingsCard>
                <SettingsCard icon={<Crosshair className="h-4 w-4" />} title="الخريطة التفاعلية" color="blue">
                  <LocationPicker
                    initialLat={realDoctor.latitude} initialLng={realDoctor.longitude}
                    initialName={realDoctor.locationName}
                    onSaved={() => toast({ title: "📍 تم حفظ إحداثيات العيادة" })} />
                </SettingsCard>
              </div>
            </SettingsSection>

            {/* Medical Professional Profile Info Form */}
            <SettingsSection icon={<BadgeCheck className="h-4 w-4" />} title="الملف المهني والبيانات الطبية" subtitle="تحديث معلومات العيادة التي تظهر في نتائج البحث" color="text-primary">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
                <CardContent className="p-5 md:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "edit-name",    label: "الاسم الطبي بالكامل",  val: realDoctor.name,              type: "text" },
                      { id: "edit-phone",   label: "رقم هاتف العيادة للتواصل", val: realDoctor.phone,         type: "text" },
                      { id: "edit-fee",     label: "سعر الكشف الاستشاري (دج)", val: realDoctor.consultationFee,   type: "number" },
                      { id: "edit-exp",     label: "عدد سنوات الخبرة المهنية",  val: realDoctor.yearsOfExperience, type: "number" },
                      { id: "edit-clinic",  label: "اسم العيادة الخاص بك",       val: realDoctor.clinicName,        type: "text" },
                      { id: "edit-license", label: "رقم الترخيص الصادر من وزارة الصحة", val: realDoctor.licenseNumber, type: "text" },
                    ].map(f => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{f.label}</Label>
                        <input id={f.id} defaultValue={f.val} type={f.type}
                          className="w-full bg-white/5 border border-white/10 h-11 rounded-xl text-white px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors" />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">التخصص الرئيسي</Label>
                      <Select defaultValue={realDoctor.specialty} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {SPECIALTIES.map(s => <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">الولاية المستهدفة</Label>
                      <Select value={wilaya} onValueChange={v => { setWilaya(v); setDaira((LOCATIONS as any)[v]?.[0] || ""); }} dir="rtl">
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                          {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نبذة تعريفية للمرضى (تعرض بالصفحة الشخصية)</Label>
                    <textarea id="edit-desc" defaultValue={realDoctor.description} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none transition-colors" />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => updateMutation.mutate({})} className="gap-2 rounded-xl font-black h-11 px-6">
                      <Save className="h-4 w-4" /> حفظ كل البيانات الطبية
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Working days schedule system */}
            <SettingsSection icon={<Clock className="h-4 w-4" />} title="أوقات الدوام وجدول العمل الأسبوعي" subtitle="تحديد متى يستطيع المرضى حجز موعد فعلي" color="text-teal-400">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">أيام العمل المتاحة للحجز</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { id: "السبت", short: "سبت" }, { id: "الأحد", short: "أحد" },
                        { id: "الاثنين", short: "اثن" }, { id: "الثلاثاء", short: "ثلث" },
                        { id: "الأربعاء", short: "أرب" }, { id: "الخميس", short: "خمس" },
                        { id: "الجمعة", short: "جمع" },
                      ].map(day => {
                        const isWorking = realDoctor.workingDays.includes(day.id);
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
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">يبدأ استقبال الحالات من</p>
                        <p className="text-sm font-black">{realDoctor.workingHoursStart}</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-500/15 text-zinc-400 flex items-center justify-center shrink-0"><Clock className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">ينتهي الدوام الفعلي عند</p>
                        <p className="text-sm font-black">{realDoctor.workingHoursEnd}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Subscription + Referral system integration */}
            <SettingsSection icon={<Crown className="h-4 w-4" />} title="حالة ونوع اشتراك الطبيب" color="text-amber-400">
              <Card className="bg-white/[0.03] border-white/8 rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${planMeta.upgradeColor} text-white shadow-lg`}>
                        {planMeta.icon}
                      </div>
                      <div>
                        <p className="font-black text-base">باقة صحتي الحالية: {planMeta.label}</p>
                        <p className="text-xs text-zinc-500">حساب طبي مجاني نشط مدى الحياة</p>
                      </div>
                    </div>
                    <Button className="gap-2 rounded-xl font-black bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 h-11">
                      <Crown className="h-4 w-4" /> الترقية للباقة الذهبية
                    </Button>
                  </div>

                  {/* Referral Marketing business feature */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/[0.01] p-3 rounded-xl border border-dashed border-white/5">
                    <p className="text-xs text-zinc-400">
                      🎁 نظام المكافآت: انشر الرابط بين زملائك الأطباء، ولكل طبيب يسجل من خلالك تحصل على <b>شهر مجاني كامل</b> في الباقة الاحترافية!
                    </p>
                    <Button 
                      size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1 border-white/10 bg-zinc-900 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${realDoctor.id}`);
                        toast({ title: "🔗 تم نسخ رابط الإحالة الخاص بك بنجاح" });
                      }}
                    >
                      <Copy className="h-3 w-3" /> نسخ رابط الإحالة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Danger Zone account deletion */}
            <SettingsSection icon={<Trash2 className="h-4 w-4" />} title="إجراءات أمان الحساب الحساسة" subtitle="حذف الحساب نهائياً من قاعدة بيانات المنصة" color="text-red-400">
              <Card className="bg-red-500/[0.03] border-red-500/20 rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-sm text-white">إلغاء وتدمير ملف الطبيب بشكل نهائي</p>
                    <p className="text-xs text-zinc-500 mt-1">سيتم إزالة وحذف كافة تقارير استشارات المرضى والمواعيد المسجلة نهائياً.</p>
                  </div>
                  <Button variant="destructive" className="gap-2 rounded-xl h-11" onClick={() => { if (confirm("هل أنت متأكد من حذف الحساب نهائياً؟")) deleteMutation.mutate(); }}>
                    <Trash2 className="h-4 w-4" /> تدمير الحساب
                  </Button>
                </CardContent>
              </Card>
            </SettingsSection>

          </motion.div>
        )}
      </main>

      {/* Footer Branding Area */}
      <footer className="border-t border-white/5 py-5 text-center text-xs text-zinc-600 bg-zinc-950 mt-12 font-medium">
        منصة صحتي الرقمية لرعاية وخدمة الأطباء الحرفيين © ٢٠٢٦
      </footer>

      {/* Call UI Stub integration to shield compilation stability */}
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
        الوصول إلى لوحة <span className="text-amber-400 font-bold">{feature}</span> متاح فقط للشركاء في الباقات الاحترافية والذهبية.
      </p>
      <Button className="w-full text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white h-10">
        ترقية حسابك الآن
      </Button>
    </div>
  );
}

// Global UI Stubs to isolate code errors during rendering preview
function LocationPicker(props: any) { return <div className="text-xs text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5">خريطة العيادة التفاعلية (OpenStreetMap & Leaflet.js) مدمجة وجاهزة للعمل الفوري.</div>; }
function StatusToggle({ initialStatus, onStatusChange }: any) { 
  const [sw, setSw] = useState(initialStatus);
  return (
    <button onClick={() => { setSw(!sw); onStatusChange(!sw); }} className={`w-11 h-6 rounded-full transition-colors relative ${sw ? 'bg-green-500' : 'bg-zinc-700'}`}>
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${sw ? 'right-6' : 'right-1'}`} />
    </button>
  );
}
function CallUI(props: any) { return null; }