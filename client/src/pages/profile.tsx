import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { MOCK_ARTISANS } from "@/lib/constants";
import { MapPin, Star, MessageCircle, Share2, Heart, CheckCircle2, Clock, Globe, X, Phone, User } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const [match, params] = useRoute("/profile/:id");
  const id = params ? parseInt(params.id) : 1;
  const { isLoggedIn, isArtisan, customer, loginCustomer } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", phone: "" });

  // Try to fetch from API first, fall back to mock
  const { data: apiArtisan } = useQuery({
    queryKey: ["/api/artisans", id],
    queryFn: () => fetch(`/api/artisans/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
  });

  const mockArtisan = MOCK_ARTISANS.find(a => a.id === id) || MOCK_ARTISANS[0];
  const artisan = apiArtisan || {
    id: mockArtisan.id,
    name: mockArtisan.name,
    category: mockArtisan.category,
    daira: mockArtisan.daira,
    imageUrl: mockArtisan.image,
    rating: mockArtisan.rating,
    reviewCount: mockArtisan.reviews,
    description: mockArtisan.description,
    isVerified: mockArtisan.isVerified,
    portfolioImages: [],
    yearsOfExperience: 5,
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

  const portfolioImages = artisan.portfolioImages?.length > 0
    ? artisan.portfolioImages
    : [1, 2, 3, 4, 5, 6].map(i => `https://picsum.photos/seed/${artisan.id * 10 + i}/400/400`);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      {/* Login Required Dialog */}
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
                      data-testid="button-contact-artisan"
                    >
                      <MessageCircle className="w-5 h-5" />
                      تواصل معي
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{artisan.rating || mockArtisan.rating}</span>
                    <span className="text-muted-foreground">({artisan.reviewCount || mockArtisan.reviews} تقييم)</span>
                  </div>
                  <div className="w-px h-6 bg-border hidden md:block"></div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>يرد خلال ساعة</span>
                  </div>
                  <div className="w-px h-6 bg-border hidden md:block"></div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>يتحدث العربية، الفرنسية</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="about" className="px-6 py-3 rounded-lg text-base">حول الحرفي</TabsTrigger>
                  <TabsTrigger value="portfolio" className="px-6 py-3 rounded-lg text-base">معرض الأعمال</TabsTrigger>
                  <TabsTrigger value="reviews" className="px-6 py-3 rounded-lg text-base">التقييمات</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-3">نبذة تعريفية</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {artisan.description || mockArtisan.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                      <h4 className="font-bold mb-2">الخدمات المقدمة</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>التركيب والصيانة</li>
                        <li>التصليحات العاجلة</li>
                        <li>الاستشارات الفنية</li>
                        <li>التصميم والتنفيذ</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <h4 className="font-bold mb-2">أوقات العمل</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex justify-between"><span>الأحد - الخميس</span> <span>08:00 - 18:00</span></li>
                        <li className="flex justify-between"><span>السبت</span> <span>09:00 - 14:00</span></li>
                        <li className="flex justify-between"><span>الجمعة</span> <span className="text-red-500">مغلق</span></li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioImages.map((img: any, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted group relative">
                        <img src={typeof img === 'string' ? img : img.url || img}
                          alt="Project" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm">عرض</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="text-center py-12 text-muted-foreground">قريباً...</div>
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
