import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  Star, 
  Eye, 
  LayoutDashboard, 
  Settings, 
  Image as ImageIcon, 
  CreditCard,
  TrendingUp,
  Clock,
  MapPin,
  Save,
  BadgeCheck,
  LogOut,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LOCATIONS, DAIRAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function ArtisanDashboard() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { artisan, isLoggedIn, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isRtl = i18n.language === 'ar';
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [wilaya, setWilaya] = useState(artisan?.wilaya || "الجزائر");
  const [daira, setDaira] = useState(artisan?.daira || "");

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/artisans/${artisan?.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      logout();
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      toast({
        title: isRtl ? "تم حذف الحساب" : "Account Deleted",
        description: isRtl ? "تم حذف حسابك بنجاح" : "Your account has been deleted successfully",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "فشل حذف الحساب" : "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl font-heading font-bold">{isRtl ? "يجب تسجيل الدخول أولاً" : "Please login first"}</h2>
            <p className="text-muted-foreground">{isRtl ? "سجّل كحرفي للوصول إلى لوحة التحكم" : "Register as an artisan to access the dashboard"}</p>
            <Button onClick={() => setLocation("/subscription")} className="bg-primary hover:bg-primary/90">
              {isRtl ? "انضم كحرفي" : "Join as Artisan"}
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleSaveLocation = () => {
    setIsEditingLocation(false);
    toast({
      title: "تم التحديث",
      description: "تم تغيير موقعك بنجاح",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans selection:bg-primary/30">
      <Navbar />
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>
      
      <main className="flex-1 container max-w-[1920px] mx-auto px-6 py-16 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-[1600px] space-y-12">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10 border-b border-white/5 pb-16" 
            dir="rtl"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                لوحة التحكم الاحترافية
              </div>
              <h1 className="text-6xl md:text-7xl font-heading font-black tracking-tighter bg-gradient-to-l from-white via-white to-white/40 bg-clip-text text-transparent">
                أهلاً بك، <span className="text-primary italic">{artisan?.name || "يا فنان"}</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-md leading-relaxed">
                تتبع أداء أعمالك، تواصل مع زبائنك، وقم بإدارة متجرك الإلكتروني من مكان واحد.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 lg:flex-none gap-3 h-14 px-8 rounded-2xl font-black border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-2xl transition-all active:scale-95 group"
                onClick={() => setIsEditingLocation(!isEditingLocation)}
              >
                <MapPin className="w-5 h-5 text-primary group-hover:animate-bounce" />
                تعديل الموقع
              </Button>
              <Button 
                className="flex-1 lg:flex-none gap-3 h-14 px-8 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-[0_15px_30px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95 group"
              >
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                إعدادات الحساب
              </Button>
            </div>
          </motion.div>

          {isEditingLocation && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 overflow-hidden"
              dir="rtl"
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-3">
                      <Label className="font-black text-sm text-white/60">الولاية</Label>
                      <Select value={wilaya} onValueChange={(val) => { setWilaya(val); setDaira((LOCATIONS as any)[val][0]); }}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold">
                          <SelectValue placeholder="اختر ولاية" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="bg-[#121212] border-white/10 text-white">
                          {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="font-black text-sm text-white/60">الدائرة</Label>
                      <Select value={daira} onValueChange={setDaira}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold">
                          <SelectValue placeholder="اختر دائرة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="bg-[#121212] border-white/10 text-white">
                          {(LOCATIONS as any)[wilaya].map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="h-14 rounded-2xl gap-3 font-black shadow-xl" onClick={handleSaveLocation}>
                      <Save className="w-5 h-5" />
                      تحديث الموقع الجغرافي
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16" dir="rtl">
            <StatCard icon={<Eye />} label="مشاهدات الملف" value="1,240" trend="+12%" color="blue" delay={0.1} />
            <StatCard icon={<MessageSquare />} label="رسائل جديدة" value="8" trend="+3" color="purple" delay={0.2} />
            <StatCard icon={<Star />} label="التقييم العام" value="4.8" trend="0.2" color="amber" delay={0.3} />
            <StatCard icon={<Clock />} label="أيام الاشتراك" value="∞" subtext="باقية" color="green" delay={0.4} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10" dir="rtl">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-10">
              {/* Portfolio Grid */}
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <CardHeader className="p-10 flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.01]">
                  <div>
                    <CardTitle className="text-3xl font-heading font-black flex items-center gap-4">
                      <ImageIcon className="w-8 h-8 text-primary" />
                      معرض الأعمال
                    </CardTitle>
                    <p className="text-muted-foreground text-base font-medium mt-2">اعرض مهاراتك من خلال أفضل صور أعمالك.</p>
                  </div>
                  <Button size="lg" className="rounded-2xl font-black px-8 hover:scale-105 transition-transform shadow-xl shadow-primary/20">إضافة عمل +</Button>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="aspect-square rounded-[2.5rem] bg-white/5 relative group overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-8 z-10">
                          <Button size="icon" variant="secondary" className="h-14 w-14 rounded-2xl shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                            <ImageIcon className="w-8 h-8" />
                          </Button>
                        </div>
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                          {i <= 3 ? (
                            <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=400`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" alt="" />
                          ) : (
                            <ImageIcon className="w-20 h-20 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                  <CardTitle className="text-3xl font-heading font-black flex items-center gap-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    الرسائل الواردة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    {[1, 2, 3].map((i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 * i }}
                        className="p-10 flex items-center gap-8 hover:bg-white/[0.03] transition-all cursor-pointer group relative"
                      >
                        <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner border border-primary/20">
                          {i === 1 ? 'س' : i === 2 ? 'م' : 'ع'}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-black text-2xl group-hover:text-primary transition-colors">
                              {i === 1 ? 'سامي كمال' : i === 2 ? 'مراد بن علي' : 'عمر فاروق'}
                            </h4>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">منذ {i * 15} دقيقة</span>
                          </div>
                          <p className="text-muted-foreground font-medium text-lg line-clamp-1 max-w-2xl leading-relaxed">أهلاً بك، هل يمكننا الاتفاق على موعد للعمل الأسبوع القادم؟ أحتاج لمعرفة...</p>
                        </div>
                        {i === 1 && <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)] animate-pulse" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Card className="bg-primary border-none shadow-[0_25px_50px_rgba(var(--primary-rgb),0.4)] rounded-[2.5rem] overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
                  <CardHeader className="p-10 pb-6 relative z-10">
                    <div className="flex items-center gap-4 text-white/80 font-black text-sm uppercase tracking-widest mb-4">
                      <BadgeCheck className="w-6 h-6 text-white" />
                      توثيق الحساب
                    </div>
                    <CardTitle className="text-4xl font-heading font-black text-white leading-[1.2]">حسابك مفعل وموثق بنجاح</CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 space-y-10 relative z-10">
                    <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                      <div className="flex justify-between items-end mb-6">
                        <div className="space-y-2">
                          <span className="text-xs font-black text-white/60 uppercase tracking-widest">نوع الاشتراك</span>
                          <div className="text-2xl font-black text-white italic">حرفي VIP (مجاني)</div>
                        </div>
                        <Badge className="bg-green-400 text-green-900 border-none px-4 py-1.5 rounded-xl font-black text-xs">نشط</Badge>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs font-black text-white/80 uppercase">
                          <span>اكتمال الملف الشخصي</span>
                          <span>100%</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, delay: 1 }}
                            className="h-full bg-white shadow-[0_0_30px_white]" 
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="secondary" className="w-full font-black h-20 rounded-[2rem] shadow-2xl hover:shadow-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-primary text-xl">إدارة الاشتراك</Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-2xl font-heading font-black flex items-center gap-4">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                      مركز النصائح
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="flex gap-6 items-start group">
                      <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-black text-white text-lg">جودة الصور</h5>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed opacity-80">استخدام إضاءة طبيعية في صور أعمالك يزيد من ثقة الزبائن بنسبة كبيرة.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 items-start group">
                      <div className="p-4 rounded-[1.5rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                        <Star className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-black text-white text-lg">التفاعل المستمر</h5>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed opacity-80">الرد على التعليقات والتقييمات يحسن من ظهورك في الصفحة الأولى.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, trend, subtext, color = "primary", delay = 0 }: any) {
  const colorClasses: any = {
    primary: "bg-primary/20 text-primary border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    green: "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
    >
      <Card className="overflow-hidden border-white/10 shadow-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl rounded-[3rem] transition-all duration-500 group ring-1 ring-white/10 hover:ring-primary/40 h-full">
        <CardContent className="p-8 md:p-10">
          <div className="flex items-start justify-between">
            <div className={`p-5 rounded-[2rem] border ${colorClasses[color]} group-hover:rotate-12 transition-all duration-500`}>
              {icon}
            </div>
            {trend && (
              <span className={`text-xs font-black px-4 py-2 rounded-full border ${trend.startsWith('+') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {trend}
              </span>
            )}
          </div>
          <div className="mt-10">
            <div className="text-5xl font-black font-heading tracking-tighter leading-none mb-4">{value}</div>
            <div className="text-xs font-black text-muted-foreground/60 flex items-center gap-3 mt-3 uppercase tracking-widest">
              {label}
              {subtext && <span className="text-primary/60 font-black">({subtext})</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
