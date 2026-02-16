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
  Save
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
    <div className="min-h-screen flex flex-col bg-muted/30 font-sans">
      <Navbar />
      
      <main className="flex-1 container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4" dir="rtl">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              لوحة التحكم
            </h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
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
          <StatCard icon={<Eye className="w-5 h-5" />} label="مشاهدات الملف" value="1,240" trend="+12%" />
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="رسائل جديدة" value="8" trend="+3" />
          <StatCard icon={<Star className="w-5 h-5" />} label="التقييم العام" value="4.8" trend="0.2" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="أيام الاشتراك" value="12" subtext="باقية" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" dir="rtl">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">معرض الأعمال (Portfolio)</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary font-bold">إضافة عمل جديد</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-muted relative group overflow-hidden border">
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <Button size="icon" variant="secondary" className="h-8 w-8"><ImageIcon className="w-4 h-4" /></Button>
                      </div>
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">أحدث الرسائل</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        ز
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-sm">زبون مهتم #{i}</h4>
                          <span className="text-xs text-muted-foreground">منذ ساعتين</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">هل أنت متاح للعمل يوم الغد؟ أحتاج...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle className="text-lg font-heading">حالة العضوية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>نوع الحساب</span>
                  <span className="font-bold">حرفي حر (مجاني)</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-full" />
                </div>
                <p className="text-xs opacity-80">عضويتك مفعلة مدى الحياة مجاناً</p>
                <Button variant="secondary" className="w-full font-bold">تطوير الحساب (قريباً)</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">تلميحات للنمو</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-1"><TrendingUp className="w-5 h-5 text-green-500" /></div>
                  <p className="text-sm">إضافة 5 صور جديدة لمعرض أعمالك يزيد من نسبة تواصل الزبائن بـ 30%.</p>
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

function StatCard({ icon, label, value, trend, subtext }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {trend && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold font-heading">{value}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {label}
            {subtext && <span className="opacity-70">({subtext})</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
