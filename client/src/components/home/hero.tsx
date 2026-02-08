import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070",
  "https://images.unsplash.com/photo-1621905252507-b35222028781?q=80&w=2070",
  "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?q=80&w=2070"
];

export function Hero() {
  const { t, i18n } = useTranslation();
  const [currentImage, setCurrentImage] = useState(0);
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-10" />
            <img 
              src={HERO_IMAGES[currentImage]} 
              alt="Artisan background"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="container relative z-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-md animate-bounce-slow">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wider uppercase">أكبر منصة للحرفيين في تيارت</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-heading leading-tight tracking-tight">
              {t('hero.title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                {t('hero.title_accent')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
              {t('hero.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-4 md:p-6 rounded-[2rem] border border-white/20 shadow-2xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                <input 
                  type="text" 
                  placeholder={t('hero.search_placeholder')}
                  className={`w-full ${isRtl ? 'pr-12' : 'pl-12'} h-14 bg-white/50 dark:bg-black/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/30 transition-all text-lg font-medium outline-none`}
                />
              </div>
              <div className="w-full md:w-48 relative group">
                <MapPin className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors`} />
                <select className={`w-full ${isRtl ? 'pr-12' : 'pl-12'} h-14 bg-white/50 dark:bg-black/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/30 transition-all text-lg font-medium outline-none appearance-none`}>
                  <option value="">{t('hero.location_placeholder')}</option>
                  <option>تيارت</option>
                  <option>السوقر</option>
                  <option>فرندة</option>
                </select>
              </div>
              <Button size="lg" className="h-14 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                {t('hero.search_button')}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 pt-8"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              400+ حرفي نشط
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border">
              <div className="w-2 h-2 rounded-full bg-primary" />
              13 دائرة مغطاة
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImage(i)}
            className={`h-1.5 transition-all duration-300 rounded-full ${currentImage === i ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
          />
        ))}
      </div>
    </section>
  );
}
