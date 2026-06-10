import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, Send, Loader2, ArrowRight, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "مرحباً! أنا مساعدك الطبي الذكي 🩺\nأخبرني عن أعراضك وسأساعدك في معرفة التخصص المناسب وحجز موعد مع الطبيب.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error();
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...updated,
        { role: "assistant", content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مجدداً." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "مرحباً! أنا مساعدك الطبي الذكي 🩺\nأخبرني عن أعراضك وسأساعدك في معرفة التخصص المناسب وحجز موعد مع الطبيب.",
      },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">المساعد الطبي الذكي</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              متصل الآن
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          title="مسح المحادثة"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>هذا مساعد استرشادي فقط — ليس بديلاً عن الطبيب المختص</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions (shown only at start) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 justify-end">
          {["عندي صداع شديد", "ألم في الصدر", "مشكلة في الجلد", "ألم في المعدة"].map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="px-3 py-1.5 rounded-full border text-xs hover:bg-primary hover:text-white hover:border-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="اكتب أعراضك هنا..."
            className="flex-1 resize-none bg-muted rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] max-h-[120px]"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full h-11 w-11 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          اضغط Enter للإرسال • Shift+Enter لسطر جديد
        </p>
      </div>
    </div>
  );
}