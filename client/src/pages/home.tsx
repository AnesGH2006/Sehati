import { Hero } from "@/components/home/hero";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Users, Sparkles, MapPin, Search, MessageSquare, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { InstallPrompt } from "@/components/install-prompt";
import { CATEGORIES, DAIRAS, LOCATIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [searchQuery, setSearchQuery]       = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchWilaya, setSearchWilaya]     = useState("all");
  const [searchDaira, setSearchDaira]       = useState("all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery)                                    params.set("q",        searchQuery);
    if (searchCategory && searchCategory !== "all")     params.set("category", searchCategory);
    if (searchWilaya   && searchWilaya   !== "all")     params.set("wilaya",   searchWilaya);
    if (searchDaira    && searchDaira    !== "all")     params.set("daira",    searchDaira);
    setLocation(`/artisans?${params.toString()}`);
  };

  const dairaOptions =
    searchWilaya && searchWilaya !== "all"
      ? (LOCATIONS as any)[searchWilaya] ?? []
      : [];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* ── Search Section ──────────────────────────────────── */}
        <section className="py-16 bg-background border-b" dir="rtl">
          <div className="container px-4 md:px-8 max-w-5xl mx-auto">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">ابحث عن حرفي</h2>
              <p className="text-muted-foreground">أدخل ما تحتاجه وابحث بالحرفة، الولاية أو الدائرة</p>
            </div>

            {/* Search Card */}
            <div className="bg-card border rounded-3xl shadow-lg p-6 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الوصف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="w-full h-11 pr-10 pl-4 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <Select value={searchCategory} onValueChange={setSearchCategory} dir="rtl">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="🔧 الحرفة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60">
                    <SelectItem value="all">كل الحرف</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.label}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Wilaya */}
                <Select
                  value={searchWilaya}
                  onValueChange={v => { setSearchWilaya(v); setSearchDaira("all"); }}
                  dir="rtl"
                >
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

                {/* Daira */}
                <Select
                  value={searchDaira}
                  onValueChange={setSearchDaira}
                  disabled={!searchWilaya || searchWilaya === "all"}
                  dir="rtl"
                >
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

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full h-12 rounded-xl font-black text-base gap-2"
              >
                <Search className="h-5 w-5" />
                بحث عن حرفي
              </Button>
            </div>

            {/* Quick Category Buttons */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {CATEGORIES.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSearchCategory(c.label); setLocation(`/artisans?category=${encodeURIComponent(c.label)}`); }}
                  className="px-4 py-2 rounded-full border text-sm hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => setLocation("/artisans")}
                className="px-4 py-2 rounded-full border text-sm text-muted-foreground hover:bg-muted transition-all"
              >
                عرض الكل ←
              </button>
            </div>
          </div>
        </section>

        {/* Usage Guide Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-8 text-center space-y-16">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-bold">{t('usage.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('usage.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/10 -translate-y-1/2 hidden md:block -z-0" />
              <UsageStep number="1" title={t('usage.step1_title')} description={t('usage.step1_desc')} icon={<Search className="w-8 h-8" />} />
              <UsageStep number="2" title={t('usage.step2_title')} description={t('usage.step2_desc')} icon={<Users className="w-8 h-8" />} />
              <UsageStep number="3" title={t('usage.step3_title')} description={t('usage.step3_desc')} icon={<MessageSquare className="w-8 h-8" />} />
            </div>
          </div>
        </section>

        {/* Why Herfati Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="container px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
              <h2 className="items-center text-3xl md:text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">لماذا تختار منصة حرفتي؟</h2>
              <p className="text-lg text-muted-foreground">نحن نغير الطريقة التي يتواصل بها الناس مع الحرفيين، بجعلها أكثر أماناً، سرعة، واحترافية.</p>
            </div>
            <div className="items-center grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard icon={<ShieldCheck className="h-10 w-10" />} title="موثوقية تامة" description="نقوم بالتحقق من هوية الحرفيين وخلفيتهم المهنية لضمان راحة بالك." delay={0.2} />
              <FeatureCard icon={<MessageSquare className="h-10 w-10" />} title="تواصل مباشر" description="نظام محادثة مدمج يتيح لك الاتفاق على كل التفاصيل وإرسال الصور بكل سهولة." delay={0.4} />
              <FeatureCard icon={<Star className="h-10 w-10" />} title="نظام تقييم شفاف" description="ساعد الآخرين باختيار الأفضل من خلال قراءة تقييمات الزبائن السابقين." delay={0.6} />
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-16">كيف يعمل الموقع؟</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <Step number="01" title="ابحث" description="استخدم الفلاتر المتقدمة لاختيار الحرفة والدائرة في الجزائر." icon={<Search className="w-6 h-6" />} />
              <Step number="02" title="تصفح" description="شاهد الملفات الشخصية، معرض الأعمال، والتقييمات لاختيار الحرفي الأنسب." icon={<Users className="w-6 h-6" />} />
              <Step number="03" title="تواصل" description="افتح محادثة مباشرة، ناقش التفاصيل، واحصل على عرض سعر." icon={<MessageSquare className="w-6 h-6" />} />
              <Step number="04" title="نفذ" description="اتفق على موعد التنفيذ واحصل على خدمة احترافية في منزلك." icon={<MapPin className="w-6 h-6" />} />
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">مهمتنا دعم الحرف المحلي</h2>
            <p className="text-xl md:text-2xl leading-relaxed opacity-90">
              نهدف في "حرفتي" إلى رقمنة قطاع الحرف في الجزائر، وتوفير فرص عمل أكبر لأبناء المنطقة، مع ضمان جودة الخدمة للمواطنين.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }} whileHover={{ y: -10 }} viewport={{ once: true }}
      className="p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-primary/5 text-center space-y-4 flex flex-col items-center group transition-all duration-500 hover:bg-card/80"
    >
      <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">{icon}</div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="relative z-10 bg-card border p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">{icon}</div>
      <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">Step {number}</div>
      <h3 className="text-xl font-bold font-heading">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}