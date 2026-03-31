import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_ARTISANS } from "@/lib/constants";
import { Send, Image as ImageIcon, Smile, X, ArrowRight, Phone, Video, Info, Heart, Star } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const EMOJI_LIST = ["😊","😂","❤️","😍","🥰","👍","🙏","🔥","✨","💯","😎","🤝","👋","🎉","💪","🤔","😭","😤","🥺","💬"];

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
}

function getConversationId(artisanId: number, customerId: string) {
  return `conv-${artisanId}-${customerId}`;
}

function isImageUrl(content: string) {
  return content?.startsWith("data:image") || content?.startsWith("/uploads/") || content?.startsWith("http");
}

// Star Rating Component
function StarRating({ value, onChange, size = 32 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
          className="transition-transform hover:scale-110"
          style={{ cursor: onChange ? "pointer" : "default" }}
        >
          <Star
            style={{ width: size, height: size }}
            className={`transition-colors ${(hovered || value) >= star ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Chat() {
  const [matchRoute, params] = useRoute("/chat/:id");
  const activeArtisanId = params ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { artisan: authArtisan, customer, isArtisan, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [likedMsgs, setLikedMsgs] = useState<Set<number>>(new Set());
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine who we are
  const myId = isArtisan ? String(authArtisan?.id) : (customer?.id || "guest");
  const myName = isArtisan ? (authArtisan?.name || "حرفي") : (customer?.name || "زبون");
  const myType: "artisan" | "customer" = isArtisan ? "artisan" : "customer";

  // Fetch artisan info from API (for real artisans)
  const { data: apiArtisan } = useQuery<any>({
    queryKey: ["/api/artisans", activeArtisanId],
    queryFn: () => activeArtisanId ? fetch(`/api/artisans/${activeArtisanId}`).then(r => r.ok ? r.json() : null).catch(() => null) : null,
    enabled: !!activeArtisanId,
  });

  // Find artisan (API first, then mock)
  const mockArtisan = activeArtisanId ? MOCK_ARTISANS.find(a => a.id === activeArtisanId) : null;
  const activeArtisan = activeArtisanId ? {
    id: activeArtisanId,
    name: apiArtisan?.name || mockArtisan?.name || "حرفي",
    image: apiArtisan?.imageUrl || mockArtisan?.image || "",
    category: apiArtisan?.category || mockArtisan?.category || "",
  } : null;

  const convId = activeArtisanId
    ? getConversationId(activeArtisanId, isArtisan ? "customer-chat" : myId)
    : null;

  // Create conversation when opening chat
  const createConvMutation = useMutation({
    mutationFn: () => fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: convId,
        artisanId: activeArtisanId,
        customerId: isArtisan ? "customer-chat" : myId,
        customerName: isArtisan ? "زبون" : myName,
      }),
    }).then(r => r.json()),
  });

  useEffect(() => {
    if (convId && activeArtisanId) createConvMutation.mutate();
  }, [convId]);

  // Fetch messages
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", convId, "messages"],
    queryFn: () => convId ? fetch(`/api/conversations/${convId}/messages`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!convId,
    refetchInterval: 2000,
  });

  // Check if already reviewed
  const { data: hasReviewed } = useQuery<boolean>({
    queryKey: ["/api/reviews/check", activeArtisanId, myId],
    queryFn: async () => {
      if (!activeArtisanId || isArtisan) return false;
      const reviews = await fetch(`/api/artisans/${activeArtisanId}/reviews`).then(r => r.json());
      return reviews.some((r: any) => r.customerId === myId);
    },
    enabled: !!activeArtisanId && !isArtisan,
  });

  // Upload image to server, get URL
  const uploadMutation = useMutation({
    mutationFn: async (base64: string) => {
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64 }),
      });
      return r.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: convId,
        senderId: myId,
        receiverId: isArtisan ? "customer-chat" : String(activeArtisanId),
        senderType: myType,
        content,
      }),
    }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artisanId: activeArtisanId,
        customerId: myId,
        customerName: myName,
        rating: ratingValue,
        comment: ratingComment || null,
      }),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.message) {
        toast({ title: data.message, variant: "destructive" });
      } else {
        toast({ title: "✓ تم إرسال تقييمك!", description: `قيّمت ${activeArtisan?.name} بـ ${ratingValue} نجوم` });
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/check"] });
        queryClient.invalidateQueries({ queryKey: ["/api/artisans", activeArtisanId] });
      }
      setShowRating(false);
      setRatingValue(0);
      setRatingComment("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    if (selectedImage) {
      // Upload image to server first, then send URL
      try {
        const result = await uploadMutation.mutateAsync(selectedImage);
        if (result.url) sendMutation.mutate(result.url);
        else sendMutation.mutate(selectedImage); // fallback
      } catch {
        sendMutation.mutate(selectedImage);
      }
      if (inputText.trim()) setTimeout(() => sendMutation.mutate(inputText), 200);
    } else {
      sendMutation.mutate(inputText);
    }
    setInputText("");
    setSelectedImage(null);
    setShowEmoji(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleLike = (id: number) => {
    setLikedMsgs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[300px] border-l bg-card hidden md:flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-heading font-bold text-lg mb-3">الرسائل</h2>
            <input className="w-full h-9 rounded-full bg-muted/50 border-none px-4 text-sm focus:outline-none" placeholder="بحث..." />
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_ARTISANS.map(artisan => (
              <button
                key={artisan.id}
                onClick={() => setLocation(`/chat/${artisan.id}`)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors text-right ${activeArtisanId === artisan.id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={artisan.image} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{artisan.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-bold text-sm truncate">{artisan.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{artisan.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat */}
        {activeArtisan ? (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 bg-card/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/chat")} className="md:hidden p-1">
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeArtisan.image} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{activeArtisan.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-sm">{activeArtisan.name}</p>
                  <p className="text-xs text-green-500 font-medium">متصل الآن</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Show current user name */}
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground ml-2 border-l pl-3">
                  <span>أنت:</span>
                  <span className="font-bold text-foreground">{myName}</span>
                </div>
                {/* Rate button for customers */}
                {!isArtisan && messages.length > 0 && !hasReviewed && (
                  <button
                    onClick={() => setShowRating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-xs font-bold border border-amber-500/20"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    قيّم الحرفي
                  </button>
                )}
                {!isArtisan && hasReviewed && (
                  <span className="flex items-center gap-1 text-xs text-amber-500/70 px-3">
                    <Star className="h-3 w-3 fill-amber-400" /> تم التقييم
                  </span>
                )}
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={scrollRef}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">اليوم</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={activeArtisan.image} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">{activeArtisan.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-bold text-lg">{activeArtisan.name}</p>
                    <p className="text-muted-foreground text-sm">{activeArtisan.category}</p>
                  </div>
                  <p className="text-muted-foreground text-sm">ابدأ المحادثة مع {activeArtisan.name} 👋</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg: any, i: number) => {
                  const isMe = msg.senderId === myId || msg.senderType === myType;
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
                  // Name label for first message in group
                  const senderName = isMe ? myName : (msg.senderType === "artisan" ? activeArtisan.name : "زبون");
                  const showName = i === 0 || messages[i-1]?.senderType !== msg.senderType;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activeArtisan.image} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{activeArtisan.name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className="max-w-[70%] relative">
                        {showName && (
                          <p className={`text-[10px] text-muted-foreground font-bold mb-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                            {senderName}
                          </p>
                        )}
                        <div
                          onDoubleClick={() => toggleLike(msg.id)}
                          className={`rounded-2xl text-sm leading-relaxed cursor-default select-text transition-all overflow-hidden ${
                            isMe
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          } ${isImageUrl(msg.content) ? 'p-1' : 'px-4 py-2.5'}`}
                        >
                          {isImageUrl(msg.content) ? (
                            <img
                              src={msg.content}
                              alt="صورة"
                              className="max-w-[240px] max-h-[300px] rounded-xl object-cover block"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                        {likedMsgs.has(msg.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute -bottom-2 ${isMe ? 'left-2' : 'right-2'} text-sm`}
                          >❤️</motion.div>
                        )}
                        <span className={`text-[10px] text-muted-foreground mt-1 block ${isMe ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.createdAt || new Date())}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Input Bar */}
            <div className="px-4 pb-4 pt-2 bg-card/80 backdrop-blur-sm border-t shrink-0">
              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-3 relative inline-block">
                    <img src={selectedImage} className="h-20 w-20 object-cover rounded-2xl border-2 border-primary" alt="preview" />
                    <button onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="mb-3 p-3 bg-muted/50 rounded-2xl border border-border/50 flex flex-wrap gap-2">
                    {EMOJI_LIST.map(e => (
                      <button key={e} onClick={() => setInputText(p => p + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowEmoji(p => !p)}
                  className={`p-2.5 rounded-full transition-colors shrink-0 ${showEmoji ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted/50'}`}>
                  <Smile className="h-5 w-5" />
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />

                <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-primary/30">
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    placeholder={`رسالة لـ ${activeArtisan.name}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  />
                </div>

                {(inputText.trim() || selectedImage) ? (
                  <button
                    onClick={handleSend}
                    disabled={sendMutation.isPending || uploadMutation.isPending}
                    className="p-2.5 bg-primary text-white rounded-full shrink-0 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                ) : (
                  <button onClick={() => sendMutation.mutate("❤️")} className="p-2.5 text-primary shrink-0 hover:scale-110 transition-transform">
                    <Heart className="h-5 w-5 fill-primary" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-6">
            <div className="h-24 w-24 rounded-full bg-muted/50 border-2 border-dashed border-primary/30 flex items-center justify-center">
              <Send className="h-10 w-10 text-primary/40" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold mb-2">رسائلك</h2>
              <p className="text-muted-foreground text-sm">اختر محادثة أو ابدأ واحدة جديدة من صفحة الحرفيين</p>
            </div>
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading font-black">
              قيّم {activeArtisan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={activeArtisan?.image} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{activeArtisan?.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground text-sm text-center">كيف كانت تجربتك مع {activeArtisan?.name}؟</p>
            </div>

            <StarRating value={ratingValue} onChange={setRatingValue} size={40} />

            {ratingValue > 0 && (
              <p className="text-sm font-bold text-amber-500">
                {["", "ضعيف 😞", "مقبول 🙂", "جيد 👍", "جيد جداً 😊", "ممتاز 🌟"][ratingValue]}
              </p>
            )}

            <textarea
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="تعليق اختياري..."
              rows={3}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
            />

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowRating(false)}>
                إلغاء
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={ratingValue === 0 || reviewMutation.isPending}
                onClick={() => reviewMutation.mutate()}
              >
                <Star className="h-4 w-4 fill-white" />
                {reviewMutation.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
