import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Check, Mail, User, Banknote, Briefcase, Image as ImageIcon, Clock, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { DAIRAS, CATEGORIES, LOCATIONS } from "@/lib/constants";

export default function Subscription() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isRtl = i18n.language === 'ar';

  const plans = [
    {
      id: "starter",
      name: t('subscription.plan_starter'),
      price: t('subscription.price_free'),
      duration: t('subscription.duration_forever'),
      description: isRtl ? "بداية مثالية للحرفيين الجدد" : "Perfect start for new artisans",
      features: [
        t('subscription.feat_profile'),
        t('subscription.feat_portfolio'),
        t('subscription.feat_chat'),
        t('subscription.feat_search_basic'),
        t('subscription.feat_support_basic'),
      ],
      color: "border-slate-200",
      buttonVariant: "outline" as const
    },
    {
      id: "standard",
      name: t('subscription.plan_standard'),
      price: t('subscription.price_standard'),
      duration: t('subscription.duration_month'),
      description: isRtl ? "الخيار الأفضل للنمو السريع" : "The best choice for rapid growth",
      popular: true,
      features: [
        t('subscription.feat_profile'),
        t('subscription.feat_portfolio_unlimited'),
        t('subscription.feat_chat'),
        t('subscription.feat_search_priority'),
        t('subscription.feat_badge_verified'),
        t('subscription.feat_stats'),
        t('subscription.feat_support_priority'),
      ],
      color: "border-primary ring-2 ring-primary/20 scale-105",
      buttonVariant: "default" as const
    },
    {
      id: "pro",
      name: t('subscription.plan_pro'),
      price: t('subscription.price_pro'),
      duration: t('subscription.duration_month'),
      description: isRtl ? "للمحترفين والشركات الكبيرة" : "For professionals and large businesses",
      features: [
        t('subscription.feat_profile'),
        t('subscription.feat_portfolio_unlimited'),
        t('subscription.feat_chat'),
        t('subscription.feat_search_top'),
        t('subscription.feat_badge_gold'),
        t('subscription.feat_stats'),
        t('subscription.feat_ads'),
        t('subscription.feat_sms'),
      ],
      color: "border-amber-500/50 ring-2 ring-amber-500/10",
      buttonVariant: "default" as const
    }
  ];

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/artisans", data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: isRtl ? "تم التسجيل بنجاح" : "Registration Successful",
        description: isRtl ? "أهلاً بك في عائلة حرفتي! حسابك مفعل الآن." : "Welcome to Herfati! Your account is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
    },
    onError: (error: Error) => {
      toast({
        title: isRtl ? "فشل التسجيل" : "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      category: formData.get("category"),
      daira: formData.get("daira"),
      priceStart: parseInt(formData.get("priceStart") as string),
      yearsOfExperience: parseInt(formData.get("yearsOfExperience") as string),
      description: isRtl ? "حرفي محترف في منصة حرفتي" : "Professional artisan on Herfati",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=400&fit=crop",
      isVerified: false,
      rating: "5.0",
      reviews: 0,
      portfolioImages: [],
      ownerId: "guest-" + Date.now(),
    };
    registerMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md p-8 bg-card rounded-3xl border shadow-xl"
          >
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary">{t('subscription.under_review')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('subscription.review_desc')}
            </p>
            <Button className="w-full" variant="outline" onClick={() => window.location.href = "/"}>{t('common.back_home')}</Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      <main className="flex-1 py-24">
        <div className="container px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-heading font-black tracking-tighter"
            >
              {t('subscription.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground font-medium"
            >
              {t('subscription.subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full border-2 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col transition-all duration-500 hover:-translate-y-2 ${plan.color}`}>
                  {plan.popular && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                      {isRtl ? "الأكثر طلباً" : "Most Popular"}
                    </div>
                  )}
                  
                  <CardHeader className="p-10 pb-6 text-center">
                    <CardTitle className="text-2xl font-black mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-sm font-bold min-h-[40px]">{plan.description}</CardDescription>
                    <div className="mt-8">
                      <span className="text-5xl font-black font-heading tracking-tighter text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground font-bold ml-1">{plan.duration}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-10 pt-0 flex-1">
                    <div className="space-y-4">
                      <p className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-6">{isRtl ? "ماذا ستحصل:" : "What's included:"}</p>
                      {plan.features.map((feature, i) => (
                        <FeatureItem key={i} text={feature} />
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="p-10 pt-0">
                    <JoinDialog 
                      plan={plan.name} 
                      onSubmit={handleJoin} 
                      t={t} 
                      i18n={i18n} 
                      registerMutation={registerMutation}
                      buttonVariant={plan.buttonVariant}
                    />
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary/10 rounded-full p-1 shrink-0">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-bold">{text}</span>
    </div>
  );
}

function JoinDialog({ plan, onSubmit, t, i18n, registerMutation, buttonVariant = "default" }: { plan: string, onSubmit: (e: any) => void, t: any, i18n: any, registerMutation: any, buttonVariant?: "default" | "outline" }) {
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const isRtl = i18n.language === 'ar';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant={buttonVariant} className={`w-full h-16 text-lg font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${buttonVariant === 'default' ? 'shadow-primary/20' : ''}`}>
          {t('subscription.subscribe_now')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t('subscription.form_title', { plan })}</DialogTitle>
          <DialogDescription>
            {isRtl ? "سجل معلوماتك المهنية وابدأ في استقبال طلبات الزبائن فوراً" : "Register your professional info and start receiving customer requests immediately"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.full_name')}</Label>
              <div className="relative">
                <User className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input name="name" placeholder={isRtl ? "محمد علي" : "John Doe"} className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('subscription.email')}</Label>
              <div className="relative">
                <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input name="email" type="email" placeholder="example@gmail.com" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRtl ? "رقم الهاتف" : "Phone Number"}</Label>
            <div className="relative">
              <Phone className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
              <Input name="phone" type="tel" placeholder="06XXXXXXXX" className={isRtl ? "pr-9" : "pl-9"} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.price_start')}</Label>
              <div className="relative">
                <Banknote className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input name="priceStart" type="number" placeholder="1500" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('subscription.exp_years')}</Label>
              <div className="relative">
                <Briefcase className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input name="yearsOfExperience" type="number" placeholder="5" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.category_label')}</Label>
              <Select name="category" dir={isRtl ? "rtl" : "ltr"} required>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder={t('subscription.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "الولاية" : "Wilaya"}</Label>
              <Select dir={isRtl ? "rtl" : "ltr"} onValueChange={setSelectedWilaya} required>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder={isRtl ? "الولاية" : "Wilaya"} />
                </SelectTrigger>
                <SelectContent>
                  {DAIRAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "الدائرة" : "Daira"}</Label>
              <Select name="daira" dir={isRtl ? "rtl" : "ltr"} disabled={!selectedWilaya} required>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder={isRtl ? "الدائرة" : "Daira"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedWilaya && (LOCATIONS as any)[selectedWilaya].map((d: string) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">{t('subscription.portfolio')}</Label>
            <input 
              type="file" 
              hidden 
              ref={portfolioRef} 
              multiple 
              accept="image/*" 
              onChange={(e) => setPortfolioCount(e.target.files?.length || 0)} 
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => portfolioRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              {portfolioCount > 0 ? t('subscription.portfolio_count', { count: portfolioCount }) : t('subscription.portfolio_select')}
            </Button>
          </div>
          
          <div className="p-4 border-2 border-dashed rounded-xl bg-primary/5 text-center space-y-2">
            <p className="text-sm font-bold text-primary">{isRtl ? "التسجيل مجاني لفترة محدودة" : "Registration is free for a limited time"}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "لا يتطلب رفع وصل دفع حالياً" : "No payment receipt required at this time"}</p>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold mt-4" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? t('common.loading') : (isRtl ? "إتمام التسجيل" : "Complete Registration")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
