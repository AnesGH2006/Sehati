import { Hero } from "@/components/home/hero";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ShieldCheck,
  Users,
  Sparkles,
  MapPin,
  Search,
  MessageSquare,
  Star,
  Calendar,
  Bot,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";
import { InstallPrompt } from "@/components/install-prompt.tsx";
import { SPECIALTIES, DAIRAS, LOCATIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const css = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes softPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.7; }
}
.anim-ready {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.55s ease, transform 0.55s ease;
  will-change: opacity, transform;
}
.anim-ready.visible { opacity: 1; transform: translateY(0); }
.anim-stagger > *:nth-child(1) { transition-delay: 0.05s; }
.anim-stagger > *:nth-child(2) { transition-delay: 0.15s; }
.anim-stagger > *:nth-child(3) { transition-delay: 0.25s; }
.anim-stagger > *:nth-child(4) { transition-delay: 0.35s; }
.orb { animation: softPulse 6s ease-in-out infinite; will-change: opacity; }
.card-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; will-change: transform; }
.card-lift:hover { transform: translateY(-6px); box-shadow: 0 12px 32px -8px rgba(0,0,0,0.12); }
.card-lift:hover .icon-bump { transform: scale(1.1); transition: transform 0.3s ease; }
.icon-bump { transition: transform 0.3s ease; }
`;

function useScrollReveal() {
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    if (el.dataset.observed) return;
    el.dataset.observed = "1";
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
  };
  return ref;
}

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const reveal = useScrollReveal();

  // فلاتر البحث التقليدي
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [searchWilaya, setSearchWilaya] = useState("");
  const [searchDaira, setSearchDaira] = useState("");

  // حالات صندوق المساعد الطبي الذكي (AI Triage)
  const [aiSymptoms, setAiSymptoms] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchSpecialty) params.set("specialty", searchSpecialty);
    if (searchWilaya) params.set("wilaya", searchWilaya);
    if (searchDaira) params.set("daira", searchDaira);
    setLocation(`/doctors?${params.toString()}`);
  };

  // دالة إرسال الأعراض للمساعد الذكي في الـ Backend
  const handleAiAsk = async () => {
    if (!aiSymptoms.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse("");

    try {
      const res = await fetch("/api/ai-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: aiSymptoms }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiResponse(data.reply);
    } catch (error) {
      setAiResponse(
        "يوجد خطأ في الاتصال مع الخادم. يرجى الاتصال لاحقا.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const dairaOptions = searchWilaya
    ? ((LOCATIONS as any)[searchWilaya] ?? [])
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <style>{css}</style>
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* ── Search Section ──────────────────────────────────── */}
        <section className="py-16 bg-background border-b" dir="rtl">
          <div className="container px-4 md:px-8 max-w-5xl mx-auto">
            <div ref={reveal} className="anim-ready text-center mb-8 space-y-2">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                ابحث عن طبيب
              </h2>
              <p className="text-muted-foreground">
                أدخل التخصص أو اسم الطبيب وابحث بالولاية أو الدائرة
              </p>
            </div>

            <div
              ref={reveal}
              className="anim-ready bg-card border rounded-3xl shadow-lg p-6 space-y-4"
              style={{ transitionDelay: "0.1s" }}
            >
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو التخصص..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full h-11 pr-10 pl-4 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  value={searchSpecialty}
                  onValueChange={setSearchSpecialty}
                  dir="rtl"
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="🩺 التخصص" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل التخصصات</SelectItem>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s.id} value={s.label}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={searchWilaya}
                  onValueChange={(v) => {
                    setSearchWilaya(v);
                    setSearchDaira("");
                  }}
                  dir="rtl"
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="📍 الولاية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل الولايات</SelectItem>
                    {DAIRAS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={searchDaira}
                  onValueChange={setSearchDaira}
                  disabled={!searchWilaya}
                  dir="rtl"
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="🏘️ الدائرة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل الدوائر</SelectItem>
                    {dairaOptions.map((d: string) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSearch}
                className="w-full h-12 rounded-xl font-black text-base gap-2"
              >
                <Search className="h-5 w-5" />
                بحث عن طبيب
              </Button>
            </div>

            {/* Quick Specialty Buttons */}
            <div
              ref={reveal}
              className="anim-ready mt-6 flex flex-wrap gap-2 justify-center"
              style={{ transitionDelay: "0.2s" }}
            >
              {SPECIALTIES.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSearchSpecialty(s.label);
                    setLocation(
                      `/doctors?specialty=${encodeURIComponent(s.label)}`,
                    );
                  }}
                  className="px-4 py-2 rounded-full border text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => setLocation("/doctors")}
                className="px-4 py-2 rounded-full border text-sm text-muted-foreground hover:bg-muted transition-colors duration-200"
              >
                عرض الكل ←
              </button>
            </div>
          </div>
        </section>

        {/* ── 🌟 ميزة قاتلة للسوق: صندوق التوجيه الطبي الذكي (AI Triage) ──────────────── */}
        <section className="py-16 bg-muted/20 border-b" dir="rtl">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <div
              ref={reveal}
              className="anim-ready bg-gradient-to-br from-zinc-900 via-card to-zinc-900 border border-primary/20 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-heading font-black text-white">
                      المساعد الطبي الذكي لـ "صحتي"
                    </h3>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold">
                      ميزة ثورية
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    هل أنت حائر ولا تعرف أي تخصص طبي تحتاج؟ اشرح أعراضك هنا
                    وسأوجهك فوراً.
                  </p>
                </div>
              </div>

              {/* حقل إدخال الأعراض بالعامية أو الفصحى */}
              <div className="space-y-3 relative z-10">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="مثال: عندي سطر حاد أسفل الظهر ويمتد لرجلي اليمنى مع تنمال منذ يومين..."
                    value={aiSymptoms}
                    onChange={(e) => setAiSymptoms(e.target.value)}
                    className="flex-1 bg-zinc-950/60 border border-white/10 rounded-2xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 resize-none min-h-[60px]"
                  />
                  <Button
                    onClick={handleAiAsk}
                    disabled={isAiLoading || !aiSymptoms.trim()}
                    className="h-auto px-4 rounded-2xl shrink-0 font-bold text-xs flex flex-col justify-center items-center gap-1.5"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>تحليل</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* صندوق عرض إجابة التوجيه القادمة من الـ API */}
                {aiResponse && (
                  <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 text-sm text-zinc-200 leading-relaxed space-y-3 animate-fade-in">
                    <p className="whitespace-pre-line">{aiResponse}</p>
                    <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-amber-500/80 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          هذا توجيه استرشادي فقط، يرجى تأكيده عند الطبيب المختص.
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setLocation("/doctors")}
                        className="text-xs font-black rounded-xl h-8 shrink-0"
                      >
                        <Calendar className="h-3.5 w-3.5 ml-1" /> حجز التذكرة
                        الآن
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Usage Guide Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-8 text-center space-y-16">
            <div
              ref={reveal}
              className="anim-ready max-w-2xl mx-auto space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-heading font-bold">
                كيف تحجز موعدك؟
              </h2>
              <p className="text-lg text-muted-foreground">
                3 خطوات بسيطة للحصول على موعد طبيب
              </p>
            </div>
            <div
              ref={reveal}
              className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto"
            >
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/10 -translate-y-1/2 hidden md:block -z-0" />
              <UsageStep
                number="1"
                title="ابحث عن طبيب"
                description="اختر التخصص والمنطقة التي تريدها"
                icon={<Search className="w-8 h-8" />}
              />
              <UsageStep
                number="2"
                title="اختر موعدك"
                description="اطلع على الأوقات المتاحة واحجز ما يناسبك"
                icon={<Calendar className="w-8 h-8" />}
              />
              <UsageStep
                number="3"
                title="تواصل مباشرة"
                description="احصل على تأكيد الموعد وتواصل مع الطبيب"
                icon={<MessageSquare className="w-8 h-8" />}
              />
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
          <div className="orb absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div
            className="orb absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"
            style={{ animationDelay: "3s" }}
          />
          <div className="container px-4 md:px-8">
            <div
              ref={reveal}
              className="anim-ready max-w-3xl mx-auto text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                لماذا تختار منصتنا؟
              </h2>
              <p className="text-lg text-muted-foreground">
                نربطك بأفضل الأطباء في الجزائر بطريقة سهلة وآمنة وسريعة.
              </p>
            </div>
            <div
              ref={reveal}
              className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            >
              <FeatureCard
                icon={<ShieldCheck className="h-10 w-10" />}
                title="أطباء موثّقون"
                description="جميع الأطباء مرخّصون ومتحقق منهم لضمان سلامة مرضانا الكرام."
              />
              <FeatureCard
                icon={<Calendar className="h-10 w-10" />}
                title="حجز سهل وسريع"
                description="احجز موعدك في ثوانٍ من أي مكان وفي أي وقت، بدون طابور انتظار."
              />
              <FeatureCard
                icon={<Star className="h-10 w-10" />}
                title="تقييمات المرضى"
                description="اطلع على تجارب المرضى السابقين واختر الطبيب الأنسب لك."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-8">
            <h2
              ref={reveal}
              className="anim-ready text-3xl md:text-4xl font-heading font-bold text-center mb-16"
            >
              كيف يعمل الموقع؟
            </h2>
            <div
              ref={reveal}
              className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
            >
              <Step
                number="01"
                title="ابحث"
                description="استخدم الفلاتر لاختيار التخصص والمنطقة."
                icon={<Search className="w-6 h-6" />}
              />
              <Step
                number="02"
                title="تصفح"
                description="شاهد ملفات الأطباء والتقييمات لاختيار الأنسب."
                icon={<Users className="w-6 h-6" />}
              />
              <Step
                number="03"
                title="احجز"
                description="اختر الموعد المناسب واحجزه مباشرة."
                icon={<Calendar className="w-6 h-6" />}
              />
              <Step
                number="04"
                title="احضر"
                description="احضر في وقت موعدك واحصل على الرعاية الصحية اللازمة."
                icon={<MapPin className="w-6 h-6" />}
              />
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div
            ref={reveal}
            className="anim-ready container px-4 md:px-8 max-w-4xl mx-auto"
          >
            <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              مهمتنا تسهيل الوصول للرعاية الصحية
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed opacity-90">
              نهدف إلى رقمنة قطاع الصحة في الجزائر وتمكين كل مواطن من الوصول إلى
              طبيب موثوق بسهولة وسرعة، أينما كان.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="card-lift p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-white/10 shadow-xl text-center space-y-4 flex flex-col items-center group">
      <div className="icon-bump h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}

function Step({ number, title, description, icon }: any) {
  return (
    <div className="relative p-6 text-center space-y-4 flex flex-col items-center">
      <div className="text-5xl font-black font-heading text-primary/10 absolute top-0 left-1/2 -translate-x-1/2 -z-0">
        {number}
      </div>
      <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto relative z-10 shadow-lg">
        {icon}
      </div>
      <h4 className="text-xl font-bold font-heading relative z-10">{title}</h4>
      <p className="text-sm text-muted-foreground relative z-10">
        {description}
      </p>
    </div>
  );
}

function UsageStep({ number, title, description, icon }: any) {
  return (
    <div className="card-lift relative z-10 bg-card border p-8 rounded-3xl space-y-4 shadow-sm flex flex-col items-center">
      <div className="icon-bump h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
        {icon}
      </div>
      <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
        Step {number}
      </div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
