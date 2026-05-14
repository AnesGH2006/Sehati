import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { MOCK_DOCTORS, SPECIALTIES } from "@/lib/constants";
import { MapPin, Star, MessageCircle, Share2, Heart, CheckCircle2, Clock, Briefcase, Phone, User, Calendar } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const id = params ? parseInt(params.id) : 1;
  const { isLoggedIn, isDoctor, customer, loginCustomer } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", phone: "" });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: apiDoctor } = useQuery({
    queryKey: ["/api/doctors", id],
    queryFn: () => fetch(`/api/doctors/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/doctors", id, "reviews"],
    queryFn: () => fetch(`/api/doctors/${id}/reviews`).then(r => r.ok ? r.json() : []).catch(() => []),
    refetchInterval: 10000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations", customer?.id],
    queryFn: () => fetch(`/api/conversations/${customer?.id}?role=patient`).then(r => r.ok ? r.json() : []).catch(() => []),
    enabled: !!customer?.id && isLoggedIn && !isDoctor,
  });
  const hasConversation = conversations.some((c: any) => c.doctorId === id);

  const submitReview = useMutation({
    mutationFn: async (data: { doctorId: number; patientId: string; patientName: string; rating: number; comment: string }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "فشل إرسال التقييم"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", id] });
      toast({ title: "شكراً!", description: "تم إرسال تقييمك بنجاح" });
      setReviewRating(0); setReviewComment(""); setShowReviewForm(false);
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const fallback = { id, name: "طبيب", specialty: "", daira: "", wilaya: "", imageUrl: `https://ui-avatars.com/api/?name=طبيب&background=2DD4BF&color=fff&size=400`, rating: 0, reviewCount: 0, description: "", isVerified: false, phone: "", yearsOfExperience: 0, consultationFee: null, clinicName: "", clinicAddress: "" };
  const mockDoctor = (MOCK_DOCTORS as any[]).find((d: any) => d.id === id) || fallback;
  const raw = apiDoctor && typeof apiDoctor === "object" && !Array.isArray(apiDoctor) ? apiDoctor : null;
  const specialtyLabel = raw ? (SPECIALTIES.find(s => s.id === raw.specialty)?.label || raw.specialty || "") : (mockDoctor?.specialty || "");
  const doctor = raw ? { ...raw, specialty: specialtyLabel, imageUrl: raw.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name)}&background=2DD4BF&color=fff&size=400` } : { ...mockDoctor, specialty: specialtyLabel };

  const handleContactClick = () => {
    if (!isLoggedIn) { setShowLoginDialog(true); }
    else if (isDoctor) { toast({ title: "تنبيه", description: "الأطباء لا يمكنهم مراسلة بعضهم", variant: "destructive" }); }
    else { setLocation(`/chat/${doctor.id}`); }
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.name.trim() || !loginForm.phone.trim()) { toast({ title: "تنبيه", description: "أدخل اسمك ورقم هاتفك", variant: "destructive" }); return; }
    loginCustomer({ id: "patient-" + Date.now(), name: loginForm.name.trim(), phone: loginForm.phone.trim() });
    setShowLoginDialog(false);
    toast({ title: "مرحباً! 👋", description: "يمكنك الآن التواصل مع الطبيب" });
    setTimeout(() => setLocation(`/chat/${doctor.id}`), 500);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !customer) { setShowLoginDialog(true); return; }
    if (reviewRating === 0) { toast({ title: "تنبيه", description: "اختر عدد النجوم أولاً", variant: "destructive" }); return; }
    submitReview.mutate({ doctorId: doctor.id, patientId: customer.id, patientName: customer.name, rating: reviewRating, comment: reviewComment });
  };

  const ratingCounts = [5,4,3,2,1].map(star => ({ star, count: reviews.filter((r: any) => r.rating === star).length }));
  const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : doctor.rating || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-8" dir="rtl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-heading font-black">تواصل مع الطبيب</DialogTitle>
            <DialogDescription className="text-base">أدخل بياناتك للتواصل مع <strong>{doctor.name}</strong></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">اسمك</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="محمد علي" value={loginForm.name} onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))} className="h-12 rounded-xl pr-10 bg-muted/30 border-none ring-1 ring-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">رقم هاتفك</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="tel" placeholder="06XXXXXXXX" value={loginForm.phone} onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} className="h-12 rounded-xl pr-10 bg-muted/30 border-none ring-1 ring-border" />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-black rounded-xl text-base"><MessageCircle className="h-4 w-4 ml-2" />تواصل الآن</Button>
            <p className="text-xs text-muted-foreground text-center">أنت طبيب؟ <span className="text-primary cursor-pointer font-bold" onClick={() => { setShowLoginDialog(false); setLocation("/subscription"); }}>سجّل كطبيب</span></p>
          </form>
        </DialogContent>
      </Dialog>

      <main className="flex-1 pb-16" dir="rtl">
        <div className="h-64 md:h-80 w-full bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img src={doctor.imageUrl} alt="cover" className="w-full h-full object-cover blur-sm scale-105" />
        </div>

        <div className="container px-4 md:px-8 relative z-20 -mt-20">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background overflow-hidden shadow-lg shrink-0 bg-muted">
                <img src={doctor.imageUrl} alt={doctor.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-heading font-bold">د. {doctor.name}</h1>
                      {doctor.isVerified && <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-50" />}
                    </div>
                    <p className="text-muted-foreground text-lg flex items-center gap-2 mt-1">
                      <span className="font-bold text-primary">{doctor.specialty}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{doctor.daira}</span>
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full"><Heart className="w-4 h-4" /></Button>
                    <Button size="lg" variant="outline" className="flex-1 md:flex-none gap-2" onClick={handleContactClick}>
                      <MessageCircle className="w-5 h-5" />راسل الطبيب
                    </Button>
                    <Button size="lg" className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => setLocation(`/appointments/${doctor.id}`)}>
                      <Calendar className="w-5 h-5" />احجز موعد
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{avgRating}</span>
                    <span className="text-muted-foreground text-sm">({reviews.length || doctor.reviewCount || 0} تقييم)</span>
                  </div>
                  {doctor.yearsOfExperience > 0 && (<><div className="w-px h-5 bg-border hidden md:block" /><div className="flex items-center gap-1.5 text-sm"><Briefcase className="w-4 h-4 text-muted-foreground" /><span>{doctor.yearsOfExperience} سنوات خبرة</span></div></>)}
                  {doctor.consultationFee && (<><div className="w-px h-5 bg-border hidden md:block" /><span className="font-bold text-primary text-sm">سعر الكشف: {doctor.consultationFee} دج</span></>)}
                  {doctor.phone && (<><div className="w-px h-5 bg-border hidden md:block" /><div className="flex items-center gap-1.5 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span dir="ltr">{doctor.phone}</span></div></>)}
                  <div className="w-px h-5 bg-border hidden md:block" />
                  <div className="flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4 text-muted-foreground" /><span>يرد خلال ساعة</span></div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="about" className="px-6 py-3 rounded-lg text-base">حول الطبيب</TabsTrigger>
                  <TabsTrigger value="reviews" className="px-6 py-3 rounded-lg text-base">
                    التقييمات {reviews.length > 0 && <Badge className="mr-2 h-5 px-1.5 text-xs">{reviews.length}</Badge>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-3">نبذة تعريفية</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{doctor.description || "طبيب متخصص يقدم أفضل رعاية صحية لمرضاه."}</p>
                  </div>
                  {doctor.clinicName && (
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-2">العيادة</h3>
                      <p className="text-muted-foreground">{doctor.clinicName}</p>
                      {doctor.clinicAddress && <p className="text-sm text-muted-foreground mt-1">{doctor.clinicAddress}</p>}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-6">
                  {reviews.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-6 p-6 bg-muted/30 rounded-2xl border border-border">
                      <div className="flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-5xl font-black text-primary">{avgRating}</span>
                        <div className="flex gap-0.5 mt-2">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />)}</div>
                        <span className="text-sm text-muted-foreground mt-1">{reviews.length} تقييم</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {ratingCounts.map(({ star, count }) => (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-sm w-4 text-muted-foreground">{star}</span>
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} /></div>
                            <span className="text-sm text-muted-foreground w-4">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLoggedIn && !isDoctor && (
                    <div>
                      {!hasConversation ? (
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                          <MessageCircle className="w-5 h-5 shrink-0 text-primary/50" />
                          <span>يجب أن تتواصل مع هذا الطبيب أولاً قبل تقييمه</span>
                          <Button size="sm" variant="outline" className="mr-auto shrink-0 border-primary/30 text-primary" onClick={handleContactClick}>تواصل الآن</Button>
                        </div>
                      ) : !showReviewForm ? (
                        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={() => setShowReviewForm(true)}><Star className="w-4 h-4" />أضف تقييمك</Button>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="p-5 bg-muted/20 rounded-2xl border border-border space-y-4">
                          <h4 className="font-bold text-base">تقييمك للطبيب</h4>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} type="button" onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(s)}>
                                <Star className={`w-8 h-8 transition-colors ${s <= (reviewHover || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                              </button>
                            ))}
                            {reviewRating > 0 && <span className="text-sm text-muted-foreground self-center mr-2">{['','ضعيف','مقبول','جيد','جيد جداً','ممتاز'][reviewRating]}</span>}
                          </div>
                          <Textarea placeholder="شارك تجربتك مع هذا الطبيب... (اختياري)" value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="resize-none bg-background" rows={3} />
                          <div className="flex gap-3">
                            <Button type="submit" disabled={submitReview.isPending} className="gap-2">{submitReview.isPending ? "جاري الإرسال..." : "إرسال التقييم"}</Button>
                            <Button type="button" variant="ghost" onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); }}>إلغاء</Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {!isLoggedIn && <button onClick={() => setShowLoginDialog(true)} className="text-sm text-primary underline underline-offset-2">سجّل دخولك لإضافة تقييم</button>}

                  {reviewsLoading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="p-5 rounded-2xl border border-border animate-pulse bg-muted/20 h-28" />)}</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">لا توجد تقييمات بعد</p>
                      <p className="text-sm mt-1">كن أول من يقيّم هذا الطبيب!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">{review.patientName?.[0] || "؟"}</div>
                              <div>
                                <p className="font-bold text-sm">{review.patientName}</p>
                                <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 shrink-0">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />)}</div>
                          </div>
                          {review.comment && <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}