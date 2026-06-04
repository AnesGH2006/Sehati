import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/algerian_artisan_working_on_pottery_or_leather_in_a_bright_workshop.png";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";

export function Hero() {
  const [, setLocation] = useLocation();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState("");

  const handleNearMe = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("متصفحك لا يدعم تحديد الموقع");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        setLocation(`/nearby?lat=${latitude}&lng=${longitude}&radius=15`);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) setGeoError("يرجى السماح بالوصول إلى موقعك");
        else                setGeoError("تعذّر تحديد موقعك، حاول مجدداً");
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="طبيب جزائري"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/35 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6" dir="rtl">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold font-heading text-white leading-tight"
          >
            اعثر على طبيبك في دقائق
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto"
          >
            منصة صحتي تربطك بأفضل الأطباء في الجزائر — احجز موعدك وتواصل مباشرة
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4"
          >
            {/* Primary CTA */}
            <Button
              size="lg"
              onClick={() => setLocation("/doctors")}
              className="h-14 px-8 text-lg font-bold rounded-2xl shadow-2xl hover:scale-105 transition-transform gap-2"
            >
              <Search className="h-5 w-5" />
              ابحث عن طبيب
            </Button>

            {/* Near Me CTA */}
            <Button
              size="lg"
              variant="outline"
              onClick={handleNearMe}
              disabled={geoLoading}
              className="h-14 px-8 text-lg font-bold rounded-2xl border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 hover:border-white backdrop-blur-sm shadow-2xl hover:scale-105 transition-all gap-2 disabled:opacity-70"
            >
              {geoLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <MapPin className="h-5 w-5" />
              }
              {geoLoading ? "جاري تحديد موقعك..." : "أطباء قريبون مني"}
            </Button>
          </motion.div>

          {/* Geo error */}
          {geoError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-2 inline-block"
            >
              ⚠️ {geoError}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
