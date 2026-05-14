import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_DOCTORS, SPECIALTIES, specialtyLabel } from "@/lib/constants";
import { Send, Image as ImageIcon, Star, X, ArrowRight, Phone, Video, Heart, CheckCheck, Mic, MicOff, Pencil, Trash2 } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCall } from "@/hooks/useCall";
import { CallUI } from "@/components/CallUI";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const EMOJI_CATEGORIES = {
  "😊 مشاعر": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 تحيات": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏"],
  "❤️ قلوب": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟"],
  "🎉 احتفال": ["🎉","🎊","🎈","🎁","🎀","🏆","🥇","🥈","🥉","🏅","🎖","🎭","🎨","🎮","🎲","🧩","🎯","🎳"],
  "🔥 شائع": ["🔥","✨","⭐","🌟","💫","⚡","🌈","🎯","💯","💪","🚀","👑","💎","🌺","🦋","🌸","🌻","🍀","🎵","🎶","💥"],
};

const EMOJI_LIST = Object.values(EMOJI_CATEGORIES).flat();
const FINISH_SIGNAL = "__CHAT_FINISHED__";

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
}

function getConversationId(doctorId: number, patientId: string) {
  return `conv-${doctorId}-${patientId}`;
}

function isImageUrl(content: string) {
  return content?.startsWith("data:image") ||
    content?.startsWith("/uploads/") ||
    content?.startsWith("uploads/") ||
    (content?.startsWith("http") && !content?.includes("__"));
}

function StarRating({ value, onChange, size = 32 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
          style={{ cursor: onChange ? "pointer" : "default" }}
          className="transition-transform hover:scale-110"
        >
          <Star style={{ width: size, height: size }}
            className={`transition-colors ${(hovered || value) >= star ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        </button>
      ))}
    </div>
  );
}

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const activeDoctorId = params ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { doctor: authDoctor, customer, isDoctor, isLoggedIn, ensureGuest } = useAuth();

  useEffect(() => {
    if (!isDoctor && !customer && activeDoctorId) ensureGuest();
  }, [isDoctor, customer, activeDoctorId]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inputText, setInputText]         = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmoji, setShowEmoji]         = useState(false);
  const [likedMsgs, setLikedMsgs]         = useState<Set<number>>(new Set());
  const [editingMsg, setEditingMsg]       = useState<{id: number, content: string} | null>(null);
  const [showRating, setShowRating]       = useState(false);
  const [ratingValue, setRatingValue]     = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    msgId: number; msgContent: string; x: number; y: number; isImage: boolean;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress   = useRef(false);

  const scrollRef        = useRef<HTMLDivElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef   = useRef<BlobPart[]>([]);

  const myId   = isDoctor ? (authDoctor?.id ? String(authDoctor.id) : "doctor") : (customer?.id || "guest");
  const myName = isDoctor ? (authDoctor?.name || "طبيب") : (customer?.name || "مريض");
  const myType: "doctor" | "patient" = isDoctor ? "doctor" : "patient";

  useEffect(() => {
    if (isDoctor) setLocation("/doctor/dashboard");
  }, [isDoctor]);

  const handleMsgPressStart = (e: React.TouchEvent | React.MouseEvent, msg: any, isMe: boolean) => {
    if (!isMe) return;
    didLongPress.current = false;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      const menuWidth = 180; const menuHeight = isImageUrl(msg.content) ? 60 : 110;
      const x = Math.min(clientX, window.innerWidth - menuWidth - 8);
      const y = Math.min(clientY, window.innerHeight - menuHeight - 8);
      setContextMenu({ msgId: msg.id, msgContent: msg.content, x, y, isImage: isImageUrl(msg.content) });
    }, 500);
  };

  const handleMsgPressEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const { callState, callType, remoteName, isMuted, isCamOff, localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera } = useCall({ myId, myName });

  const { data: apiDoctor } = useQuery<any>({
    queryKey: ["/api/doctors", activeDoctorId],
    queryFn: () => activeDoctorId ? fetch(`/api/doctors/${activeDoctorId}`).then(r => r.ok ? r.json() : null).catch(() => null) : null,
    enabled: !!activeDoctorId,
  });

  const mockDoctor = activeDoctorId ? (MOCK_DOCTORS as any[]).find(d => d.id === activeDoctorId) : null;
  const activeDoctor: any = activeDoctorId ? {
    id: activeDoctorId,
    name: isDoctor && authDoctor?.id === activeDoctorId
      ? (authDoctor?.name || "طبيب")
      : (apiDoctor?.name || mockDoctor?.name || "طبيب"),
    image: isDoctor && authDoctor?.id === activeDoctorId
      ? (authDoctor?.imageUrl || `https://ui-avatars.com/api/?name=${authDoctor?.name}&background=2DD4BF&color=fff`)
      : (apiDoctor?.imageUrl || mockDoctor?.image || ""),
    specialty: isDoctor && authDoctor?.id === activeDoctorId
      ? specialtyLabel(authDoctor?.specialty)
      : (specialtyLabel(apiDoctor?.specialty) || mockDoctor?.specialty || ""),
  } : null;

  const convId = activeDoctorId
    ? getConversationId(activeDoctorId, isDoctor ? "patient-chat" : myId)
    : null;

  const { data: myConversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", myId, myType],
    queryFn: () => fetch(`/api/conversations/${myId}?role=${myType}`).then(r => r.ok ? r.json() : []).catch(() => []),
    enabled: !!myId,
    refetchInterval: 3000,
  });

  const { data: allDoctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
    queryFn: () => fetch("/api/doctors").then(r => r.json()),
  });

  const createConvMutation = useMutation({
    mutationFn: () => fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: convId,
        doctorId: activeDoctorId,
        patientId: isDoctor ? "patient-chat" : myId,
        patientName: isDoctor ? "مريض" : myName,
      }),
    }).then(r => r.json()),
  });

  useEffect(() => {
    if (convId && activeDoctorId) createConvMutation.mutate();
  }, [convId]);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations", convId, "messages"],
    queryFn: () => convId ? fetch(`/api/conversations/${convId}/messages`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!convId,
    refetchInterval: 2000,
  });

  const chatFinished = messages.some((m: any) => m.content === FINISH_SIGNAL && m.senderType === "doctor");

  const patientIdFromMessages = messages.find((m: any) => m.senderType === "patient")?.senderId;
  const doctorUserId  = apiDoctor?.userId || String(activeDoctorId);
  const callTargetId  = isDoctor ? (patientIdFromMessages || "patient-chat") : doctorUserId;

  const { data: hasReviewed } = useQuery<boolean>({
    queryKey: ["/api/reviews/check", activeDoctorId, myId],
    queryFn: async () => {
      if (!activeDoctorId || isDoctor) return false;
      const reviews = await fetch(`/api/doctors/${activeDoctorId}/reviews`).then(r => r.json());
      return reviews.some((r: any) => r.patientId === myId);
    },
    enabled: !!activeDoctorId && !isDoctor,
  });

  const uploadMutation = useMutation({
    mutationFn: async (base64: string) => {
      const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: base64 }) });
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
        receiverId: isDoctor ? "patient-chat" : String(activeDoctorId),
        senderType: myType,
        content,
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", myId, myType] });
    },
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/messages/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] }),
  });

  const editMsgMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      fetch(`/api/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] }); setEditingMsg(null); },
  });

  const finishChatMutation = useMutation({
    mutationFn: () => fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: convId, senderId: myId,
        receiverId: "patient-chat", senderType: "doctor", content: FINISH_SIGNAL,
      }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] });
      toast({ title: "✅ تم إنهاء المحادثة", description: "يمكن للمريض الآن تقييمك" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () => fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: activeDoctorId, patientId: myId, patientName: myName,
        rating: ratingValue, comment: ratingComment || null,
      }),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.message) { toast({ title: data.message, variant: "destructive" }); }
      else {
        toast({ title: "✓ تم إرسال تقييمك!", description: `قيّمت د. ${activeDoctor?.name} بـ ${ratingValue} نجوم` });
        queryClient.invalidateQueries({ queryKey: ["/api/reviews/check"] });
        queryClient.invalidateQueries({ queryKey: ["/api/doctors", activeDoctorId] });
      }
      setShowRating(false); setRatingValue(0); setRatingComment("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    if (selectedImage) {
      try {
        const result = await uploadMutation.mutateAsync(selectedImage);
        sendMutation.mutate(result.url || selectedImage);
      } catch { sendMutation.mutate(selectedImage); }
      if (inputText.trim()) setTimeout(() => sendMutation.mutate(inputText), 200);
    } else { sendMutation.mutate(inputText); }
    setInputText(""); setSelectedImage(null); setShowEmoji(false);
  };

  const handleVoiceClip = async () => {
    if (chatFinished) return;
    if (isRecordingVoice) { mediaRecorderRef.current?.stop(); setIsRecordingVoice(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob);
        });
        const result = await uploadMutation.mutateAsync(base64);
        if (result.url) sendMutation.mutate(result.url);
      };
      recorder.start(); setIsRecordingVoice(true);
    } catch { setIsRecordingVoice(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file); e.target.value = "";
  };

  const toggleLike = (id: number) => {
    setLikedMsgs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const getDoctorForConv = (conv: any) => {
    const found = allDoctors.find((d: any) => d.id === conv.doctorId);
    if (found) return {
      id: found.id, name: found.name,
      image: found.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=2DD4BF&color=fff`,
      specialty: SPECIALTIES.find(s => s.id === found.specialty)?.label || found.specialty,
    };
    const mock = (MOCK_DOCTORS as any[]).find(d => d.id === conv.doctorId);
    if (mock) return { id: mock.id, name: mock.name, image: mock.image, specialty: mock.specialty };
    return { id: conv.doctorId, name: `طبيب #${conv.doctorId}`, image: "", specialty: "" };
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
            {myConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm px-4">
                <Send className="h-8 w-8 mx-auto mb-3 opacity-20" />
                لا توجد محادثات بعد
              </div>
            ) : (
              myConversations.map((conv: any) => {
                const doctor = isDoctor ? null : getDoctorForConv(conv);
                const displayName  = isDoctor ? (conv.patientName || "مريض") : `د. ${doctor?.name}`;
                const displayImage = isDoctor ? "" : doctor?.image;
                const displaySub   = isDoctor ? conv.patientId?.slice(0, 12) : doctor?.specialty;
                const convDoctorId = conv.doctorId;
                const isActive = isDoctor ? activeDoctorId === authDoctor?.id : activeDoctorId === convDoctorId;
                return (
                  <button key={conv.id}
                    onClick={() => setLocation(`/chat/${isDoctor ? authDoctor?.id : convDoctorId}`)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors text-right ${isActive ? 'bg-primary/5 border-r-2 border-primary' : ''}`}>
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={displayImage} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">{displayName?.[0] || "؟"}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-bold text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage === FINISH_SIGNAL ? "✅ تم إنهاء المحادثة" : (conv.lastMessage || displaySub)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat */}
        {activeDoctor ? (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <div className="min-h-20 border-b flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/chat")} className="md:hidden p-1"><ArrowRight className="h-5 w-5" /></button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeDoctor.image} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{activeDoctor.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-sm">د. {activeDoctor.name}</p>
                  <p className="text-xs text-green-500 font-medium">
                    {chatFinished ? "✅ تم إنهاء المحادثة" : "متصل الآن"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground ml-2 border-l pl-3">
                  <span>أنت:</span><span className="font-bold text-foreground">{myName}</span>
                </div>

                {isDoctor && !chatFinished && messages.length > 0 && (
                  <button onClick={() => { if (confirm("هل تريد إنهاء هذه المحادثة؟ سيتمكن المريض بعدها من تقييمك.")) finishChatMutation.mutate(); }}
                    disabled={finishChatMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-xs font-bold border border-green-500/20">
                    <CheckCheck className="h-3.5 w-3.5" /> إنهاء المحادثة
                  </button>
                )}

                {isDoctor && chatFinished && (
                  <span className="flex items-center gap-1 text-xs text-green-600/70 px-3"><CheckCheck className="h-3.5 w-3.5" /> تم الإنهاء</span>
                )}

                {!isDoctor && chatFinished && !hasReviewed && (
                  <button onClick={() => setShowRating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-xs font-bold border border-amber-500/20">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> قيّم الطبيب
                  </button>
                )}

                {!isDoctor && !chatFinished && messages.length > 0 && !hasReviewed && (
                  <span className="text-xs text-muted-foreground px-2">انتظر إنهاء الطبيب للمحادثة</span>
                )}

                {!isDoctor && hasReviewed && (
                  <span className="flex items-center gap-1 text-xs text-amber-500/70 px-3"><Star className="h-3 w-3 fill-amber-400" /> تم التقييم</span>
                )}

                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                  onClick={() => startCall(callTargetId, activeDoctor.name, "audio")}><Phone className="h-5 w-5" /></button>
                <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                  onClick={() => startCall(callTargetId, activeDoctor.name, "video")}><Video className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 relative" ref={scrollRef}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">اليوم</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={activeDoctor.image} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">{activeDoctor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-bold text-lg">د. {activeDoctor.name}</p>
                    <p className="text-muted-foreground text-sm">{activeDoctor.specialty}</p>
                  </div>
                  <p className="text-muted-foreground text-sm">ابدأ المحادثة مع د. {activeDoctor.name} 👋</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg: any, i: number) => {
                  if (msg.content === FINISH_SIGNAL) {
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-green-500/20" />
                        <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" /> أنهى الطبيب المحادثة
                        </span>
                        <div className="flex-1 h-px bg-green-500/20" />
                      </motion.div>
                    );
                  }

                  const isMe = msg.senderId === myId;
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
                  const senderName = isMe ? myName : (msg.senderType === "doctor" ? `د. ${activeDoctor.name}` : "مريض");
                  const showName = i === 0 || messages[i-1]?.senderType !== msg.senderType;

                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                      onMouseDown={(e) => handleMsgPressStart(e, msg, isMe)}
                      onMouseUp={handleMsgPressEnd}
                      onMouseLeave={handleMsgPressEnd}
                      onTouchStart={(e) => handleMsgPressStart(e, msg, isMe)}
                      onTouchEnd={handleMsgPressEnd}
                      onTouchCancel={handleMsgPressEnd}
                      onContextMenu={(e) => {
                        if (isMe) {
                          e.preventDefault();
                          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                          const menuWidth = 180; const menuHeight = isImageUrl(msg.content) ? 60 : 110;
                          const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
                          const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
                          setContextMenu({ msgId: msg.id, msgContent: msg.content, x, y, isImage: isImageUrl(msg.content) });
                        }
                      }}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activeDoctor.image} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{activeDoctor.name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className="max-w-[70%] relative">
                        {showName && (
                          <p className={`text-[10px] text-muted-foreground font-bold mb-0.5 ${isMe ? 'text-right' : 'text-left'}`}>{senderName}</p>
                        )}
                        {editingMsg && editingMsg.id === msg.id ? (
                          <div className="flex gap-2 items-center">
                            <input autoFocus value={editingMsg.content}
                              onChange={e => setEditingMsg(prev => prev ? { ...prev, content: e.target.value } : null)}
                              onKeyDown={e => {
                                if (e.key === "Enter") editMsgMutation.mutate({ id: msg.id, content: editingMsg.content });
                                if (e.key === "Escape") setEditingMsg(null);
                              }}
                              className="flex-1 bg-primary/20 text-white rounded-xl px-3 py-2 text-sm border border-primary/40 focus:outline-none"
                            />
                            <button onClick={() => editMsgMutation.mutate({ id: msg.id, content: editingMsg.content })} className="text-xs text-primary font-bold">✓</button>
                            <button onClick={() => setEditingMsg(null)} className="text-xs text-muted-foreground">✕</button>
                          </div>
                        ) : (
                          <div onDoubleClick={() => toggleLike(msg.id)}
                            className={`rounded-2xl text-sm leading-relaxed cursor-default select-text transition-all overflow-hidden ${
                              isMe ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-md'
                                   : 'bg-muted text-foreground rounded-bl-md'
                            } ${isImageUrl(msg.content) ? 'p-1' : 'px-4 py-2.5'}`}
                          >
                            {isImageUrl(msg.content) ? (
                              <img src={msg.content.startsWith("uploads/") ? `/${msg.content}` : msg.content} alt="صورة"
                                className="max-w-[240px] max-h-[300px] rounded-xl object-cover block"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : msg.content}
                          </div>
                        )}
                        {likedMsgs.has(msg.id) && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className={`absolute -bottom-2 ${isMe ? 'left-2' : 'right-2'} text-sm`}>❤️</motion.div>
                        )}
                        <span className={`text-[10px] text-muted-foreground mt-1 block ${isMe ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.createdAt || new Date())}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Context Menu */}
              <AnimatePresence>
                {contextMenu && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}
                      onContextMenu={e => { e.preventDefault(); setContextMenu(null); }} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -4 }}
                      transition={{ type: "spring", damping: 22, stiffness: 320 }}
                      style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 50, transformOrigin: "top right" }}
                      className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/25 overflow-hidden min-w-[170px] backdrop-blur-md"
                    >
                      {!contextMenu.isImage && (
                        <button onClick={() => { setEditingMsg({ id: contextMenu.msgId, content: contextMenu.msgContent }); setContextMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/30">
                          <Pencil className="h-4 w-4 shrink-0" /> تعديل الرسالة
                        </button>
                      )}
                      <button onClick={() => { setContextMenu(null); setTimeout(() => { if (confirm("حذف هذه الرسالة؟")) deleteMsgMutation.mutate(contextMenu.msgId); }, 100); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4 shrink-0" /> حذف الرسالة
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 bg-card/80 backdrop-blur-sm border-t shrink-0">
              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 relative inline-block">
                    <img src={selectedImage} className="h-20 w-20 object-cover rounded-2xl border-2 border-primary" alt="preview" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center"><X className="h-3 w-3" /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="mb-3 p-3 bg-muted/50 rounded-2xl border border-border/50 flex flex-wrap gap-2">
                    {EMOJI_LIST.map(e => <button key={e} onClick={() => setInputText(p => p + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>)}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowEmoji(p => !p)}
                  className={`p-2.5 rounded-full transition-colors shrink-0 ${showEmoji ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted/50'}`}>
                  <Star className="h-5 w-5" />
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button onClick={handleVoiceClip}
                  className={`p-2.5 rounded-full transition-colors shrink-0 ${isRecordingVoice ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "text-muted-foreground hover:text-primary hover:bg-muted/50"}`}>
                  {isRecordingVoice ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />

                <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-primary/30">
                  <input type="text"
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    placeholder={chatFinished ? "تم إنهاء المحادثة" : `رسالة لـ د. ${activeDoctor.name}...`}
                    value={inputText} disabled={chatFinished}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  />
                </div>

                {(inputText.trim() || selectedImage) ? (
                  <button onClick={handleSend} disabled={sendMutation.isPending || uploadMutation.isPending || chatFinished}
                    className="p-2.5 bg-primary text-white rounded-full shrink-0 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-60">
                    <Send className="h-5 w-5" />
                  </button>
                ) : (
                  <button onClick={() => !chatFinished && sendMutation.mutate("❤️")} disabled={chatFinished}
                    className="p-2.5 text-primary shrink-0 hover:scale-110 transition-transform disabled:opacity-40">
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
              <p className="text-muted-foreground text-sm">اختر محادثة أو ابدأ واحدة جديدة من صفحة الأطباء</p>
            </div>
          </div>
        )}
      </div>

      <CallUI callState={callState} callType={callType} remoteName={remoteName || activeDoctor?.name || ""}
        remoteImage={activeDoctor?.image} isMuted={isMuted} isCamOff={isCamOff}
        localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef}
        onAccept={acceptCall} onReject={rejectCall} onEnd={endCall}
        onToggleMute={toggleMute} onToggleCamera={toggleCamera} />

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading font-black">قيّم د. {activeDoctor?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={activeDoctor?.image} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{activeDoctor?.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground text-sm text-center">كيف كانت تجربتك مع د. {activeDoctor?.name}؟</p>
            </div>
            <StarRating value={ratingValue} onChange={setRatingValue} size={40} />
            {ratingValue > 0 && (
              <p className="text-sm font-bold text-amber-500">{["","ضعيف 😞","مقبول 🙂","جيد 👍","جيد جداً 😊","ممتاز 🌟"][ratingValue]}</p>
            )}
            <textarea className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="تعليق اختياري..." rows={3} value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowRating(false)}>إلغاء</Button>
              <Button className="flex-1 gap-2" disabled={ratingValue === 0 || reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
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