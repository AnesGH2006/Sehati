import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Shield, LogOut, Eye, EyeOff, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_STORAGE_KEY = "herfati_admin_session";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthed, setIsAuthed] = useState(() => {
    try { return !!localStorage.getItem(ADMIN_STORAGE_KEY); } catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"artisans" | "chats" | "reviews">("artisans");

  useEffect(() => {
    if (isAuthed) {
      fetch("/api/admin/check")
        .then(r => r.json())
        .then(d => {
          if (!d.isAdmin) {
            setIsAuthed(false);
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        });
    }
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthed(true);
        localStorage.setItem(ADMIN_STORAGE_KEY, "1");
        toast({ title: "مرحباً بك يا أدمن 👋" });
      } else {
        toast({ title: "كلمة المرور غير صحيحة", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAuthed(false);
  };

  const { data: artisans = [] } = useQuery({
    queryKey: ["/api/artisans"],
    queryFn: () => fetch("/api/artisans").then(r => r.json()),
    enabled: isAuthed,
    refetchInterval: 5000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/admin/conversations"],
    queryFn: () => fetch("/api/admin/conversations").then(r => r.json()),
    enabled: isAuthed,
    refetchInterval: 5000,
  });

  // Fetch all reviews across all artisans
  const { data: allReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const artisanList = await fetch("/api/artisans").then(r => r.json());
      const reviewArrays = await Promise.all(
        artisanList.map((a: any) =>
          fetch(`/api/artisans/${a.id}/reviews`)
            .then(r => r.ok ? r.json() : [])
            .then((reviews: any[]) => reviews.map(rv => ({ ...rv, artisanName: a.name })))
            .catch(() => [])
        )
      );
      return reviewArrays.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: isAuthed && activeTab === "reviews",
    refetchInterval: 10000,
  });

  const deleteArtisanMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/artisans/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artisans"] });
      toast({ title: "تم حذف الحرفي بنجاح" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/reviews/${id}`, { method: "DELETE" }).then(r => {
        if (!r.ok) throw new Error("فشل الحذف");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "✅ تم حذف التقييم" });
    },
    onError: () => toast({ title: "فشل حذف التقييم", variant: "destructive" }),
  });

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-10 bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-black text-white">لوحة الادارة</h1>
            <p className="text-zinc-400 text-sm">أدخل كلمة المرور للوصول</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-zinc-500 text-center text-xl pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loginLoading || !password}
              className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90"
            >
              {loginLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-heading font-black text-xl">لوحة الأدمن - حرفتي</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-sm font-bold">
            <span className="text-zinc-400">{artisans.length} <span className="text-white">حرفي</span></span>
            <span className="text-zinc-400">{conversations.length} <span className="text-white">محادثة</span></span>
            <span className="text-zinc-400">{allReviews.length} <span className="text-white">تقييم</span></span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-zinc-400 hover:text-white">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant={activeTab === "artisans" ? "default" : "outline"}
            onClick={() => setActiveTab("artisans")}
            className="gap-2 rounded-2xl font-black"
          >
            <Users className="h-4 w-4" />
            الحرفيون ({artisans.length})
          </Button>
          <Button
            variant={activeTab === "chats" ? "default" : "outline"}
            onClick={() => setActiveTab("chats")}
            className="gap-2 rounded-2xl font-black"
          >
            <MessageSquare className="h-4 w-4" />
            المحادثات ({conversations.length})
          </Button>
          <Button
            variant={activeTab === "reviews" ? "default" : "outline"}
            onClick={() => setActiveTab("reviews")}
            className="gap-2 rounded-2xl font-black"
          >
            <Star className="h-4 w-4" />
            التقييمات ({allReviews.length})
          </Button>
        </div>

        {/* Artisans Tab */}
        {activeTab === "artisans" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {artisans.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">لا يوجد حرفيون مسجلون</div>
            ) : (
              artisans.map((artisan: any) => (
                <motion.div
                  key={artisan.id} layout
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors"
                >
                  <img
                    src={artisan.imageUrl || `https://ui-avatars.com/api/?name=${artisan.name}&background=2DD4BF&color=fff`}
                    alt={artisan.name} className="w-14 h-14 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{artisan.name}</h3>
                      <Badge variant="secondary" className="text-xs">{artisan.category}</Badge>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{artisan.subscriptionType}</Badge>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">{artisan.email} • {artisan.phone}</p>
                    <p className="text-zinc-500 text-xs">{artisan.wilaya} - {artisan.daira} • {artisan.priceStart} دج</p>
                  </div>
                  <Button
                    size="sm" variant="destructive" className="gap-2 rounded-xl shrink-0"
                    onClick={() => { if (confirm(`هل تريد حذف الحرفي "${artisan.name}"؟`)) deleteArtisanMutation.mutate(artisan.id); }}
                    disabled={deleteArtisanMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {conversations.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">لا توجد محادثات</div>
            ) : (
              conversations.map((conv: any) => (
                <ConversationItem
                  key={conv.id} conversation={conv}
                  isExpanded={expandedConv === conv.id}
                  onToggle={() => setExpandedConv(expandedConv === conv.id ? null : conv.id)}
                />
              ))
            )}
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl animate-pulse border border-white/10" />)}
              </div>
            ) : allReviews.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>لا توجد تقييمات بعد</p>
              </div>
            ) : (
              <AnimatePresence>
                {allReviews.map((review: any) => (
                  <motion.div
                    key={review.id} layout
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex items-start gap-4 p-5 bg-zinc-900 rounded-2xl border border-white/10 hover:border-red-500/20 transition-colors"
                  >
                    {/* Customer Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg shrink-0">
                      {review.customerName?.[0] || "؟"}
                    </div>

                    {/* Review Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{review.customerName}</span>
                        <span className="text-zinc-500 text-xs">←</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          {review.artisanName}
                        </Badge>
                        <span className="text-zinc-600 text-xs mr-auto">
                          {new Date(review.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-0.5 mt-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                        ))}
                        <span className="text-xs text-zinc-400 mr-1 self-center">
                          {['','ضعيف','مقبول','جيد','جيد جداً','ممتاز'][review.rating]}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">"{review.comment}"</p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <Button
                      size="sm" variant="destructive"
                      className="gap-1.5 rounded-xl shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm(`هل تريد حذف تقييم "${review.customerName}"؟`))
                          deleteReviewMutation.mutate(review.id);
                      }}
                      disabled={deleteReviewMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isExpanded, onToggle }: { conversation: any; isExpanded: boolean; onToggle: () => void }) {
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/admin/conversations", conversation.id, "messages"],
    queryFn: () => fetch(`/api/admin/conversations/${conversation.id}/messages`).then(r => r.json()),
    enabled: isExpanded,
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-right"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold">محادثة #{conversation.id.slice(0, 8)}</p>
            <p className="text-zinc-400 text-sm">
              حرفي: {conversation.artisanId} • زبون: {conversation.customerId?.slice(0, 12)}...
            </p>
            {conversation.lastMessage && (
              <p className="text-zinc-500 text-xs mt-1 truncate max-w-xs">"{conversation.lastMessage}"</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs border-white/20">{messages.length} رسائل</Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">لا توجد رسائل</p>
              ) : (
                messages.map((msg: any) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.senderType === 'artisan' ? 'flex-row-reverse' : ''}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderType === 'artisan'
                        ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}>
                      <p className="text-[10px] font-black opacity-60 mb-1">
                        {msg.senderType === 'artisan' ? '🔨 حرفي' : '👤 زبون'}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}