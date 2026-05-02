                        import { useState } from "react";
                        import { Navbar } from "@/components/layout/navbar";
                        import { Footer } from "@/components/layout/footer";
                        import { Button } from "@/components/ui/button";
                        import { MOCK_ARTISANS, CATEGORIES } from "@/lib/constants";
                        import { MapPin, Star, MessageCircle, Share2, Heart, CheckCircle2, Clock, Briefcase, Banknote, Phone, User } from "lucide-react";
                        import { Link, useRoute, useLocation } from "wouter";
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
                          const [match, params] = useRoute("/profile/:id");
                          const id = params ? parseInt(params.id) : 1;
                          const { isLoggedIn, isArtisan, customer, loginCustomer } = useAuth();
                          const [, setLocation] = useLocation();
                          const { toast } = useToast();
                          const queryClient = useQueryClient();
                          const [showLoginDialog, setShowLoginDialog] = useState(false);
                          const [loginForm, setLoginForm] = useState({ name: "", phone: "" });

                          const [reviewRating, setReviewRating] = useState(0);
                          const [reviewHover, setReviewHover] = useState(0);
                          const [reviewComment, setReviewComment] = useState("");
                          const [showReviewForm, setShowReviewForm] = useState(false);

                          const { data: apiArtisan, isLoading: artisanLoading } = useQuery({
                            queryKey: ["/api/artisans", id],
                            queryFn: () => fetch(`/api/artisans/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
                          });

                          const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
                            queryKey: ["/api/artisans", id, "reviews"],
                            queryFn: () => fetch(`/api/artisans/${id}/reviews`).then(r => r.ok ? r.json() : []).catch(() => []),
                            refetchInterval: 10000,
                          });

                          const { data: conversations = [] } = useQuery({
                            queryKey: ["/api/conversations", customer?.id],
                            queryFn: () => fetch(`/api/conversations/${customer?.id}?role=customer`).then(r => r.ok ? r.json() : []).catch(() => []),
                            enabled: !!customer?.id && isLoggedIn && !isArtisan,
                          });
                          const hasConversation = conversations.some((c: any) => c.artisanId === id);

                          const submitReview = useMutation({
                            mutationFn: async (data: { artisanId: number; customerId: string; customerName: string; rating: number; comment: string }) => {
                              const res = await fetch("/api/reviews", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data),
                              });
                              if (!res.ok) {
                                const err = await res.json();
                                throw new Error(err.message || "فشل إرسال التقييم");
                              }
                              return res.json();
                            },
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: ["/api/artisans", id, "reviews"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/artisans", id] });
                              toast({ title: "✅ شكراً!", description: "تم إرسال تقييمك بنجاح" });
                              setReviewRating(0);
                              setReviewComment("");
                              setShowReviewForm(false);
                            },
                            onError: (err: Error) => {
                              toast({ title: "خطأ", description: err.message, variant: "destructive" });
                            },
                          });

                          const fallbackArtisan = {
                            id,
                            name: "حرفي",
                            category: "",
                            daira: "",
                            wilaya: "",
                            image: `https://ui-avatars.com/api/?name=حرفي&background=2DD4BF&color=fff&size=400`,
                            rating: 0,
                            reviews: 0,
                            description: "",
                            isVerified: false,
                            priceStart: null,
                            phone: "",
                          };
                          const mockArtisan = MOCK_ARTISANS.find((a: any) => a.id === id) || fallbackArtisan;
                          const raw = apiArtisan && typeof apiArtisan === 'object' && !Array.isArray(apiArtisan) ? apiArtisan : null;
                          const categoryLabel = raw
                            ? (CATEGORIES.find(c => c.id === raw.category)?.label || raw.category || "")
                            : (mockArtisan?.category || "");

                          const artisan = raw ? {
                            ...raw,
                            category: categoryLabel,
                            imageUrl: raw.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name)}&background=2DD4BF&color=fff&size=400`,
                          } : {
                            id: mockArtisan.id,
                            name: mockArtisan.name,
                            category: mockArtisan.category,
                            daira: mockArtisan.daira,
                            wilaya: "",
                            imageUrl: mockArtisan.image,
                            rating: mockArtisan.rating,
                            reviewCount: mockArtisan.reviews,
                            description: mockArtisan.description,
                            isVerified: mockArtisan.isVerified,
                            portfolioImages: [],
                            portfolioVideos: [],
                            yearsOfExperience: 5,
                            priceStart: mockArtisan.priceStart,
                            phone: mockArtisan.phone,
                          };

                          const handleContactClick = () => {
                            if (!isLoggedIn) {
                              setShowLoginDialog(true);
                            } else if (isArtisan) {
                              toast({ title: "تنبيه", description: "الحرفيون لا يمكنهم مراسلة بعضهم البعض", variant: "destructive" });
                            } else {
                              setLocation(`/chat/${artisan.id}`);
                            }
                          };

                          const handleGuestLogin = (e: React.FormEvent) => {
                            e.preventDefault();
                            if (!loginForm.name.trim() || !loginForm.phone.trim()) {
                              toast({ title: "تنبيه", description: "أدخل اسمك ورقم هاتفك", variant: "destructive" });
                              return;
                            }
                            loginCustomer({
                              id: "customer-" + Date.now(),
                              name: loginForm.name.trim(),
                              phone: loginForm.phone.trim(),
                            });
                            setShowLoginDialog(false);
                            toast({ title: "مرحباً بك! 👋", description: "يمكنك الآن التواصل مع الحرفيين" });
                            setTimeout(() => setLocation(`/chat/${artisan.id}`), 500);
                          };

                          const handleSubmitReview = (e: React.FormEvent) => {
                            e.preventDefault();
                            if (!isLoggedIn || !customer) {
                              setShowLoginDialog(true);
                              return;
                            }
                            if (reviewRating === 0) {
                              toast({ title: "تنبيه", description: "اختر عدد النجوم أولاً", variant: "destructive" });
                              return;
                            }
                            submitReview.mutate({
                              artisanId: artisan.id,
                              customerId: customer.id,
                              customerName: customer.name,
                              rating: reviewRating,
                              comment: reviewComment,
                            });
                          };

                          const portfolioImages = artisan.portfolioImages?.length > 0
                            ? artisan.portfolioImages
                            : [1, 2, 3, 4, 5, 6].map(i => `https://picsum.photos/seed/${artisan.id * 10 + i}/400/400`);

                          const portfolioVideos: string[] = artisan.portfolioVideos?.length > 0 ? artisan.portfolioVideos : [];

                          const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
                            star,
                            count: reviews.filter((r: any) => r.rating === star).length,
                          }));
                          const avgRating = reviews.length > 0
                            ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
                            : artisan.rating || 0;

                          return (
                            <div className="min-h-screen flex flex-col bg-background font-sans">
                              <Navbar />

                              {/* Login Dialog */}
                              <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                                <DialogContent className="sm:max-w-md rounded-[2rem] p-8" dir="rtl">
                                  <DialogHeader className="mb-6">
                                    <DialogTitle className="text-2xl font-heading font-black">تواصل مع الحرفي</DialogTitle>
                                    <DialogDescription className="text-base">
                                      أدخل بياناتك للتواصل مع <strong>{artisan.name}</strong>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={handleGuestLogin} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest opacity-70">اسمك</Label>
                                      <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="محمد علي" value={loginForm.name}
                                          onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))}
                                          className="h-12 rounded-xl pr-10 bg-muted/30 border-none ring-1 ring-border" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest opacity-70">رقم هاتفك</Label>
                                      <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="tel" placeholder="06XXXXXXXX" value={loginForm.phone}
                                          onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))}
                                          className="h-12 rounded-xl pr-10 bg-muted/30 border-none ring-1 ring-border" />
                                      </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 font-black rounded-xl text-base">
                                      <MessageCircle className="h-4 w-4 ml-2" />
                                      تواصل الآن
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                      لديك حساب حرفي؟{" "}
                                      <span className="text-primary cursor-pointer font-bold" onClick={() => { setShowLoginDialog(false); setLocation("/subscription"); }}>
                                        سجّل كحرفي
                                      </span>
                                    </p>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <main className="flex-1 pb-16" dir="rtl">
                                {/* Cover */}
                                <div className="h-64 md:h-80 w-full bg-muted relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                  <img src={artisan.imageUrl || mockArtisan.image} alt="cover" className="w-full h-full object-cover blur-sm scale-105" />
                                </div>

                                <div className="container px-4 md:px-8 relative z-20 -mt-20">
                                  <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background overflow-hidden shadow-lg shrink-0 bg-muted">
                                        <img src={artisan.imageUrl || mockArtisan.image} alt={artisan.name} className="w-full h-full object-cover" />
                                      </div>

                                      <div className="flex-1 space-y-2 w-full">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h1 className="text-3xl font-heading font-bold">{artisan.name}</h1>
                                              {artisan.isVerified && <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-50" />}
                                            </div>
                                            <p className="text-muted-foreground text-lg flex items-center gap-2 mt-1">
                                              <span className="font-bold text-primary">{artisan.category}</span>
                                              <span>•</span>
                                              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {artisan.daira}</span>
                                            </p>
                                          </div>
                                          <div className="flex gap-3 w-full md:w-auto">
                                            <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="icon" className="rounded-full"><Heart className="w-4 h-4" /></Button>
                                            <Button
                                              size="lg"
                                              className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                              onClick={handleContactClick}
                                            >
                                              <MessageCircle className="w-5 h-5" />
                                              تواصل معي
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 flex-wrap">
                                          <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold text-lg">{avgRating}</span>
                                            <span className="text-muted-foreground text-sm">({reviews.length || artisan.reviewCount || 0} تقييم)</span>
                                          </div>
                                          {artisan.yearsOfExperience && artisan.yearsOfExperience > 0 && (
                                            <>
                                              <div className="w-px h-5 bg-border hidden md:block" />
                                              <div className="flex items-center gap-1.5 text-sm">
                                                <Briefcase className="w-4 h-4 text-muted-foreground" />
                                                <span>{artisan.yearsOfExperience} سنوات خبرة</span>
                                              </div>
                                            </>
                                          )}
                                          {artisan.priceStart && (
                                            <>
                                              <div className="w-px h-5 bg-border hidden md:block" />
                                              <div className="flex items-center gap-1.5 text-sm">
                                                <Banknote className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-bold text-primary">من {artisan.priceStart} دج</span>
                                              </div>
                                            </>
                                          )}
                                          {artisan.phone && (
                                            <>
                                              <div className="w-px h-5 bg-border hidden md:block" />
                                              <div className="flex items-center gap-1.5 text-sm">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                <span dir="ltr">{artisan.phone}</span>
                                              </div>
                                            </>
                                          )}
                                          <div className="w-px h-5 bg-border hidden md:block" />
                                          <div className="flex items-center gap-1.5 text-sm">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>يرد خلال ساعة</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-10">
                                      <Tabs defaultValue="about" className="w-full">
                                        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                                          <TabsTrigger value="about" className="px-6 py-3 rounded-lg text-base">حول الحرفي</TabsTrigger>
                                          <TabsTrigger value="portfolio" className="px-6 py-3 rounded-lg text-base">معرض الأعمال</TabsTrigger>
                                          <TabsTrigger value="reviews" className="px-6 py-3 rounded-lg text-base">
                                            التقييمات
                                            {reviews.length > 0 && (
                                              <Badge className="mr-2 h-5 px-1.5 text-xs">{reviews.length}</Badge>
                                            )}
                                          </TabsTrigger>
                                        </TabsList>

                                        {/* About Tab */}
                                        <TabsContent value="about" className="mt-6 space-y-6">
                                          <div>
                                            <h3 className="text-xl font-heading font-bold mb-3">نبذة تعريفية</h3>
                                            <p className="text-muted-foreground leading-relaxed text-lg">
                                              {artisan.description || mockArtisan.description}
                                            </p>
                                          </div>           
                                        </TabsContent>

                                        {/* Portfolio Tab */}
                                        <TabsContent value="portfolio" className="mt-6 space-y-6">
                                          {portfolioVideos.length > 0 && (
                                            <div>
                                              <h4 className="font-bold mb-3 text-foreground">فيديوهات الأعمال</h4>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {portfolioVideos.map((vid, i) => (
                                                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black border border-border">
                                                    <video src={vid} controls preload="metadata" playsInline className="w-full h-full object-contain" />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          <div>
                                            {portfolioVideos.length > 0 && <h4 className="font-bold mb-3 text-foreground">صور الأعمال</h4>}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                              {portfolioImages.map((img: any, i: number) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted group relative">
                                                  <img
                                                    src={typeof img === 'string' ? img : img.url || img}
                                                    loading="lazy"
                                                    alt="Project"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm">عرض</Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </TabsContent>

                                        {/* Reviews Tab */}
                                        <TabsContent value="reviews" className="mt-6 space-y-6">
                                          {reviews.length > 0 && (
                                            <div className="flex flex-col md:flex-row gap-6 p-6 bg-muted/30 rounded-2xl border border-border">
                                              <div className="flex flex-col items-center justify-center min-w-[120px]">
                                                <span className="text-5xl font-black text-primary">{avgRating}</span>
                                                <div className="flex gap-0.5 mt-2">
                                                  {[1,2,3,4,5].map(s => (
                                                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                                  ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground mt-1">{reviews.length} تقييم</span>
                                              </div>
                                              <div className="flex-1 space-y-2">
                                                {ratingCounts.map(({ star, count }) => (
                                                  <div key={star} className="flex items-center gap-3">
                                                    <span className="text-sm w-4 text-muted-foreground">{star}</span>
                                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                                                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                      <div
                                                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                                                      />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground w-4">{count}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {isLoggedIn && !isArtisan && (
                                            <div>
                                              {!hasConversation ? (
                                                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                                                  <MessageCircle className="w-5 h-5 shrink-0 text-primary/50" />
                                                  <span>يجب أن تتواصل مع هذا الحرفي أولاً قبل أن تتمكن من تقييمه</span>
                                                  <Button size="sm" variant="outline" className="mr-auto shrink-0 border-primary/30 text-primary" onClick={handleContactClick}>
                                                    تواصل الآن
                                                  </Button>
                                                </div>
                                              ) : !showReviewForm ? (
                                                <Button
                                                  variant="outline"
                                                  className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                                                  onClick={() => setShowReviewForm(true)}
                                                >
                                                  <Star className="w-4 h-4" />
                                                  أضف تقييمك
                                                </Button>
                                              ) : (
                                                <form onSubmit={handleSubmitReview} className="p-5 bg-muted/20 rounded-2xl border border-border space-y-4">
                                                  <h4 className="font-bold text-base">تقييمك للحرفي</h4>
                                                  <div className="flex gap-2">
                                                    {[1,2,3,4,5].map(s => (
                                                      <button
                                                        key={s} type="button"
                                                        onMouseEnter={() => setReviewHover(s)}
                                                        onMouseLeave={() => setReviewHover(0)}
                                                        onClick={() => setReviewRating(s)}
                                                      >
                                                        <Star className={`w-8 h-8 transition-colors ${s <= (reviewHover || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                                      </button>
                                                    ))}
                                                    {reviewRating > 0 && (
                                                      <span className="text-sm text-muted-foreground self-center mr-2">
                                                        {['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][reviewRating]}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <Textarea
                                                    placeholder="شارك تجربتك مع هذا الحرفي... (اختياري)"
                                                    value={reviewComment}
                                                    onChange={e => setReviewComment(e.target.value)}
                                                    className="resize-none bg-background"
                                                    rows={3}
                                                  />
                                                  <div className="flex gap-3">
                                                    <Button type="submit" disabled={submitReview.isPending} className="gap-2">
                                                      {submitReview.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
                                                    </Button>
                                                    <Button type="button" variant="ghost" onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); }}>
                                                      إلغاء
                                                    </Button>
                                                  </div>
                                                </form>
                                              )}
                                            </div>
                                          )}

                                          {!isLoggedIn && (
                                            <button
                                              onClick={() => setShowLoginDialog(true)}
                                              className="text-sm text-primary underline underline-offset-2"
                                            >
                                              سجّل دخولك لإضافة تقييم
                                            </button>
                                          )}

                                          {reviewsLoading ? (
                                            <div className="space-y-4">
                                              {[1,2,3].map(i => (
                                                <div key={i} className="p-5 rounded-2xl border border-border animate-pulse bg-muted/20 h-28" />
                                              ))}
                                            </div>
                                          ) : reviews.length === 0 ? (
                                            <div className="text-center py-16 text-muted-foreground">
                                              <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                              <p className="text-lg font-medium">لا توجد تقييمات بعد</p>
                                              <p className="text-sm mt-1">كن أول من يقيّم هذا الحرفي!</p>
                                            </div>
                                          ) : (
                                            <div className="space-y-4">
                                              {reviews.map((review: any) => (
                                                <div key={review.id} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors">
                                                  <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                                                        {review.customerName?.[0] || "؟"}
                                                      </div>
                                                      <div>
                                                        <p className="font-bold text-sm">{review.customerName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                          {new Date(review.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex gap-0.5 shrink-0">
                                                      {[1,2,3,4,5].map(s => (
                                                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                                                      ))}
                                                    </div>
                                                  </div>
                                                  {review.comment && (
                                                    <p className="mt-3 text-muted-foreground text-sm leading-relaxed pr-13">
                                                      {review.comment}
                                                    </p>
                                                  )}
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