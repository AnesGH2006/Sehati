import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, MessageSquare, Star, Eye, Settings, Image as ImageIcon,
  TrendingUp, Clock, MapPin, Save, BadgeCheck, LogOut, Trash2, Upload, X, Phone, Mail, Briefcase, Banknote
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS, DAIRAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function ArtisanDashboard() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { artisan, isArtisan, isLoggedIn, logout, loginArtisan } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isRtl = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<"overview" | "portfolio" | "settings">("overview");
  const [wilaya, setWilaya] = useState(artisan?.wilaya || "الجزائر");
  const [daira, setDaira] = useState(artisan?.daira || "");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real artisan data from server
  const { data: serverArtisan, refetch } = useQuery<any>({
    queryKey: ["/api/artisans", artisan?.id],
    queryFn: async () => {
      const data = await fetch(`/api/artisans/${artisan?.id}`).then(r => r.json());
      if (data?.portfolioImages) setPortfolioImages(data.portfolioImages || []);
      return data;
    },
    enabled: !!artisan?.id,
  });

  const realArtisan = serverArtisan || artisan;

  // Fetch conversations for this artisan
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations", String(artisan?.id)],
    queryFn: () => fetch(`/api/conversations/${artisan?.id}?role=artisan`).then(r => r.json()),
    enabled: !!artisan?.id,
    refetchInterval: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: any) => fetch(`/api/artisans/${artisan?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] });
      if (artisan) {
        loginArtisan({ ...artisan, ...data });
      }
      toast({ title: isRtl ? "تم الحفظ ✓" : "Saved ✓" });
      refetch();
    },
    onError: () => toast({ title: isRtl ? "فشل الحفظ" : "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/artisans/${artisan?.id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      logout();
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      toast({ title: isRtl ? "تم حذف الحساب" : "Account Deleted" });
      setLocation("/");
    },
    onError: () => toast({ title: isRtl ? "فشل الحذف" : "Delete failed", variant: "destructive" }),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      // Update profile photo AND add to portfolio
      const newPortfolio = [imageUrl, ...(serverArtisan?.portfolioImages || portfolioImages).slice(0, 4)];
      updateMutation.mutate({ imageUrl, portfolioImages: newPortfolio });
      setPortfolioImages(newPortfolio);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPortfolioPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      const currentPortfolio = serverArtisan?.portfolioImages || portfolioImages;
      const newPortfolio = [...currentPortfolio, imageUrl];
      updateMutation.mutate({ portfolioImages: newPortfolio });
      setPortfolioImages(newPortfolio);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePortfolioPhoto = (index: number) => {
    const currentPortfolio = serverArtisan?.portfolioImages || portfolioImages;
    const newPortfolio = currentPortfolio.filter((_: any, i: number) => i !== index);
    updateMutation.mutate({ portfolioImages: newPortfolio });
    setPortfolioImages(newPortfolio);
  };

  const handleSaveLocation = () => {
    updateMutation.mutate({ wilaya, daira });
  };

  if (!isLoggedIn || !isArtisan) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-heading font-bold">{isRtl ? "يجب تسجيل الدخول أولاً" : "Please login first"}</h2>
            <p className="text-muted-foreground">{isRtl ? "سجّل كحرفي للوصول إلى لوحة التحكم" : "Register as artisan to access dashboard"}</p>
            <Button onClick={() => setLocation("/subscription")} className="bg-primary">
              {isRtl ? "انضم كحرفي" : "Join as Artisan"}
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const displayPortfolio: string[] = serverArtisan?.portfolioImages?.length > 0
    ? serverArtisan.portfolioImages
    : portfolioImages;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans">
      <Navbar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-10 relative z-10" dir="rtl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <img
                  src={realArtisan?.imageUrl || `https://ui-avatars.com/api/?name=${artisan?.name}&background=2DD4BF&color=fff&size=200`}
                  alt={artisan?.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-primary/30"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                  <Upload className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-heading font-black">{realArtisan?.name || artisan?.name}</h1>
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-zinc-400 font-medium">{realArtisan?.category || artisan?.category} • {realArtisan?.daira || artisan?.daira}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">نشط</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">{isRtl ? "مجاني للأبد" : "Free Forever"}</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 rounded-xl opacity-60 hover:opacity-100"
              onClick={() => { if (confirm(isRtl ? "هل تريد حذف حسابك؟" : "Delete your account?")) deleteMutation.mutate(); }}
            >
              <Trash2 className="h-4 w-4" />
              {isRtl ? "حذف الحساب" : "Delete Account"}
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {[
            { key: "overview", label: isRtl ? "نظرة عامة" : "Overview" },
            { key: "portfolio", label: isRtl ? "معرض الأعمال" : "Portfolio" },
            { key: "settings", label: isRtl ? "الإعدادات" : "Settings" },
          ].map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              className="rounded-2xl font-black border-white/10"
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Eye />} label={isRtl ? "مشاهدات" : "Views"} value="–" color="blue" />
              <StatCard icon={<MessageSquare />} label={isRtl ? "محادثات" : "Chats"} value={String(conversations.length)} color="purple" />
              <StatCard icon={<Star />} label={isRtl ? "التقييم" : "Rating"} value={String(realArtisan?.rating || "0")} color="amber" />
              <StatCard icon={<Clock />} label={isRtl ? "الاشتراك" : "Plan"} value="∞" color="green" />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem icon={<Mail />} label={isRtl ? "البريد الإلكتروني" : "Email"} value={realArtisan?.email || artisan?.email || "–"} />
              <InfoItem icon={<Phone />} label={isRtl ? "الهاتف" : "Phone"} value={realArtisan?.phone || artisan?.phone || "–"} />
              <InfoItem icon={<Banknote />} label={isRtl ? "السعر الأدنى" : "Min Price"} value={`${realArtisan?.priceStart || "–"} دج`} />
              <InfoItem icon={<Briefcase />} label={isRtl ? "سنوات الخبرة" : "Experience"} value={`${realArtisan?.yearsOfExperience || "–"} ${isRtl ? "سنوات" : "years"}`} />
              <InfoItem icon={<MapPin />} label={isRtl ? "الموقع" : "Location"} value={`${realArtisan?.wilaya || ""} - ${realArtisan?.daira || artisan?.daira || "–"}`} />
              <InfoItem icon={<BadgeCheck />} label={isRtl ? "المهنة" : "Category"} value={realArtisan?.category || artisan?.category || "–"} />
            </div>

            {/* Conversations */}
            <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="p-6 border-b border-white/10">
                <CardTitle className="flex items-center gap-3 text-xl font-heading font-black">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {isRtl ? "المحادثات الأخيرة" : "Recent Conversations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">{isRtl ? "لا توجد محادثات بعد" : "No conversations yet"}</div>
                ) : (
                  conversations.slice(0, 5).map((conv: any) => (
                    <div key={conv.id} className="p-5 flex items-center gap-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setLocation("/chat")}>
                      <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
                        {conv.customerId?.slice(0, 1).toUpperCase() || "؟"}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{isRtl ? "زبون" : "Customer"} #{conv.customerId?.slice(0, 8)}</p>
                        {conv.lastMessage && <p className="text-zinc-400 text-sm truncate">{conv.lastMessage}</p>}
                      </div>
                      <Badge variant="outline" className="border-white/20 text-xs">{isRtl ? "رد" : "Reply"}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black">{isRtl ? "معرض أعمالك" : "Your Portfolio"}</h2>
              <label className="cursor-pointer">
                <Button className="gap-2 rounded-2xl font-black" onClick={() => {}}>
                  <Upload className="h-4 w-4" />
                  {isRtl ? "إضافة صورة" : "Add Photo"}
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayPortfolio.length === 0 ? (
                <label className="col-span-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl text-zinc-500 cursor-pointer hover:border-primary/30 transition-colors">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-bold">{isRtl ? "اضغط لإضافة صور أعمالك" : "Click to add portfolio photos"}</p>
                  <p className="text-sm opacity-60">{isRtl ? "صورة ملفك الشخصي تُضاف تلقائياً" : "Your profile photo is added automatically"}</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
                </label>
              ) : (
                displayPortfolio.map((img: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-square rounded-2xl overflow-hidden relative group border border-white/10"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-full h-10 w-10"
                        onClick={() => handleRemovePortfolioPhoto(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            <p className="text-zinc-500 text-sm">
              {isRtl
                ? "عند تغيير صورة ملفك الشخصي، تُضاف تلقائياً في أول معرض الأعمال"
                : "When you change your profile photo, it's automatically added to the top of your portfolio"}
            </p>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-heading font-black">{isRtl ? "تعديل الموقع" : "Edit Location"}</h2>
            <Card className="bg-white/[0.03] border-white/10 rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">{isRtl ? "الولاية" : "Wilaya"}</Label>
                    <Select value={wilaya} onValueChange={v => { setWilaya(v); setDaira((LOCATIONS as any)[v]?.[0] || ""); }} dir={isRtl ? "rtl" : "ltr"}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                        <SelectValue placeholder={isRtl ? "اختر ولاية" : "Select wilaya"} />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                        {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">{isRtl ? "الدائرة" : "Daira"}</Label>
                    <Select value={daira} onValueChange={setDaira} disabled={!wilaya} dir={isRtl ? "rtl" : "ltr"}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                        <SelectValue placeholder={isRtl ? "اختر دائرة" : "Select daira"} />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-zinc-900 border-white/10 text-white">
                        {wilaya && (LOCATIONS as any)[wilaya]?.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveLocation} className="gap-2 rounded-xl font-black" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ الموقع" : "Save Location")}
                </Button>
              </CardContent>
            </Card>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-black text-red-400 mb-4">{isRtl ? "منطقة الخطر" : "Danger Zone"}</h3>
              <Button
                variant="destructive"
                className="gap-2 rounded-xl"
                onClick={() => { if (confirm(isRtl ? "هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع." : "Are you sure? This cannot be undone.")) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {isRtl ? "حذف حسابي نهائياً" : "Delete My Account"}
              </Button>
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
        <CardContent className="p-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${colorMap[color]}`}>
            {icon}
          </div>
          <div className="text-3xl font-black font-heading">{value}</div>
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mt-1">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
      <div className="text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
