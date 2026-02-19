import { Star, MapPin, BadgeCheck, Briefcase, Banknote, Image as ImageIcon, Phone } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface ArtisanCardProps {
  id: number;
  name: string;
  category: string;
  daira: string;
  phone: string;
  rating: number;
  reviews: number;
  priceStart: number;
  yearsOfExperience?: number;
  image: string;
  isVerified: boolean;
  portfolioImages?: string[];
}

export function ArtisanCard({ id, name, category, daira, phone, rating, reviews, priceStart, yearsOfExperience = 0, image, isVerified, portfolioImages = [] }: ArtisanCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <Card className="overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(var(--primary-rgb),0.25)] transition-all duration-700 border-white/10 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-3xl rounded-[3rem] relative flex flex-col h-full hover:-translate-y-2 ring-1 ring-white/20 hover:ring-primary/40">
      <div className="relative h-72 overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-700" />
        
        <div className={`absolute top-6 ${isRtl ? 'right-6' : 'left-6'} flex flex-col gap-3 z-20`}>
          <Badge className="bg-primary/20 hover:bg-primary/30 text-primary backdrop-blur-2xl border border-primary/20 shadow-2xl font-black px-4 py-1.5 rounded-2xl text-xs uppercase tracking-wider">
            {category}
          </Badge>
          {isVerified && (
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-500/20 text-green-400 text-[10px] px-3 py-1.5 rounded-2xl flex items-center gap-2 backdrop-blur-2xl border border-green-500/30 shadow-2xl font-black"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{t('artisans.verified')}</span>
            </motion.div>
          )}
        </div>
        
        <div className={`absolute bottom-6 ${isRtl ? 'left-6' : 'right-6'} flex flex-col items-end gap-2 z-20`}>
          <div className="flex items-center gap-2 bg-amber-400/20 text-amber-400 px-3 py-1.5 rounded-2xl border border-amber-400/30 backdrop-blur-2xl shadow-2xl font-black text-xs">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{rating}</span>
          </div>
          <span className="text-[10px] text-white/70 font-black bg-black/40 backdrop-blur-2xl px-3 py-1 rounded-xl border border-white/10">{reviews} {isRtl ? 'تقييم' : 'reviews'}</span>
        </div>

        {portfolioImages.length > 0 && (
          <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} bg-white/5 hover:bg-white/10 text-white text-[10px] px-3 py-1.5 rounded-2xl flex items-center gap-2 backdrop-blur-2xl border border-white/10 transition-all duration-300 z-20`}>
            <ImageIcon className="w-4 h-4" />
            <span className="font-black">{portfolioImages.length} {isRtl ? 'صورة' : 'photos'}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-8 flex-1 flex flex-col relative">
        <div className="space-y-5 mb-8">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-heading font-black text-3xl tracking-tight group-hover:text-primary transition-colors duration-500 line-clamp-1 leading-tight">{name}</h3>
            <div className="flex items-center gap-2">
              <a 
                href={`tel:${phone}`} 
                className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-xl hover:shadow-primary/30 z-10 active:scale-90"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center text-muted-foreground/90 font-black text-sm group/loc">
              <div className="p-1.5 rounded-lg bg-primary/5 mr-2 group-hover/loc:bg-primary/10 transition-colors">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              {daira}
            </div>
            <div className="flex items-center text-muted-foreground/90 font-black text-sm group/phone">
              <div className="p-1.5 rounded-lg bg-primary/5 mr-2 group-hover/phone:bg-primary/10 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              {phone}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="flex flex-col p-4 rounded-[2rem] bg-white/5 border border-white/10 transition-all duration-500 group-hover:bg-primary/5 group-hover:border-primary/20 shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">{t('artisans.start_price')}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-primary text-2xl tracking-tighter">{priceStart}</span>
              <span className="text-[10px] font-black text-primary/60">دج</span>
            </div>
          </div>
          <div className="flex flex-col p-4 rounded-[2rem] bg-white/5 border border-white/10 transition-all duration-500 group-hover:bg-secondary/5 group-hover:border-secondary/20 shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">{t('artisans.experience')}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-foreground text-2xl tracking-tighter">{yearsOfExperience}</span>
              <span className="text-[10px] font-black text-muted-foreground/60">{t('artisans.years')}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-8 pb-8 pt-0">
        <Link href={`/profile/${id}`} className="w-full">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.95] font-black transition-all duration-500 h-14 rounded-[1.5rem] text-lg group/btn border-t border-white/20">
            {t('artisans.view_profile')}
            <motion.span 
              animate={{ x: isRtl ? [-4, 0, -4] : [4, 0, 4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`inline-block ${isRtl ? 'rotate-180 mr-3' : 'ml-3'}`}
            >
              →
            </motion.span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
