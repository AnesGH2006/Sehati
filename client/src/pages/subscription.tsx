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
  const [activePhase, setActivePhase] = useState<"basic" | "premium">("basic");
  const isRtl = i18n.language === 'ar';

  const basicPlan = {
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
    ],
    color: "border-slate-200",
    buttonVariant: "outline" as const
  };

  const premiumPlans = [
    {
      id: "standard",
      name: t('subscription.plan_standard'),
      price: t('subscription.price_standard'),
      duration: t('subscription.duration_month'),
      description: isRtl ? "الخيار الأفضل للنمو" : "Best for growth",
      features: [
        t('subscription.feat_portfolio_unlimited'),
        t('subscription.feat_search_priority'),
        t('subscription.feat_badge_verified'),
        t('subscription.feat_stats'),
      ],
      color: "border-blue-500/30 ring-1 ring-blue-500/20",
      buttonVariant: "outline" as const
    },
    {
      id: "pro",
      name: t('subscription.plan_pro'),
      price: t('subscription.price_pro'),
      duration: t('subscription.duration_month'),
      description: isRtl ? "للمحترفين" : "For professionals",
      features: [
        t('subscription.feat_portfolio_unlimited'),
        t('subscription.feat_search_top'),
        t('subscription.feat_badge_gold'),
        t('subscription.feat_ads'),
      ],
      color: "border-amber-500/50 ring-1 ring-amber-500/10",
      buttonVariant: "default" as const
    },
    {
      id: "gold",
      name: isRtl ? "ذهبي" : "Gold",
      price: "5000 DA",
      duration: t('subscription.duration_month'),
      description: isRtl ? "الخطة الفاخرة المتميزة" : "Premium luxury plan",
      popular: true,
      features: [
        isRtl ? "معرض أعمال غير محدود" : "Unlimited portfolio",
        isRtl ? "الظهور الأول في البحث" : "Top search placement",
        isRtl ? "شارة ذهبية حصرية" : "Exclusive gold badge",
        isRtl ? "دعم أولوية 24/7" : "24/7 priority support",
      ],
      color: "border-yellow-400 ring-2 ring-yellow-400/30 scale-105",
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
        description: isRtl ? "أهلاً بك في عائلة حرفتي! حسابك مفعل الآن. جاري التوجيه..." : "Welcome to Herfati! Your account is now active. Redirecting...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      setTimeout(() => {
        setLocation("/artisans");
      }, 2000);
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
      rating: "0",
      reviews: 0,
      portfolioImages: [],
      ownerId: "guest-" + Date.now(),
    };
    registerMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-8 max-w-lg p-12 bg-card rounded-[3rem] border shadow-2xl"
          >
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-heading font-black text-primary leading-tight">{t('subscription.under_review')}</h1>
            <p className="text-muted-foreground text-xl leading-relaxed">
              {t('subscription.review_desc')}
            </p>
            <Button size="lg" className="w-full h-16 text-lg font-black rounded-2xl" variant="outline" onClick={() => window.location.href = "/"}>{t('common.back_home')}</Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 md:py-32">
        <div className="container max-w-[1920px] mx-auto px-4 md:px-8 xl:px-12">
          {/* Header */}
          <div className="text-center max-w-4xl mx-auto mb-20 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('subscription.title')}
              </h1>
              <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-4xl mx-auto leading-relaxed opacity-80">
                {t('subscription.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Phase 1: Basic */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1600px] mx-auto mb-20 md:mb-32"
          >
            <div className="flex justify-center">
              <div className="w-full md:w-1/2 lg:w-2/5">
                <PlanCard plan={basicPlan} onJoin={handleJoin} t={t} i18n={i18n} registerMutation={registerMutation} index={0} />
              </div>
            </div>
          </motion.div>

          {/* Divider with animation */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-20 md:mb-32"
          />

          {/* Phase 2: Premium Plans */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1600px] mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-black text-foreground">
                {isRtl ? "خطط متقدمة" : "Premium Plans"}
              </h2>
              <p className="text-muted-foreground font-medium mt-4">
                {isRtl ? "اختر الخطة التي تناسب احتياجاتك" : "Choose the plan that suits your needs"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {premiumPlans.map((plan, index) => (
                <PlanCard 
                  key={plan.id}
                  plan={plan} 
                  onJoin={handleJoin} 
                  t={t} 
                  i18n={i18n} 
                  registerMutation={registerMutation} 
                  index={index + 1}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PlanCard({ plan, onJoin, t, i18n, registerMutation, index }: any) {
  const isRtl = i18n.language === 'ar';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.15,
        ease: [0.23, 1, 0.32, 1] 
      }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <Card className={`relative h-full border-2 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col transition-all duration-700 hover:shadow-primary/20 ${plan.color}`}>
        {plan.popular && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.2 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl z-10"
          >
            {isRtl ? "الأكثر طلباً" : "Most Popular"}
          </motion.div>
        )}
        
        <CardHeader className={`${plan.popular ? 'pt-16' : 'pt-8'} px-8 pb-4 text-center`}>
          <CardTitle className="text-2xl font-black mb-1">{plan.name}</CardTitle>
          <CardDescription className="text-xs font-bold opacity-70 h-8">{plan.description}</CardDescription>
          <div className="mt-4 space-y-1">
            <span className="text-4xl font-black font-heading tracking-tighter text-foreground">{plan.price}</span>
            <span className="text-muted-foreground font-bold text-sm block">{plan.duration}</span>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-4 flex-1">
          <div className="space-y-3">
            <p className="font-black text-[9px] uppercase tracking-widest text-muted-foreground mb-3">{isRtl ? "المميزات:" : "Features:"}</p>
            {plan.features.map((feature: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.1 + (i * 0.08) }}
                className="flex items-center gap-2.5"
              >
                <div className="bg-primary/10 rounded-full p-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold">{feature}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-8 pt-0">
          <JoinDialog 
            plan={plan.name} 
            onSubmit={onJoin} 
            t={t} 
            i18n={i18n} 
            registerMutation={registerMutation}
            buttonVariant={plan.buttonVariant}
          />
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function JoinDialog({ plan, onSubmit, t, i18n, registerMutation, buttonVariant = "default" }: { plan: string, onSubmit: (e: any) => void, t: any, i18n: any, registerMutation: any, buttonVariant?: "default" | "outline" }) {
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    daira: "",
    priceStart: "",
    yearsOfExperience: "",
    subscriptionDuration: "1",
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: ""
  });
  const portfolioRef = useRef<HTMLInputElement>(null);
  const isRtl = i18n.language === 'ar';

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.category || !selectedWilaya || !formData.daira.trim() || !formData.priceStart || !formData.yearsOfExperience) {
        toast({
          title: isRtl ? "تنبيه" : "Warning",
          description: isRtl ? "الرجاء ملء جميع الحقول المطلوبة قبل المتابعة" : "Please fill all required fields before continuing",
          variant: "destructive",
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "الرجاء إدخال بريد إلكتروني صحيح" : "Please enter a valid email",
          variant: "destructive",
        });
        return;
      }
      if (formData.phone.trim().length < 10) {
        toast({
          title: isRtl ? "خطأ" : "Error",
          description: isRtl ? "الرجاء إدخال رقم هاتف صحيح" : "Please enter a valid phone number",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.category || !formData.daira || !formData.priceStart || formData.priceStart === '') {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "الرجاء ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      category: formData.category.trim(),
      wilaya: selectedWilaya || "الجزائر",
      daira: formData.daira.trim(),
      priceStart: parseInt(formData.priceStart) || 1000,
      yearsOfExperience: parseInt(formData.yearsOfExperience) || 1,
      subscriptionType: plan.toLowerCase() === 'starter' ? 'free' : plan.toLowerCase(),
      subscriptionDuration: parseInt(formData.subscriptionDuration) || 1,
      description: isRtl ? "حرفي محترف في منصة حرفتي" : "Professional artisan on Herfati",
      imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=400&fit=crop",
      isVerified: false,
      portfolioImages: [],
      ownerId: "guest-" + Date.now(),
    };
    
    console.log("Submitting artisan data:", data);
    registerMutation.mutate(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant={buttonVariant} className={`w-full h-14 text-base font-black rounded-2xl shadow-xl transition-all hover:scale-[1.05] active:scale-95 ${buttonVariant === 'default' ? 'shadow-primary/20' : ''}`}>
          {t('subscription.subscribe_now')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar p-10 rounded-[3rem]">
        <DialogHeader className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="font-heading text-3xl font-black">{t('subscription.form_title', { plan })}</DialogTitle>
            <div className="flex gap-2">
              <div className={`h-3 w-8 rounded-full transition-all ${currentStep === 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-3 w-8 rounded-full transition-all ${currentStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </div>
          <DialogDescription className="text-lg font-medium mt-2">
            {currentStep === 1 
              ? (isRtl ? "الخطوة الأولى: معلوماتك الشخصية" : "Step 1: Personal Information")
              : (isRtl ? "الخطوة الثانية: معلومات الدفع" : "Step 2: Payment Information")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            {currentStep === 1 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{t('subscription.full_name')}</Label>
                    <div className="relative">
                      <User className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input 
                        placeholder={isRtl ? "محمد علي" : "John Doe"} 
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        className={`h-14 rounded-2xl text-lg ${isRtl ? "pr-12" : "pl-12"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{t('subscription.email')}</Label>
                    <div className="relative">
                      <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input 
                        type="email" 
                        placeholder="example@gmail.com" 
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className={`h-14 rounded-2xl text-lg ${isRtl ? "pr-12" : "pl-12"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "رقم الهاتف" : "Phone Number"}</Label>
                  <div className="relative">
                    <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input 
                      type="tel" 
                      placeholder="06XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className={`h-14 rounded-2xl text-lg ${isRtl ? "pr-12" : "pl-12"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{t('subscription.price_start')}</Label>
                    <div className="relative">
                      <Banknote className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input 
                        type="number" 
                        placeholder="1500" 
                        value={formData.priceStart}
                        onChange={(e) => handleFormChange('priceStart', e.target.value)}
                        className={`h-14 rounded-2xl text-lg ${isRtl ? "pr-12" : "pl-12"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{t('subscription.exp_years')}</Label>
                    <div className="relative">
                      <Briefcase className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input 
                        type="number" 
                        placeholder="5" 
                        value={formData.yearsOfExperience}
                        onChange={(e) => handleFormChange('yearsOfExperience', e.target.value)}
                        className={`h-14 rounded-2xl text-lg ${isRtl ? "pr-12" : "pl-12"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{t('subscription.category_label')}</Label>
                    <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)} dir={isRtl ? "rtl" : "ltr"} required>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border">
                        <SelectValue placeholder={t('subscription.category_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "الولاية" : "Wilaya"}</Label>
                    <Select value={selectedWilaya || ""} onValueChange={(val) => { setSelectedWilaya(val); handleFormChange('daira', (LOCATIONS as any)[val][0]); }} dir={isRtl ? "rtl" : "ltr"} required>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border">
                        <SelectValue placeholder={isRtl ? "الولاية" : "Wilaya"} />
                      </SelectTrigger>
                      <SelectContent>
                        {DAIRAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "الدائرة" : "Daira"}</Label>
                    <Select value={formData.daira} onValueChange={(value) => handleFormChange('daira', value)} dir={isRtl ? "rtl" : "ltr"} disabled={!selectedWilaya} required>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border">
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
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "اسم صاحب البطاقة" : "Card Holder Name"}</Label>
                  <Input 
                    placeholder={isRtl ? "محمد علي" : "John Doe"} 
                    value={formData.cardHolder}
                    onChange={(e) => handleFormChange('cardHolder', e.target.value)}
                    className={`h-14 rounded-2xl text-lg bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} 
                    required 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "رقم البطاقة" : "Card Number"}</Label>
                  <Input 
                    placeholder="1234 5678 9012 3456" 
                    value={formData.cardNumber}
                    onChange={(e) => handleFormChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                    maxLength={16}
                    className={`h-14 rounded-2xl text-lg bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary font-mono`} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "انتهاء الصلاحية" : "Expiry Date"}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={formData.expiryMonth} onValueChange={(value) => handleFormChange('expiryMonth', value)} required>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border focus:ring-primary">
                          <SelectValue placeholder={isRtl ? "الشهر" : "MM"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => `${String(i + 1).padStart(2, '0')}`).map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={formData.expiryYear} onValueChange={(value) => handleFormChange('expiryYear', value)} required>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border focus:ring-primary">
                          <SelectValue placeholder={isRtl ? "السنة" : "YY"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => `${String(new Date().getFullYear() + i).slice(-2)}`).map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest opacity-70">CVV</Label>
                    <Input 
                      placeholder="123" 
                      value={formData.cvv}
                      onChange={(e) => handleFormChange('cvv', e.target.value.replace(/\D/g, ''))}
                      maxLength={3}
                      className={`h-14 rounded-2xl text-lg bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary font-mono text-center`} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest opacity-70">{isRtl ? "مدة الاشتراك" : "Subscription Duration"}</Label>
                  <Select value={formData.subscriptionDuration} onValueChange={(value) => handleFormChange('subscriptionDuration', value)} required>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border">
                      <SelectValue placeholder={isRtl ? "اختر المدة" : "Select Duration"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{isRtl ? "شهر واحد" : "1 Month"}</SelectItem>
                      <SelectItem value="3">{isRtl ? "3 أشهر" : "3 Months"}</SelectItem>
                      <SelectItem value="6">{isRtl ? "6 أشهر" : "6 Months"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 border-2 border-dashed rounded-[1.5rem] bg-primary/5 text-center space-y-1 border-primary/20">
                  <p className="text-sm font-black text-primary">{isRtl ? "بيانات آمنة" : "Secure Payment"}</p>
                  <p className="text-xs text-muted-foreground font-medium">{isRtl ? "معلوماتك محمية بالكامل" : "Your information is fully protected"}</p>
                </div>
              </>
            )}
          </motion.div>

          <div className="flex gap-4 mt-8">
            {currentStep === 2 && (
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-14 font-black rounded-2xl transition-all active:scale-95"
                onClick={handleBack}
              >
                {isRtl ? "رجوع" : "Back"}
              </Button>
            )}
            {currentStep === 1 ? (
              <Button 
                type="button" 
                className="flex-1 h-14 font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                onClick={handleNext}
              >
                {isRtl ? "التالي" : "Next"}
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="flex-1 h-14 font-black rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? t('common.loading') : (isRtl ? "إتمام التسجيل" : "Complete Registration")}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
