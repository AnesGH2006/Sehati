import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  X,
  Check,
  MessageSquare,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── أنواع ─────────────────────────────────────────────────────────────────────
type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Appointment {
  id: number;
  doctorId: number;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  appointmentDate: string;
  appointmentTime: string; // تمثل الفترة: "matin" أو "soir"
  queueNumber: number; // رقم التذكرة الفعلي
  status: AppointmentStatus;
  notes: string | null;
  doctorNotes: string | null;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  doctorName?: string;
  doctorSpecialty?: string;
}

// ── ثوابت ─────────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "بانتظار تأكيد العيادة",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmed: {
    label: "مؤكد (احجز مكانك الحقيقي)",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "منتهي",
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    icon: <Check className="h-3 w-3" />,
  },
  cancelled: {
    label: "ملغي",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: <X className="h-3 w-3" />,
  },
};

const TABS: { key: AppointmentStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار التأكيد" },
  { key: "confirmed", label: "مؤكدة" },
  { key: "completed", label: "منتهية" },
  { key: "cancelled", label: "ملغاة" },
];

export default function MyAppointments() {
  const { customer, patient, isDoctor, ensureGuest } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const me = patient || customer;

  useEffect(() => {
    if (!me && !isDoctor) ensureGuest();
  }, []);

  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [showBooking, setShowBooking] = useState(false);
  const [enriched, setEnriched] = useState<Appointment[]>([]);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient", me?.id],
    queryFn: () =>
      fetch(`/api/appointments/patient/${me?.id}`)
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
    enabled: !!me?.id,
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
    queryFn: () => fetch("/api/doctors").then((r) => r.json()),
  });

  useEffect(() => {
    if (!appointments.length || !doctors.length) {
      setEnriched(appointments);
      return;
    }
    const enrichedList = appointments.map((a) => {
      const doc = doctors.find((d: any) => d.id === a.doctorId);
      return {
        ...a,
        doctorName: doc?.name || `طبيب #${a.doctorId}`,
        doctorSpecialty: doc?.specialty || "",
      };
    });
    setEnriched(enrichedList);
  }, [appointments, doctors]);

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/appointments/patient", me?.id],
      });
      toast({ title: "تم إلغاء التذكرة بنجاح" });
    },
    onError: () => toast({ title: "فشل إلغاء التذكرة", variant: "destructive" }),
  });

  if (isDoctor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">صفحة المرضى فقط</p>
            <Button onClick={() => setLocation("/doctor/dashboard")}>لوحة تحكم الطبيب</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filtered =
    activeTab === "all"
      ? enriched
      : enriched.filter((a) => a.status === activeTab);

  const stats = {
    total: enriched.length,
    pending: enriched.filter((a) => a.status === "pending").length,
    confirmed: enriched.filter((a) => a.status === "confirmed").length,
    completed: enriched.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-heading font-bold">تذاكر الحجز الخاصة بي 🎟️</h1>
          <Button
            onClick={() => setShowBooking(true)}
            className="gap-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> قطع تذكرة دور جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "إجمالي التذاكر", value: stats.total, icon: <Calendar className="h-4 w-4" />, color: "text-blue-500" },
            { label: "بانتظار التأكيد", value: stats.pending, icon: <Clock className="h-4 w-4" />, color: "text-yellow-500" },
            { label: "تذاكر مؤكدة", value: stats.confirmed, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-500" },
            { label: "تذاكر منتهية", value: stats.completed, icon: <Check className="h-4 w-4" />, color: "text-zinc-400" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-2xl p-4 border border-border/50">
              <div className={`flex items-center gap-1.5 mb-2 ${s.color}`}>
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                activeTab === t.key
                  ? "bg-primary text-white border-primary"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20" : "bg-muted"}`}>
                  {enriched.filter((a) => a.status === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد تذاكر حجز حالية</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden"
                >
                  {/* شارة رقم التذكرة الكبيرة الجذابة */}
                  <div className="w-16 h-16 rounded-xl bg-blue-600/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-blue-500">رقم الدور</span>
                    <span className="text-2xl font-black text-blue-600">#{appt.queueNumber}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-lg">د. {appt.doctorName}</span>
                      {appt.doctorSpecialty && (
                        <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          {appt.doctorSpecialty}
                        </span>
                      )}
                      {appt.isUrgent && (
                        <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                          <AlertTriangle className="h-3 w-3" /> حالة مستعجلة
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(appt.appointmentDate).toLocaleDateString("ar-DZ", {
                          weekday: "long", year: "numeric", month: "long", day: "numeric"
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        الفترة: {appt.appointmentTime === "matin" ? "الصباحية (Matinée)" : "المسائية (Soirée)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs gap-1 ${STATUS_MAP[appt.status].color}`}>
                        {STATUS_MAP[appt.status].icon}
                        {STATUS_MAP[appt.status].label}
                      </Badge>
                      {appt.notes && <span className="text-xs text-muted-foreground italic">"{appt.notes}"</span>}
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex gap-2 shrink-0">
                    {appt.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded-xl text-xs"
                        onClick={() => setLocation(`/chat/${appt.doctorId}`)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> دردشة
                      </Button>
                    )}
                    {(appt.status === "pending" || appt.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 rounded-xl text-xs"
                        onClick={() => {
                          if (confirm("هل تريد إلغاء تذكرة الحجز هذه؟"))
                            cancelMutation.mutate(appt.id);
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" /> إلغاء التذكرة
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      <Footer />

      <BookingDialog
        open={showBooking}
        onClose={() => setShowBooking(false)}
        doctors={doctors}
        patientId={me?.id || ""}
        patientName={me?.name || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient", me?.id] });
          setShowBooking(false);
          toast({
            title: "✅ تم قطع التذكرة بنجاح",
            description: "تأكد من حضورك في الفترة المحددة لمعرفة دورك تلقائياً.",
          });
        }}
      />
    </div>
  );
}

// ── نافذة حجز التذكرة المعدلة (اختيار الفترة) ───────────────────────────────────────────────────────────────
function BookingDialog({
  open,
  onClose,
  doctors,
  patientId,
  patientName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  doctors: any[];
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState("");
  const [patName, setPatName] = useState(patientName);
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPeriod, setSelectedPeriod] = useState("matin"); // القيمة الافتراضية صباحاً
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const bookMutation = useMutation({
    mutationFn: () =>
      fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: parseInt(doctorId),
          patientId,
          patientName: patName,
          patientPhone: phone || null,
          appointmentDate: date,
          appointmentTime: selectedPeriod, // نرسل الفترة هنا ديريكت للباك إند لحساب الـ queueNumber
          notes: notes || null,
          isUrgent,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
    onError: () => toast({ title: "فشل حجز التذكرة، حاول مجدداً", variant: "destructive" }),
  });

  const resetForm = () => {
    setDoctorId("");
    setPhone("");
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedPeriod("matin");
    setNotes("");
    setIsUrgent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedDoctor = doctors.find((d) => String(d.id) === doctorId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold">
            <Ticket className="h-5 w-5 text-primary" /> اقطع تذكرة دور جديدة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* اختيار الطبيب */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">الطبيب</Label>
            <Select value={doctorId} onValueChange={setDoctorId} dir="rtl">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="اختر الطبيب" />
              </SelectTrigger>
              <SelectContent dir="rtl" className="max-h-60">
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    د. {d.name} — {d.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* معلومات العيادة */}
          {selectedDoctor && (
            <div className="bg-muted/40 rounded-xl p-3 text-sm border border-border/50">
              <p className="font-semibold text-primary">📍 العيادة: {selectedDoctor.clinicName || "عيادة خاصة"}</p>
              <p className="text-xs text-muted-foreground mt-1">العنوان: {selectedDoctor.clinicAddress || "غير محدد"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">💰 سعر الكشف: {selectedDoctor.consultationFee || 1000} دج</p>
            </div>
          )}

          {/* الاسم والهاتف */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">اسم المريض</Label>
              <Input value={patName} onChange={(e) => setPatName(e.target.value)} placeholder="الاسم الكامل" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">رقم الهاتف للتوثيق</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06XXXXXXXX" className="h-11 rounded-xl" />
            </div>
          </div>

          {/* التاريخ واختيار الفترة */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">اختر الفترة المفضلة</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="matin">الفترة الصباحية (Matinée)</SelectItem>
                  <SelectItem value="soir">الفترة المسائية (Soirée)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ملاحظات وحالة عاجلة */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">أعراض أو ملاحظات (اختياري)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اكتب هنا إذا كنت تعاني من أعراض معينة ليعرفها الطبيب..." className="rounded-xl" />
          </div>

          <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
            <input type="checkbox" id="urgent" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="rounded" />
            <Label htmlFor="urgent" className="text-xs font-bold text-red-600 flex items-center gap-1 cursor-pointer">
              <AlertTriangle className="h-3.5 w-3.5" /> الحجز لحالة مستعجلة جداً!
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} className="rounded-xl">إلغاء</Button>
            <Button type="button" onClick={() => bookMutation.mutate()} disabled={!doctorId || bookMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
              {bookMutation.isPending ? "جاري قطع التذكرة..." : "تأكيد الحجز ونيل رقم الدور 🎟️"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}