import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAIRAS, SPECIALTIES } from "@/lib/constants";
import heroImage from "@assets/generated_images/algerian_artisan_working_on_pottery_or_leather_in_a_bright_workshop.png";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Algerian Doctor" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 backdrop-blur-[1px]"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold font-heading text-white leading-tight"
          >
            {اعثر على طبيبك في دقائق}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto"
          >
            {t('')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-8"
          >
            <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-2xl hover:scale-105 transition-transform">
              ابدأ الآن 
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
