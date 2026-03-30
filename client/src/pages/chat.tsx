import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_ARTISANS } from "@/lib/constants";
import { Send, Image as ImageIcon, Smile, X, ArrowRight, Phone, Video, Info, Heart } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const EMOJI_LIST = ["😊","😂","❤️","😍","🥰","👍","🙏","🔥","✨","💯","😎","🤝","👋","🎉","💪","🤔","😭","😤","🥺","💬"];

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
}

function getConversationId(artisanId: number, customerId: string) {
  return `conv-${artisanId}-${customerId}`;
}

export default function Chat() {
  const [matchRoute, params] = useRoute("/chat/:id");
  const activeArtisanId = params ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { artisan: authArtisan, customer, isArtisan, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [likedMsgs, setLikedMsgs] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine who we are
  const myId = isArtisan ? String(authArtisan?.id) : (customer?.id || "guest-" + Date.now());
  const myName = isArtisan ? authArtisan?.name : customer?.name;
  const myType: "artisan" | "customer" = isArtisan ? "artisan" : "customer";

  // Find artisan info
  const activeArtisan = activeArtisanId
    ? MOCK_ARTISANS.find(a => a.id === activeArtisanId) || { id: activeArtisanId, name: "حرفي", image: "", category: "" }
    : null;

  const convId = activeArtisanId
    ? getConversationId(activeArtisanId, isArtisan ? "customer-chat" : myId)
    : null;

  // Create conversation on open
  const createConvMutation = useMutation({
    mutationFn: () => fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: convId,
        artisanId: activeArtisanId,
        customerId: isArtisan ? "customer-chat" : myId,
      }),
    }).then(r => r.json()),
  });

  useEffect(() => {
    if (convId && activeArtisanId) {
      createConvMutation.mutate();
    }
  }, [convId]);

  // Fetch messages
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", convId, "messages"],
    queryFn: () => convId ? fetch(`/api/conversations/${convId}/messages`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!convId,
    refetchInterval: 2000,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = selectedImage ? (inputText || "📷 صورة") : inputText;
    if (!text.trim()) return;
    sendMutation.mutate(text);
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
  };

  const toggleLike = (id: number) => {
    setLikedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-[300px] border-l bg-card hidden md:flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-heading font-bold text-lg mb-3">الرسائل</h2>
            <input
              className="w-full h-9 rounded-full bg-muted/50 border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="بحث..."
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_ARTISANS.map((artisan) => (
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
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-sm truncate">{artisan.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">الآن</span>
                  </div>
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
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={scrollRef}>
              {/* Date divider */}
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
                    <p className="text-muted-foreground text-sm">{(activeArtisan as any).category}</p>
                  </div>
                  <p className="text-muted-foreground text-sm">ابدأ المحادثة مع {activeArtisan.name} 👋</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg: any, i: number) => {
                  const isMe = msg.senderId === myId || msg.senderType === myType;
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
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
                      <div className={`max-w-[70%] relative`}>
                        <div
                          onDoubleClick={() => toggleLike(msg.id)}
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-default select-text transition-all ${
                            isMe
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {likedMsgs.has(msg.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute -bottom-2 ${isMe ? 'left-2' : 'right-2'} text-sm`}
                          >
                            ❤️
                          </motion.div>
                        )}
                        <span className={`text-[10px] text-muted-foreground mt-1 block ${isMe ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.createdAt || new Date())}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Typing indicator */}
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={activeArtisan.image} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{activeArtisan.name[0]}</AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-md inline-flex gap-1.5 items-center opacity-0">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="px-4 pb-4 pt-2 bg-card/80 backdrop-blur-sm border-t shrink-0">
              {/* Image Preview */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-3 relative inline-block">
                    <img src={selectedImage} className="h-20 w-20 object-cover rounded-2xl border-2 border-primary" alt="preview" />
                    <button onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="mb-3 p-3 bg-muted/50 rounded-2xl border border-border/50 flex flex-wrap gap-2">
                    {EMOJI_LIST.map(e => (
                      <button key={e} onClick={() => setInputText(p => p + e)}
                        className="text-xl hover:scale-125 transition-transform">
                        {e}
                      </button>
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
                    placeholder="رسالة..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  />
                </div>

                {(inputText.trim() || selectedImage) ? (
                  <button
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                    className="p-2.5 bg-primary text-white rounded-full shrink-0 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/30"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                ) : (
                  <button className="p-2.5 text-primary shrink-0 hover:scale-110 transition-transform">
                    <Heart className="h-5 w-5 fill-primary" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No chat selected */
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
    </div>
  );
}
