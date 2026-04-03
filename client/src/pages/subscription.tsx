import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Check, Mail, User, Banknote, Briefcase, Phone, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { DAIRAS, CATEGORIES, LOCATIONS } from "@/lib/constants";
import { useToast as useToastHook } from "@/hooks/use-toast";

export default function Subscription() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { loginArtisan } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isRtl = i18n.language === 'ar';

  const features = [
    isRtl ? "ملف شخصي احترافي مجاني" : "Free professional profile",
    isRtl ? "معرض أعمال (5 صور)" : "Portfolio (5 photos)",
    isRtl ? "تواصل مباشر مع الزبائن" : "Direct customer contact",
    isRtl ? "الظهور في نتائج البحث" : "Appear in search results",
    isRtl ? "لوحة تحكم متكاملة" : "Full dashboard",
    isRtl ? "مجاني للأبد" : "Free forever",
  ];

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/artisans", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setIsSubmitted(true);
      loginArtisan({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        category: data.category,
        wilaya: data.wilaya,
        daira: data.daira,
        subscriptionType: data.subscriptionType,
        imageUrl: data.imageUrl,
      });
      toast({
        title: isRtl ? "تم التسجيل بنجاح! 🎉" : "Registration Successful! 🎉",
        description: isRtl ? "أهلاً بك في حرفتي! جاري التوجيه للوحة التحكم..." : "Welcome to Herfati! Redirecting to dashboard...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      setTimeout(() => setLocation("/artisan/dashboard"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: isRtl ? "فشل التسجيل" : "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-lg p-12 bg-card rounded-[3rem] border shadow-2xl"
          >
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-heading font-black text-primary">{isRtl ? "تم التسجيل!" : "Registered!"}</h1>
            <p className="text-muted-foreground text-lg">{isRtl ? "جاري التوجيه للوحة التحكم..." : "Redirecting to dashboard..."}</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
              {isRtl ? "مجاني تماماً" : "100% Free"}
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tight">
              {isRtl ? "انضم كحرفي" : "Join as Artisan"}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              {isRtl ? "أنشئ ملفك المهني وابدأ في استقبال الزبائن اليوم" : "Create your professional profile and start receiving customers today"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-2 border-primary/20 rounded-[2.5rem] shadow-2xl shadow-primary/10 overflow-hidden">
              <CardHeader className="pt-10 px-10 pb-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
                <div className="text-5xl font-black font-heading text-primary mb-2">{isRtl ? "مجاني" : "FREE"}</div>
                <CardTitle className="text-2xl font-black mb-1">{isRtl ? "خطة المبتدئ" : "Starter Plan"}</CardTitle>
                <p className="text-muted-foreground font-medium">{isRtl ? "كل ما تحتاجه للبداية" : "Everything you need to start"}</p>
              </CardHeader>

              <CardContent className="px-10 pb-6">
                <div className="space-y-3 mb-8">
                  {features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex items-center gap-3"
                    >
                      <div className="bg-primary/10 rounded-full p-1 shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="px-10 pb-10">
                <JoinDialog isRtl={isRtl} registerMutation={registerMutation} t={t} i18n={i18n} />
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function JoinDialog({ isRtl, registerMutation, t, i18n }: any) {
  const { toast } = useToastHook();
  const [open, setOpen] = useState(false);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", category: "", daira: "",
    priceStart: "", yearsOfExperience: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() ||
        !formData.category || !selectedWilaya || !formData.daira || !formData.priceStart) {
      toast({
        title: isRtl ? "تنبيه" : "Warning",
        description: isRtl ? "الرجاء ملء جميع الحقول" : "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "البريد الإلكتروني غير صحيح" : "Invalid email", variant: "destructive" });
      return;
    }
    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      category: formData.category,
      wilaya: selectedWilaya,
      daira: formData.daira,
      priceStart: parseInt(formData.priceStart) || 1000,
      yearsOfExperience: parseInt(formData.yearsOfExperience) || 1,
      subscriptionType: "free",
      subscriptionDuration: 1,
      description: isRtl ? "حرفي محترف في منصة حرفتي" : "Professional artisan on Herfati",
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=2DD4BF&color=fff&size=400`,
      isVerified: false,
      portfolioImages: [],
    };
    registerMutation.mutate(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all">
          {isRtl ? "سجّل الآن مجاناً" : "Register Now - Free"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-10 rounded-[3rem]" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className="mb-6">
          <DialogTitle className="font-heading text-3xl font-black">{isRtl ? "إنشاء حساب حرفي" : "Create Artisan Account"}</DialogTitle>
          <DialogDescription className="text-base font-medium">{isRtl ? "أدخل بياناتك لبدء رحلتك مع حرفتي" : "Enter your details to start your journey with Herfati"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
              <div className="relative">
                <User className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input placeholder={isRtl ? "محمد علي" : "John Doe"} value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={`h-12 rounded-xl ${isRtl ? "pr-10" : "pl-10"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input type="email" placeholder="email@example.com" value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`h-12 rounded-xl ${isRtl ? "pr-10" : "pl-10"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
            <div className="relative">
              <Phone className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input type="tel" placeholder="06XXXXXXXX" value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className={`h-12 rounded-xl ${isRtl ? "pr-10" : "pl-10"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "السعر الأدنى (دج)" : "Min Price (DA)"}</Label>
              <div className="relative">
                <Banknote className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input type="number" placeholder="1500" value={formData.priceStart}
                  onChange={e => handleChange('priceStart', e.target.value)}
                  className={`h-12 rounded-xl ${isRtl ? "pr-10" : "pl-10"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "سنوات الخبرة" : "Experience (yrs)"}</Label>
              <div className="relative">
                <Briefcase className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input type="number" placeholder="5" value={formData.yearsOfExperience}
                  onChange={e => handleChange('yearsOfExperience', e.target.value)}
                  className={`h-12 rounded-xl ${isRtl ? "pr-10" : "pl-10"} bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary`} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "المهنة" : "Category"}</Label>
            <Select value={formData.category} onValueChange={v => handleChange('category', v)} dir={isRtl ? "rtl" : "ltr"}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none ring-1 ring-border">
                <SelectValue placeholder={isRtl ? "اختر مهنتك" : "Select your craft"} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "الولاية" : "Wilaya"}</Label>
              <Select value={selectedWilaya || ""} onValueChange={val => {
                setSelectedWilaya(val);
                handleChange('daira', (LOCATIONS as any)[val]?.[0] || "");
              }} dir={isRtl ? "rtl" : "ltr"}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none ring-1 ring-border">
                  <SelectValue placeholder={isRtl ? "الولاية" : "Wilaya"} />
                </SelectTrigger>
                <SelectContent>
                  {DAIRAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest opacity-70">{isRtl ? "الدائرة" : "Daira"}</Label>
              <Select value={formData.daira} onValueChange={v => handleChange('daira', v)} disabled={!selectedWilaya} dir={isRtl ? "rtl" : "ltr"}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none ring-1 ring-border">
                  <SelectValue placeholder={isRtl ? "الدائرة" : "Daira"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedWilaya && (LOCATIONS as any)[selectedWilaya]?.map((d: string) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 font-black rounded-2xl text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? (isRtl ? "جاري التسجيل..." : "Registering...") : (isRtl ? "إنشاء الحساب" : "Create Account")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}