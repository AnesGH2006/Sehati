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
  ChevronDown,
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
  appointmentTime: string;
  status: AppointmentStatus;
  notes: string | null;
  doctorNotes: string | null;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  // مُضاف من جهة العميل بعد جلب بيانات الطبيب
  doctorName?: string;
  doctorSpecialty?: string;
}

// ── ثوابت ─────────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "بانتظار التأكيد",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmed: {
    label: "مؤكد",
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

// ── الصفحة الرئيسية ────────────────────────────────────────────────────────────
export default function MyAppointments() {
  const { customer, patient, isLoggedIn, isDoctor } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const me = patient || customer;

  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [showBooking, setShowBooking] = useState(false);
  const [enriched, setEnriched] = useState<Appointment[]>([]);

  // جلب مواعيد المريض
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient", me?.id],
    queryFn: () =>
      fetch("/api/doctors")
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? d : d.doctors || d.data || [])),
  });

  // جلب بيانات الأطباء لإضافة الاسم والتخصص
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

  // إلغاء موعد
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
      toast({ title: "تم إلغاء الموعد" });
    },
    onError: () => toast({ title: "فشل إلغاء الموعد", variant: "destructive" }),
  });

  if (!isLoggedIn || isDoctor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              يجب تسجيل الدخول كمريض للوصول لمواعيدك
            </p>
            <Button onClick={() => setLocation("/auth")}>تسجيل الدخول</Button>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-heading font-bold">مواعيدي</h1>
          <Button
            onClick={() => setShowBooking(true)}
            className="gap-2 rounded-xl font-bold"
          >
            <Plus className="h-4 w-4" /> حجز موعد جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "إجمالي المواعيد",
              value: stats.total,
              icon: <Calendar className="h-4 w-4" />,
              color: "text-blue-500",
            },
            {
              label: "بانتظار التأكيد",
              value: stats.pending,
              icon: <Clock className="h-4 w-4" />,
              color: "text-yellow-500",
            },
            {
              label: "مواعيد مؤكدة",
              value: stats.confirmed,
              icon: <CheckCircle2 className="h-4 w-4" />,
              color: "text-green-500",
            },
            {
              label: "مواعيد منتهية",
              value: stats.completed,
              icon: <Check className="h-4 w-4" />,
              color: "text-zinc-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-muted/40 rounded-2xl p-4 border border-border/50"
            >
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
                <span
                  className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20" : "bg-muted"}`}
                >
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
              <div
                key={i}
                className="h-24 rounded-2xl bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد مواعيد في هذه الفئة</p>
            <Button
              variant="link"
              onClick={() => setShowBooking(true)}
              className="mt-2"
            >
              احجز موعدك الأول
            </Button>
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
                  className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* أيقونة */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>

                  {/* المعلومات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold">د. {appt.doctorName}</span>
                      {appt.doctorSpecialty && (
                        <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          {appt.doctorSpecialty}
                        </span>
                      )}
                      {appt.isUrgent && (
                        <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                          <AlertTriangle className="h-3 w-3" /> عاجل
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(appt.appointmentDate).toLocaleDateString(
                          "ar-DZ",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appt.appointmentTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs gap-1 ${STATUS_MAP[appt.status].color}`}
                      >
                        {STATUS_MAP[appt.status].icon}
                        {STATUS_MAP[appt.status].label}
                      </Badge>
                      {appt.notes && (
                        <span className="text-xs text-muted-foreground italic">
                          "{appt.notes}"
                        </span>
                      )}
                    </div>

                    {appt.doctorNotes && (
                      <div className="mt-2 text-xs bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground border border-border/30">
                        <span className="font-medium text-foreground">
                          ملاحظة الطبيب:{" "}
                        </span>
                        {appt.doctorNotes}
                      </div>
                    )}
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
                        <MessageSquare className="h-3.5 w-3.5" /> تواصل
                      </Button>
                    )}
                    {(appt.status === "pending" ||
                      appt.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 rounded-xl text-xs"
                        onClick={() => {
                          if (confirm("هل تريد إلغاء هذا الموعد؟"))
                            cancelMutation.mutate(appt.id);
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" /> إلغاء
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

      {/* نافذة الحجز */}
      <BookingDialog
        open={showBooking}
        onClose={() => setShowBooking(false)}
        doctors={doctors}
        patientId={me?.id || ""}
        patientName={me?.name || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/appointments/patient", me?.id],
          });
          setShowBooking(false);
          toast({
            title: "✅ تم حجز موعدك بنجاح",
            description: "انتظر تأكيد الطبيب",
          });
        }}
      />
    </div>
  );
}

// ── نافذة الحجز ───────────────────────────────────────────────────────────────
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
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // جلب الأوقات المتاحة عند اختيار طبيب وتاريخ
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot("");
    fetch(`/api/appointments/slots/${doctorId}?date=${date}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        setSlots(data);
        setLoadingSlots(false);
      })
      .catch(() => {
        setSlots([]);
        setLoadingSlots(false);
      });
  }, [doctorId, date]);

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
          appointmentTime: selectedSlot,
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
    onError: () =>
      toast({ title: "فشل الحجز، حاول مرة أخرى", variant: "destructive" }),
  });

  const resetForm = () => {
    setDoctorId("");
    setPhone("");
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedSlot("");
    setNotes("");
    setIsUrgent(false);
    setSlots([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedDoctor = doctors.find((d) => String(d.id) === doctorId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold">
            <Calendar className="h-5 w-5 text-primary" /> حجز موعد جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* اختيار الطبيب */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              الطبيب
            </Label>
            <Select value={doctorId} onValueChange={setDoctorId} dir="rtl">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="اختر الطبيب" />
              </SelectTrigger>
              <SelectContent dir="rtl" className="max-h-60">
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    د. {d.name} — {d.specialty}
                    {d.consultationFee ? ` (${d.consultationFee} دج)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* معلومات العيادة */}
          {selectedDoctor && (
            <div className="bg-muted/40 rounded-xl p-3 text-sm border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {selectedDoctor.specialty}
                </span>
                {selectedDoctor.clinicName && (
                  <span>• {selectedDoctor.clinicName}</span>
                )}
              </div>
              {selectedDoctor.clinicAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {selectedDoctor.clinicAddress}
                </p>
              )}
              {selectedDoctor.consultationFee && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  💰 سعر الكشف: {selectedDoctor.consultationFee} دج
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                ⏱ مدة الموعد: {selectedDoctor.appointmentDuration || 30} دقيقة
              </p>
            </div>
          )}

          {/* الاسم والهاتف */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                اسمك
              </Label>
              <Input
                value={patName}
                onChange={(e) => setPatName(e.target.value)}
                placeholder="الاسم الكامل"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                الهاتف
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06XXXXXXXX"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* التاريخ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              تاريخ الموعد
            </Label>
            <Input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* الأوقات المتاحة */}
          {doctorId && date && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                الوقت المتاح
              </Label>
              {loadingSlots ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  جاري تحميل الأوقات...
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                  لا توجد أوقات متاحة في هذا التاريخ
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 rounded-xl text-sm font-medium transition-all border ${
                        selectedSlot === slot
                          ? "bg-primary text-white border-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* الملاحظات */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              ملاحظات (اختياري)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اشرح سبب الزيارة أو أي معلومات مهمة للطبيب..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* طلب عاجل */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <button
              onClick={() => setIsUrgent((p) => !p)}
              className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${isUrgent ? "bg-red-500" : "bg-muted"}`}
              aria-label="تفعيل خيار الاستعجال"
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isUrgent ? "right-1" : "right-5"}`}
              />
            </button>
            <div>
              <p className="text-sm font-medium">طلب عاجل</p>
              <p className="text-xs text-muted-foreground">
                سيتم إشعار الطبيب فوراً
              </p>
            </div>
            {isUrgent && (
              <Badge className="mr-auto bg-red-500/20 text-red-400 border-red-500/30 gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" /> عاجل
              </Badge>
            )}
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={
                !doctorId ||
                !patName ||
                !date ||
                !selectedSlot ||
                bookMutation.isPending
              }
              className="flex-1 rounded-xl gap-2 font-bold"
            >
              <Check className="h-4 w-4" />
              {bookMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
