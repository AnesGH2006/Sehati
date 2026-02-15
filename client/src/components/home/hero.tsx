import { Search, MapPin, Sparkles, Hammer, Wrench, Zap, Paintbrush, Car, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";

const QUICK_CATEGORIES = [
  { id: "carpentry", label: "نجارة", icon: Hammer },
  { id: "plumbing", label: "سباكة", icon: Wrench },
  { id: "electrical", label: "كهرباء", icon: Zap },
  { id: "painting", label: "دهانات", icon: Paintbrush },
  { id: "mechanic", label: "ميكانيك", icon: Car },
  { id: "tailoring", label: "خياطة", icon: Scissors },
];

export function Hero() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const isRtl = i18n.language === 'ar';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/artisans?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-[#050505]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="container px-4 md:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-4">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">المنصة رقم #1 في الجزائر</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-heading font-black text-white leading-[1.1] tracking-tight">
              {t('hero.title')}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {t('hero.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-3xl mx-auto group"
          >
            <form onSubmit={handleSearch} className="relative flex flex-col md:flex-row gap-4 p-3 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl group-hover:border-primary/30 transition-all duration-500">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-primary transition-colors`} />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder') || "ما هي الحرفة التي تبحث عنها؟"}
                  className={`w-full h-16 ${isRtl ? 'pr-14' : 'pl-14'} bg-transparent border-none text-white text-lg placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0`}
                />
              </div>
              
              <div className="hidden md:flex items-center px-4 border-x border-white/10 gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm">كل الجزائر</span>
              </div>

              <Button 
                type="submit"
                size="lg" 
                className="h-16 px-10 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                {t('search_button') || "بحث"}
              </Button>
            </form>
          </motion.div>

          {/* Quick Categories */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            {QUICK_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                onClick={() => setLocation(`/artisans?category=${cat.id}`)}
                className="group h-14 px-6 rounded-2xl bg-white/5 border-white/10 text-gray-300 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 backdrop-blur-md"
              >
                <cat.icon className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold">{cat.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
