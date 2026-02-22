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
  BadgeCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LOCATIONS, DAIRAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

export default function ArtisanDashboard() {
  const { toast } = useToast();
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [wilaya, setWilaya] = useState("الجزائر");
  const [daira, setDaira] = useState("Algiers");

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
      
      <main className="flex-1 container max-w-7xl px-6 py-16 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8 border-b border-white/5 pb-12" 
          dir="rtl"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              لوحة التحكم الاحترافية
            </div>
            <h1 className="text-6xl font-heading font-black tracking-tighter bg-gradient-to-l from-white via-white to-white/40 bg-clip-text text-transparent">
              أهلاً بك، <span className="text-primary italic">يا فنان</span>
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

        {/* Stats Grid - More Refined */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16" dir="rtl">
          <StatCard icon={<Eye />} label="مشاهدات الملف" value="1,240" trend="+12%" color="blue" />
          <StatCard icon={<MessageSquare />} label="رسائل جديدة" value="8" trend="+3" color="purple" />
          <StatCard icon={<Star />} label="التقييم العام" value="4.8" trend="0.2" color="amber" />
          <StatCard icon={<Clock />} label="أيام الاشتراك" value="∞" subtext="باقية" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" dir="rtl">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Portfolio Grid */}
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.01]">
                <div>
                  <CardTitle className="text-2xl font-heading font-black flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    معرض الأعمال
                  </CardTitle>
                  <p className="text-muted-foreground text-sm font-medium mt-1">اعرض مهاراتك من خلال أفضل صور أعمالك.</p>
                </div>
                <Button className="rounded-2xl font-black px-6 hover:scale-105 transition-transform">إضافة عمل +</Button>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square rounded-[2rem] bg-white/5 relative group overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6 z-10">
                        <Button size="icon" variant="secondary" className="h-12 w-12 rounded-2xl shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                          <ImageIcon className="w-6 h-6" />
                        </Button>
                      </div>
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                        {i <= 3 ? (
                          <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=400`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                        ) : (
                          <ImageIcon className="w-16 h-16 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages - More Compact and Structured */}
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-2xl font-heading font-black flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  الرسائل الواردة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-8 flex items-center gap-6 hover:bg-white/[0.03] transition-all cursor-pointer group relative">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner border border-primary/20">
                        {i === 1 ? 'س' : i === 2 ? 'م' : 'ع'}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-black text-xl group-hover:text-primary transition-colors">
                            {i === 1 ? 'سامي كمال' : i === 2 ? 'مراد بن علي' : 'عمر فاروق'}
                          </h4>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">منذ {i * 15} دقيقة</span>
                        </div>
                        <p className="text-muted-foreground font-medium text-sm line-clamp-1 max-w-md">أهلاً بك، هل يمكننا الاتفاق على موعد للعمل الأسبوع القادم؟ أحتاج لمعرفة...</p>
                      </div>
                      {i === 1 && <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] animate-pulse" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Integrated Look */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-primary border-none shadow-[0_25px_50px_rgba(var(--primary-rgb),0.4)] rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
              <CardHeader className="p-8 pb-4 relative z-10">
                <div className="flex items-center gap-3 text-white/80 font-black text-xs uppercase tracking-widest mb-2">
                  <BadgeCheck className="w-5 h-5 text-white" />
                  توثيق الحساب
                </div>
                <CardTitle className="text-3xl font-heading font-black text-white leading-tight">حسابك مفعل وموثق بنجاح</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8 relative z-10">
                <div className="p-5 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-xl">
                  <div className="flex justify-between items-end mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">نوع الاشتراك</span>
                      <div className="text-xl font-black text-white italic">حرفي VIP (مجاني)</div>
                    </div>
                    <Badge className="bg-green-400 text-green-900 border-none px-3 py-1 rounded-lg font-black text-[10px]">نشط</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-white/80 uppercase">
                      <span>اكتمال الملف الشخصي</span>
                      <span>100%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="h-full bg-white shadow-[0_0_20px_white]" 
                      />
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full font-black h-16 rounded-[1.5rem] shadow-2xl hover:shadow-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-primary text-lg">إدارة الاشتراك</Button>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xl font-heading font-black flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  مركز النصائح
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-4 items-start group">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-white text-sm">جودة الصور</h5>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">استخدام إضاءة طبيعية في صور أعمالك يزيد من ثقة الزبائن بنسبة كبيرة.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start group">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-white text-sm">التفاعل المستمر</h5>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">الرد على التعليقات والتقييمات يحسن من ظهورك في الصفحة الأولى.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, trend, subtext, color = "primary" }: any) {
  const colorClasses: any = {
    primary: "bg-primary/20 text-primary border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    green: "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden border-white/10 shadow-2xl bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl rounded-[2.5rem] transition-all duration-500 group ring-1 ring-white/10 hover:ring-primary/40 h-full">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div className={`p-4 rounded-[1.5rem] border ${colorClasses[color]} group-hover:rotate-12 transition-all duration-500`}>
              {icon}
            </div>
            {trend && (
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${trend.startsWith('+') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {trend}
              </span>
            )}
          </div>
          <div className="mt-8">
            <div className="text-4xl font-black font-heading tracking-tighter leading-none">{value}</div>
            <div className="text-xs font-black text-muted-foreground/60 flex items-center gap-2 mt-3 uppercase tracking-widest">
              {label}
              {subtext && <span className="text-primary/60 font-black">({subtext})</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
