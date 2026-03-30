import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, Star, Eye, Image as ImageIcon,
  Clock, MapPin, Save, BadgeCheck, Trash2, Upload, X, Phone, Mail, Briefcase, Banknote, Send, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS, DAIRAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function isImageContent(content: string) {
  return content?.startsWith("data:image") || content?.startsWith("http");
}

function formatTime(d: any) {
  try {
    return new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

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
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", String(artisan?.id)],
    queryFn: () => fetch(`/api/conversations/${artisan?.id}?role=artisan`).then(r => r.json()),
    enabled: !!artisan?.id,
    refetchInterval: 5000,
  });

  const { data: convMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", selectedConv?.id, "messages"],
    queryFn: () => fetch(`/api/conversations/${selectedConv?.id}/messages`).then(r => r.json()),
    enabled: !!selectedConv?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [convMessages]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => fetch(`/api/artisans/${artisan?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artisans", artisan?.id] });
      if (artisan) loginArtisan({ ...artisan, ...data });
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
  });

  const sendReplyMutation = useMutation({
    mutationFn: (content: string) => fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedConv?.id,
        senderId: String(artisan?.id),
        receiverId: selectedConv?.customerId,
        senderType: "artisan",
        content,
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConv?.id, "messages"] });
      setReplyText("");
    },
  });

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendReplyMutation.mutate(replyText);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      const currentPortfolio = serverArtisan?.portfolioImages || portfolioImages;
      const newPortfolio = [imageUrl, ...currentPortfolio.slice(0, 4)];
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

  if (!isLoggedIn || !isArtisan) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <h2 className="text-3xl font-heading font-bold">{isRtl ? "يجب تسجيل الدخول أولاً" : "Please login first"}</h2>
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
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={realArtisan?.imageUrl || `https://ui-avatars.com/api/?name=${artisan?.name}&background=2DD4BF&color=fff&size=200`}
                  alt={artisan?.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                  <Upload className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-heading font-black">{realArtisan?.name || artisan?.name}</h1>
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-zinc-400 text-sm">{realArtisan?.category || artisan?.category} • {realArtisan?.daira || artisan?.daira}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">نشط</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">مجاني للأبد ∞</Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Eye />} label={isRtl ? "مشاهدات" : "Views"} value="–" color="blue" />
              <StatCard icon={<MessageSquare />} label={isRtl ? "محادثات" : "Chats"} value={String(conversations.length)} color="purple" />
              <StatCard icon={<Star />} label={isRtl ? "التقييم" : "Rating"} value={String(realArtisan?.rating || "0")} color="amber" />
              <StatCard icon={<Clock />} label={isRtl ? "الاشتراك" : "Plan"} value="∞" color="green" />
            </div>

            {/* Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem icon={<Mail />} label={isRtl ? "البريد الإلكتروني" : "Email"} value={realArtisan?.email || artisan?.email || "–"} />
              <InfoItem icon={<Phone />} label={isRtl ? "الهاتف" : "Phone"} value={realArtisan?.phone || artisan?.phone || "–"} />
              <InfoItem icon={<Banknote />} label={isRtl ? "السعر الأدنى" : "Min Price"} value={`${realArtisan?.priceStart || "–"} دج`} />
              <InfoItem icon={<Briefcase />} label={isRtl ? "سنوات الخبرة" : "Experience"} value={`${realArtisan?.yearsOfExperience || "–"} ${isRtl ? "سنوات" : "years"}`} />
              <InfoItem icon={<MapPin />} label={isRtl ? "الموقع" : "Location"} value={`${realArtisan?.wilaya || ""} - ${realArtisan?.daira || artisan?.daira || "–"}`} />
              <InfoItem icon={<BadgeCheck />} label={isRtl ? "المهنة" : "Category"} value={realArtisan?.category || artisan?.category || "–"} />
            </div>

            {/* Conversations with inline chat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Conversation List */}
              <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-black">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {isRtl ? "المحادثات" : "Conversations"}
                    {conversations.length > 0 && (
                      <Badge className="bg-primary text-white text-xs">{conversations.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>{isRtl ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
                      <p className="text-xs mt-1 opacity-60">{isRtl ? "ستظهر هنا رسائل الزبائن" : "Customer messages will appear here"}</p>
                    </div>
                  ) : (
                    conversations.map((conv: any) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(selectedConv?.id === conv.id ? null : conv)}
                        className={`w-full p-4 flex items-center gap-4 border-b border-white/5 transition-all text-right ${selectedConv?.id === conv.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-white/5'}`}
                      >
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary font-black text-lg">
                            {conv.customerId?.replace("customer-", "").slice(0, 1).toUpperCase() || "؟"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">زبون #{conv.customerId?.slice(-6)}</p>
                          {conv.lastMessage && (
                            <p className={`text-xs truncate mt-0.5 ${isImageContent(conv.lastMessage) ? 'text-primary/60' : 'text-zinc-400'}`}>
                              {isImageContent(conv.lastMessage) ? "📷 صورة" : conv.lastMessage}
                            </p>
                          )}
                        </div>
                        <ArrowRight className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${selectedConv?.id === conv.id ? 'rotate-90' : ''}`} />
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Inline Chat Panel */}
              <AnimatePresence>
                {selectedConv && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="bg-white/[0.03] border-white/10 rounded-3xl overflow-hidden flex flex-col h-[480px]">
                      <CardHeader className="p-4 border-b border-white/10 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/20 text-primary font-black text-sm">
                              {selectedConv.customerId?.slice(-1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm">زبون #{selectedConv.customerId?.slice(-6)}</p>
                            <p className="text-xs text-green-400">متصل</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-zinc-400" onClick={() => setSelectedConv(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </CardHeader>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={chatScrollRef}>
                        {convMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">لا توجد رسائل</div>
                        ) : (
                          convMessages.map((msg: any) => {
                            const isMe = msg.senderType === "artisan";
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                                  isMe
                                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm'
                                    : 'bg-white/10 text-white rounded-bl-sm'
                                }`}>
                                  {isImageContent(msg.content) ? (
                                    <img src={msg.content} alt="" className="max-w-full rounded-xl max-h-40 object-cover" />
                                  ) : (
                                    <p>{msg.content}</p>
                                  )}
                                  <span className="text-[10px] opacity-60 mt-0.5 block">{formatTime(msg.createdAt)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Reply Input */}
                      <div className="p-3 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 border border-white/10">
                          <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-zinc-500"
                            placeholder={isRtl ? "اكتب ردك..." : "Type your reply..."}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSendReply()}
                          />
                          <button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || sendReplyMutation.isPending}
                            className="p-1.5 bg-primary rounded-full text-white disabled:opacity-40 transition-all hover:bg-primary/80 active:scale-95"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-black">{isRtl ? "معرض أعمالك" : "Your Portfolio"}</h2>
                <p className="text-zinc-400 text-sm mt-1">{displayPortfolio.length} {isRtl ? "صورة" : "photos"}</p>
              </div>
              <label className="cursor-pointer">
                <Button className="gap-2 rounded-2xl font-black">
                  <Upload className="h-4 w-4" />
                  {isRtl ? "إضافة صورة" : "Add Photo"}
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
              </label>
            </div>

            {displayPortfolio.length === 0 ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl py-20 text-zinc-500 cursor-pointer hover:border-primary/30 hover:text-zinc-300 transition-all">
                <ImageIcon className="h-14 w-14 mb-4 opacity-20" />
                <p className="font-bold text-lg">{isRtl ? "أضف أول صورة لأعمالك" : "Add your first work photo"}</p>
                <p className="text-sm opacity-60 mt-2">{isRtl ? "صورة ملفك الشخصي تُضاف تلقائياً" : "Your profile photo is auto-added"}</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
              </label>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayPortfolio.map((img: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-square rounded-2xl overflow-hidden relative group border border-white/10 cursor-pointer"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {i === 0 && (
                        <span className="text-xs font-bold text-white bg-primary/80 px-2 py-1 rounded-full">{isRtl ? "الصورة الرئيسية" : "Main Photo"}</span>
                      )}
                      <button
                        className="h-9 w-9 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        onClick={() => handleRemovePortfolioPhoto(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {/* Add more button */}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors text-zinc-500 hover:text-zinc-300">
                  <Upload className="h-6 w-6 mb-2" />
                  <span className="text-xs font-bold">{isRtl ? "إضافة" : "Add"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto} />
                </label>
              </div>
            )}
            <p className="text-zinc-600 text-xs">
              {isRtl
                ? "الصورة الأولى تظهر كصورتك الرئيسية في ملفك الشخصي وبطاقتك في قائمة الحرفيين"
                : "The first photo appears as your main photo in your profile and artisan card"}
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
                <Button onClick={() => updateMutation.mutate({ wilaya, daira })} className="gap-2 rounded-xl font-black" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ الموقع" : "Save Location")}
                </Button>
              </CardContent>
            </Card>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-black text-red-400 mb-4">{isRtl ? "منطقة الخطر" : "Danger Zone"}</h3>
              <Button
                variant="destructive"
                className="gap-2 rounded-xl"
                onClick={() => { if (confirm(isRtl ? "هل أنت متأكد من حذف حسابك نهائياً؟" : "Delete your account permanently?")) deleteMutation.mutate(); }}
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
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${colorMap[color]}`}>
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
      <div className="min-w-0">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-white truncate text-sm">{value}</p>
      </div>
    </div>
  );
}
