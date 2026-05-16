import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Shield, LogOut, Eye, EyeOff, Users, Star, UserCheck, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast"

const ADMIN_STORAGE_KEY = "tabib_admin_session";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthed, setIsAuthed] = useState(() => {
    try { return !!localStorage.getItem(ADMIN_STORAGE_KEY); } catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"doctors" | "users" | "chats" | "reviews" | "appointments">("doctors");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAuthed) {
      fetch("/api/admin/check").then(r => r.json()).then(d => {
        if (!d.isAdmin) { setIsAuthed(false); localStorage.removeItem(ADMIN_STORAGE_KEY); }
      });
    }
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.success) {
        setIsAuthed(true); localStorage.setItem(ADMIN_STORAGE_KEY, "1");
        toast({ title: "مرحباً بك يا أدمن 👋" });
      } else toast({ title: "كلمة المرور غير صحيحة", variant: "destructive" });
    } catch { toast({ title: "خطأ في الاتصال", variant: "destructive" }); }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAuthed(false);
  };

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: () => fetch("/api/doctors").then(r => r.json()),
    enabled: isAuthed, refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
    enabled: isAuthed, refetchInterval: 5000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/admin/conversations"],
    queryFn: () => fetch("/api/admin/conversations").then(r => r.json()),
    enabled: isAuthed, refetchInterval: 5000,
  });

  const { data: allReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const doctorList = await fetch("/api/doctors").then(r => r.json());
      const reviewArrays = await Promise.all(
        doctorList.map((d: any) =>
          fetch(`/api/doctors/${d.id}/reviews`).then(r => r.ok ? r.json() : [])
            .then((reviews: any[]) => reviews.map(rv => ({ ...rv, doctorName: d.name }))).catch(() => [])
        )
      );
      return reviewArrays.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: isAuthed && activeTab === "reviews", refetchInterval: 10000,
  });

  const { data: allAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/admin/appointments"],
    queryFn: async () => {
      const doctorList = await fetch("/api/doctors").then(r => r.json());
      const apptArrays = await Promise.all(
        doctorList.map((d: any) =>
          fetch(`/api/appointments/doctor/${d.id}`).then(r => r.ok ? r.json() : [])
            .then((appts: any[]) => appts.map(a => ({ ...a, doctorName: d.name }))).catch(() => [])
        )
      );
      return apptArrays.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: isAuthed && activeTab === "appointments", refetchInterval: 10000,
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/doctors/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/doctors"] }); toast({ title: "تم حذف الطبيب" }); },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/users/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "تم حذف المستخدم" }); },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const verifyUserMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/users/${id}/verify`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "تم تفعيل الحساب ✅" }); },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/reviews/${id}`, { method: "DELETE" }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] }); toast({ title: "✅ تم حذف التقييم" }); },
    onError: () => toast({ title: "فشل حذف التقييم", variant: "destructive" }),
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/appointments/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/appointments"] }); toast({ title: "✅ تم حذف الموعد" }); },
    onError: () => toast({ title: "فشل حذف الموعد", variant: "destructive" }),
  });

  const statusColors: Record<string, string> = {
    pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const statusLabels: Record<string, string> = {
    pending: "⏳ انتظار", confirmed: "✅ مؤكد", cancelled: "❌ ملغي", completed: "🏁 مكتمل",
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-10 bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-black text-white">لوحة الادارة</h1>
            <p className="text-zinc-400 text-sm">أدخل كلمة المرور للوصول</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-zinc-500 text-center text-xl pr-12" />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button onClick={handleLogin} disabled={loginLoading || !password}
              className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90">
              {loginLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
      <div className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-heading font-black text-xl">لوحة الأدمن — منصة الأطباء</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-sm font-bold">
            <span className="text-zinc-400">{doctors.length} <span className="text-white">طبيب</span></span>
            <span className="text-zinc-400">{(users as any[]).length} <span className="text-white">مستخدم</span></span>
            <span className="text-zinc-400">{conversations.length} <span className="text-white">محادثة</span></span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-zinc-400 hover:text-white">
            <LogOut className="h-4 w-4" /> خروج
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex gap-3 flex-wrap">
          {([
            { key: "doctors",      label: `الأطباء (${doctors.length})`,                   Icon: Users },
            { key: "users",        label: `المستخدمون (${(users as any[]).length})`,        Icon: UserCheck },
            { key: "chats",        label: `المحادثات (${conversations.length})`,            Icon: MessageSquare },
            { key: "reviews",      label: `التقييمات (${allReviews.length})`,               Icon: Star },
            { key: "appointments", label: `المواعيد (${allAppointments.length})`,           Icon: Calendar },
          ] as any[]).map(({ key, label, Icon }) => (
            <Button key={key} variant={activeTab === key ? "default" : "outline"}
              onClick={() => setActiveTab(key)} className="gap-2 rounded-2xl font-black">
              <Icon className="h-4 w-4" /> {label}
            </Button>
          ))}
        </div>

        {/* Doctors */}
        {activeTab === "doctors" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {doctors.length === 0 ? <div className="text-center py-20 text-zinc-500">لا يوجد أطباء</div> : (
              doctors.map((doctor: any) => (
                <motion.div key={doctor.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors">
                  <img src={doctor.imageUrl || `https://ui-avatars.com/api/?name=${doctor.name}&background=2DD4BF&color=fff`}
                    alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{doctor.name}</h3>
                      <Badge variant="secondary" className="text-xs">🩺 {doctor.specialty}</Badge>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{doctor.subscriptionType}</Badge>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">{doctor.email} • {doctor.phone}</p>
                    <p className="text-zinc-500 text-xs">{doctor.wilaya} - {doctor.daira} • {doctor.consultationFee} دج</p>
                    {doctor.clinicName && <p className="text-zinc-600 text-xs">🏥 {doctor.clinicName}</p>}
                  </div>
                  <Button size="sm" variant="destructive" className="gap-2 rounded-xl shrink-0"
                    onClick={() => { if (confirm(`حذف "د. ${doctor.name}"؟`)) deleteDoctorMutation.mutate(doctor.id); }}
                    disabled={deleteDoctorMutation.isPending}>
                    <Trash2 className="h-4 w-4" /> حذف
                  </Button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {(users as any[]).length === 0 ? <div className="text-center py-20 text-zinc-500">لا يوجد مستخدمون</div> : (
              (users as any[]).map((user: any) => (
                <motion.div key={user.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center font-black text-primary text-xl shrink-0">
                    {user.name?.[0] || "؟"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold">{user.name}</h3>
                      <Badge variant={user.role === "doctor" ? "default" : "secondary"} className="text-xs">
                        {user.role === "doctor" ? "🩺 طبيب" : "👤 مريض"}
                      </Badge>
                      <Badge className={`text-xs ${user.isVerified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                        {user.isVerified ? "✅ مفعّل" : "❌ غير مفعّل"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />{user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-xs">Hash:</span>
                      {showPasswords[user.id]
                        ? <span className="text-zinc-400 text-xs font-mono">{user.passwordHash?.slice(0, 32)}...</span>
                        : <span className="text-zinc-600 text-xs">••••••••••••••••</span>}
                      <button onClick={() => setShowPasswords(p => ({ ...p, [user.id]: !p[user.id] }))} className="text-zinc-500 hover:text-zinc-300">
                        {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    {user.phone && <p className="text-zinc-500 text-xs mt-0.5">📞 {user.phone}</p>}
                    <p className="text-zinc-600 text-xs mt-0.5">{new Date(user.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!user.isVerified && (
                      <Button size="sm" variant="outline" className="gap-1 rounded-xl border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                        onClick={() => verifyUserMutation.mutate(user.id)}>
                        <UserCheck className="h-3.5 w-3.5" /> تفعيل
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-1 rounded-xl text-xs"
                      onClick={() => { if (confirm(`حذف "${user.name}"؟`)) deleteUserMutation.mutate(user.id); }}
                      disabled={deleteUserMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Chats */}
        {activeTab === "chats" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {conversations.length === 0 ? <div className="text-center py-20 text-zinc-500">لا توجد محادثات</div> : (
              conversations.map((conv: any) => (
                <ConversationItem key={conv.id} conversation={conv}
                  isExpanded={expandedConv === conv.id}
                  onToggle={() => setExpandedConv(expandedConv === conv.id ? null : conv.id)} />
              ))
            )}
          </motion.div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl animate-pulse border border-white/10" />)}</div>
            ) : allReviews.length === 0 ? (
              <div className="text-center py-20 text-zinc-500"><Star className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>لا توجد تقييمات</p></div>
            ) : (
              <AnimatePresence>
                {allReviews.map((review: any) => (
                  <motion.div key={review.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex items-start gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-red-500/20 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg shrink-0">
                      {review.patientName?.[0] || "؟"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{review.patientName}</span>
                        <span className="text-zinc-500 text-xs">←</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">د. {review.doctorName}</Badge>
                        <span className="text-zinc-600 text-xs mr-auto">{new Date(review.createdAt).toLocaleDateString('ar-DZ')}</span>
                      </div>
                      <div className="flex gap-0.5 mt-1.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />)}
                      </div>
                      {review.comment && <p className="text-zinc-400 text-sm mt-2">"{review.comment}"</p>}
                    </div>
                    <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl shrink-0 opacity-70 hover:opacity-100"
                      onClick={() => { if (confirm(`حذف تقييم "${review.patientName}"؟`)) deleteReviewMutation.mutate(review.id); }}
                      disabled={deleteReviewMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* Appointments */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {appointmentsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl animate-pulse border border-white/10" />)}</div>
            ) : allAppointments.length === 0 ? (
              <div className="text-center py-20 text-zinc-500"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>لا توجد مواعيد</p></div>
            ) : (
              <AnimatePresence>
                {allAppointments.map((appt: any) => (
                  <motion.div key={appt.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="flex items-start gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-primary/20 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold">{appt.patientName}</span>
                        <span className="text-zinc-500 text-xs">←</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">د. {appt.doctorName}</Badge>
                        {appt.isUrgent && <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">🚨 عاجل</Badge>}
                        <Badge className={`text-xs ${statusColors[appt.status] || ""}`}>{statusLabels[appt.status] || appt.status}</Badge>
                      </div>
                      <p className="text-zinc-300 text-sm">📅 {appt.appointmentDate} — ⏰ {appt.appointmentTime}</p>
                      {appt.patientPhone && <p className="text-zinc-500 text-xs mt-0.5">📞 {appt.patientPhone}</p>}
                      {appt.notes && <p className="text-zinc-500 text-xs mt-0.5 italic">"{appt.notes}"</p>}
                    </div>
                    <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl shrink-0 opacity-70 hover:opacity-100"
                      onClick={() => { if (confirm("حذف هذا الموعد؟")) deleteAppointmentMutation.mutate(appt.id); }}
                      disabled={deleteAppointmentMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isExpanded, onToggle }: { conversation: any; isExpanded: boolean; onToggle: () => void }) {
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/admin/conversations", conversation.id, "messages"],
    queryFn: () => fetch(`/api/admin/conversations/${conversation.id}/messages`).then(r => r.json()),
    enabled: isExpanded,
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
      <button onClick={onToggle} className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-right">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold">محادثة #{conversation.id.slice(0, 8)}</p>
            <p className="text-zinc-400 text-sm">طبيب: {conversation.doctorId} • مريض: {conversation.patientId?.slice(0, 12)}...</p>
            {conversation.lastMessage && <p className="text-zinc-500 text-xs mt-1 truncate max-w-xs">"{conversation.lastMessage}"</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs border-white/20">{messages.length} رسائل</Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4 max-h-80 overflow-y-auto">
              {messages.length === 0 ? <p className="text-zinc-500 text-sm text-center py-4">لا توجد رسائل</p> : (
                messages.map((msg: any) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.senderType === 'doctor' ? 'flex-row-reverse' : ''}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderType === 'doctor' ? 'bg-primary/20 text-primary-foreground border border-primary/30' : 'bg-white/10 text-white border border-white/10'}`}>
                      <p className="text-[10px] font-black opacity-60 mb-1">{msg.senderType === 'doctor' ? '🩺 طبيب' : '👤 مريض'}</p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}