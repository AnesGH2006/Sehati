import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen flex flex-col bg-background/95 font-sans selection:bg-primary/30">
      <Navbar />
      
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.05),transparent_50%)] pointer-events-none" />
      
      <main className="flex-1 container px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4" dir="rtl">
          <div>
            <h1 className="text-4xl font-heading font-black tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              لوحة التحكم
            </h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground font-bold">
              <MapPin className="w-4 h-4 text-primary" />
              <span>موقعك الحالي: {wilaya}، {daira}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none gap-2" onClick={() => setIsEditingLocation(!isEditingLocation)}>
              <MapPin className="w-4 h-4" />
              تغيير الموقع
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none gap-2">
              <Settings className="w-4 h-4" />
              تعديل الملف
            </Button>
          </div>
        </div>

        {isEditingLocation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-8"
            dir="rtl"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <Label className="font-bold">الولاية</Label>
                    <Select value={wilaya} onValueChange={(val) => { setWilaya(val); setDaira((LOCATIONS as any)[val][0]); }}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="اختر ولاية" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">الدائرة</Label>
                    <Select value={daira} onValueChange={setDaira}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="اختر دائرة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {(LOCATIONS as any)[wilaya].map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="gap-2 font-bold" onClick={handleSaveLocation}>
                    <Save className="w-4 h-4" />
                    حفظ الموقع الجديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" dir="rtl">
          <StatCard icon={<Eye className="w-5 h-5" />} label="مشاهدات الملف" value="1,240" trend="+12%" color="blue" />
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="رسائل جديدة" value="8" trend="+3" color="purple" />
          <StatCard icon={<Star className="w-5 h-5" />} label="التقييم العام" value="4.8" trend="0.2" color="amber" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="أيام الاشتراك" value="∞" subtext="باقية" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" dir="rtl">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10">
                <CardTitle className="text-xl font-heading font-black flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  معرض الأعمال (Portfolio)
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary font-black hover:bg-primary/10 rounded-xl">إضافة عمل جديد +</Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-3xl bg-muted/30 relative group overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                        <Button size="icon" variant="secondary" className="h-10 w-10 rounded-2xl shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-border/10">
                <CardTitle className="text-xl font-heading font-black flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  أحدث الرسائل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 flex items-center gap-4 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        ز
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-black text-lg group-hover:text-primary transition-colors">زبون مهتم #{i}</h4>
                          <span className="text-xs font-bold text-muted-foreground/60 bg-muted/50 px-2 py-1 rounded-lg">منذ ساعتين</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80 line-clamp-1">هل أنت متاح للعمل يوم الغد؟ أحتاج مساعدة في...</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-colors duration-500" />
              <CardHeader>
                <CardTitle className="text-2xl font-heading font-black flex items-center gap-2">
                  <BadgeCheck className="w-6 h-6" />
                  حالة العضوية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="font-bold opacity-90">نوع الحساب</span>
                  <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-xl font-black">حرفي حر (مجاني)</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black mb-1">
                    <span>نسبة اكتمال الملف</span>
                    <span>100%</span>
                  </div>
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                    />
                  </div>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-sm font-bold leading-relaxed">عضويتك مفعلة مدى الحياة مجاناً. استمتع بكافة المميزات الحالية!</p>
                </div>
                <Button variant="secondary" className="w-full font-black h-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-primary">تطوير الحساب (قريباً)</Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-border/10">
                <CardTitle className="text-xl font-heading font-black flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  تلميحات للنمو
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex gap-4 items-start group hover:bg-green-500/10 transition-colors">
                  <div className="p-2 rounded-xl bg-green-500/20 text-green-600 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold leading-relaxed">إضافة 5 صور جديدة لمعرض أعمالك يزيد من نسبة تواصل الزبائن بـ 30%.</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4 items-start group hover:bg-blue-500/10 transition-colors">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold leading-relaxed">الرد السريع على رسائل الزبائن يحسن ترتيبك في نتائج البحث.</p>
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
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    amber: "bg-amber-500/10 text-amber-600",
    green: "bg-green-500/10 text-green-600",
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-xl hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <div className="text-3xl font-black font-heading tracking-tight">{value}</div>
          <div className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-1 opacity-80">
            {label}
            {subtext && <span className="opacity-70">({subtext})</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
