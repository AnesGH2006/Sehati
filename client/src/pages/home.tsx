import { Hero } from "@/components/home/hero";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Users, Sparkles, MapPin, Search, MessageSquare, Star, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";
import { InstallPrompt } from "@/components/install-prompt.tsx";
import { SPECIALTIES, DAIRAS, LOCATIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
  };
  return ref;
}

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const reveal = useScrollReveal();

  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [searchWilaya,   setSearchWilaya]   = useState("");
  const [searchDaira,    setSearchDaira]    = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery)    params.set("q",         searchQuery);
    if (searchSpecialty) params.set("specialty", searchSpecialty);
    if (searchWilaya)   params.set("wilaya",    searchWilaya);
    if (searchDaira)    params.set("daira",     searchDaira);
    setLocation(`/doctors?${params.toString()}`);
  };

  const dairaOptions = searchWilaya ? (LOCATIONS as any)[searchWilaya] ?? [] : [];

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
              <h2 className="text-3xl md:text-4xl font-heading font-bold">ابحث عن طبيب</h2>
              <p className="text-muted-foreground">أدخل التخصص أو اسم الطبيب وابحث بالولاية أو الدائرة</p>
            </div>

            <div ref={reveal} className="anim-ready bg-card border rounded-3xl shadow-lg p-6 space-y-4" style={{ transitionDelay: "0.1s" }}>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو التخصص..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="w-full h-11 pr-10 pl-4 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={searchSpecialty} onValueChange={setSearchSpecialty} dir="rtl">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="🩺 التخصص" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل التخصصات</SelectItem>
                    {SPECIALTIES.map(s => (
                      <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={searchWilaya} onValueChange={v => { setSearchWilaya(v); setSearchDaira(""); }} dir="rtl">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="📍 الولاية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل الولايات</SelectItem>
                    {DAIRAS.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={searchDaira} onValueChange={setSearchDaira} disabled={!searchWilaya} dir="rtl">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="🏘️ الدائرة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل الدوائر</SelectItem>
                    {dairaOptions.map((d: string) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSearch} className="w-full h-12 rounded-xl font-black text-base gap-2">
                <Search className="h-5 w-5" />
                بحث عن طبيب
              </Button>
            </div>

            {/* Quick Specialty Buttons */}
            <div ref={reveal} className="anim-ready mt-6 flex flex-wrap gap-2 justify-center" style={{ transitionDelay: "0.2s" }}>
              {SPECIALTIES.slice(0, 8).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSearchSpecialty(s.label); setLocation(`/doctors?specialty=${encodeURIComponent(s.label)}`); }}
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

        {/* Usage Guide Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-8 text-center space-y-16">
            <div ref={reveal} className="anim-ready max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-bold">كيف تحجز موعدك؟</h2>
              <p className="text-lg text-muted-foreground">3 خطوات بسيطة للحصول على موعد طبيب</p>
            </div>
            <div ref={reveal} className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/10 -translate-y-1/2 hidden md:block -z-0" />
              <UsageStep number="1" title="ابحث عن طبيب" description="اختر التخصص والمنطقة التي تريدها" icon={<Search className="w-8 h-8" />} />
              <UsageStep number="2" title="اختر موعدك"   description="اطلع على الأوقات المتاحة واحجز ما يناسبك" icon={<Calendar className="w-8 h-8" />} />
              <UsageStep number="3" title="تواصل مباشرة" description="احصل على تأكيد الموعد وتواصل مع الطبيب" icon={<MessageSquare className="w-8 h-8" />} />
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
          <div className="orb absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="orb absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" style={{ animationDelay: "3s" }} />
          <div className="container px-4 md:px-8">
            <div ref={reveal} className="anim-ready max-w-3xl mx-auto text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                لماذا تختار منصتنا؟
              </h2>
              <p className="text-lg text-muted-foreground">
                نربطك بأفضل الأطباء في الجزائر بطريقة سهلة وآمنة وسريعة.
              </p>
            </div>
            <div ref={reveal} className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard icon={<ShieldCheck className="h-10 w-10" />} title="أطباء موثّقون"     description="جميع الأطباء مرخّصون ومتحقق منهم لضمان سلامة مرضانا الكرام." />
              <FeatureCard icon={<Calendar className="h-10 w-10" />}    title="حجز سهل وسريع"   description="احجز موعدك في ثوانٍ من أي مكان وفي أي وقت، بدون طابور انتظار." />
              <FeatureCard icon={<Star className="h-10 w-10" />}        title="تقييمات المرضى"   description="اطلع على تجارب المرضى السابقين واختر الطبيب الأنسب لك." />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-8">
            <h2 ref={reveal} className="anim-ready text-3xl md:text-4xl font-heading font-bold text-center mb-16">
              كيف يعمل الموقع؟
            </h2>
            <div ref={reveal} className="anim-ready anim-stagger grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <Step number="01" title="ابحث"    description="استخدم الفلاتر لاختيار التخصص والمنطقة."                               icon={<Search className="w-6 h-6" />} />
              <Step number="02" title="تصفح"    description="شاهد ملفات الأطباء والتقييمات لاختيار الأنسب."                         icon={<Users className="w-6 h-6" />} />
              <Step number="03" title="احجز"    description="اختر الموعد المناسب واحجزه مباشرة."                                    icon={<Calendar className="w-6 h-6" />} />
              <Step number="04" title="احضر"    description="احضر في وقت موعدك واحصل على الرعاية الصحية اللازمة."                   icon={<MapPin className="w-6 h-6" />} />
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div ref={reveal} className="anim-ready container px-4 md:px-8 max-w-4xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">مهمتنا تسهيل الوصول للرعاية الصحية</h2>
            <p className="text-xl md:text-2xl leading-relaxed opacity-90">
              نهدف إلى رقمنة قطاع الصحة في الجزائر وتمكين كل مواطن من الوصول إلى طبيب موثوق بسهولة وسرعة، أينما كان.
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
      <div className="icon-bump h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary">{icon}</div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description, icon }: any) {
  return (
    <div className="relative p-6 text-center space-y-4 flex flex-col items-center">
      <div className="text-5xl font-black font-heading text-primary/10 absolute top-0 left-1/2 -translate-x-1/2 -z-0">{number}</div>
      <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto relative z-10 shadow-lg">{icon}</div>
      <h4 className="text-xl font-bold font-heading relative z-10">{title}</h4>
      <p className="text-sm text-muted-foreground relative z-10">{description}</p>
    </div>
  );
}

function UsageStep({ number, title, description, icon }: any) {
  return (
    <div className="card-lift relative z-10 bg-card border p-8 rounded-3xl space-y-4 shadow-sm flex flex-col items-center">
      <div className="icon-bump h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">{icon}</div>
      <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">Step {number}</div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}