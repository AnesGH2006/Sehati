import { Star, MapPin, BadgeCheck, Briefcase, Banknote, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface ArtisanCardProps {
  id: number;
  name: string;
  category: string;
  daira: string;
  rating: number;
  reviews: number;
  priceStart: number;
  yearsOfExperience?: number;
  image: string;
  isVerified: boolean;
  portfolioImages?: string[];
}

export function ArtisanCard({ id, name, category, daira, rating, reviews, priceStart, yearsOfExperience = 0, image, isVerified, portfolioImages = [] }: ArtisanCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <Card className="overflow-hidden group hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.15)] transition-all duration-500 border-border/40 bg-card/40 backdrop-blur-2xl rounded-[2.5rem] relative">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        
        <Badge className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} bg-primary/90 text-primary-foreground backdrop-blur-md border-none shadow-lg font-bold px-3 py-1`}>
          {category}
        </Badge>
        
        {isVerified && (
          <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} bg-green-500 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl font-bold animate-pulse`}>
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>{t('artisans.verified')}</span>
          </div>
        )}

        {portfolioImages.length > 0 && (
          <div className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} bg-white/20 hover:bg-white/30 text-white text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-xl border border-white/10 transition-colors`}>
            <ImageIcon className="w-4 h-4" />
            <span className="font-medium">+{portfolioImages.length} {t('artisans.works')}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 text-right">
            <h3 className="font-heading font-bold text-2xl tracking-tight group-hover:text-primary transition-colors duration-300">{name}</h3>
            <div className="flex items-center text-muted-foreground font-medium text-sm">
              <div className={`bg-primary/10 p-1 rounded-md ${isRtl ? 'ml-2' : 'mr-2'}`}>
                <MapPin className="w-3.5 h-3.5 text-primary" />
              </div>
              {daira}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/40 shadow-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-base text-amber-700 dark:text-amber-400">{rating}</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/80">{reviews} مراجعة</span>
          </div>
        </div>
        
        <div className={`grid grid-cols-2 gap-4 py-4 border-y border-dashed border-primary/20 bg-primary/5 rounded-2xl px-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-background rounded-xl shadow-sm">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('artisans.start_price')}</span>
              <span className="font-black text-primary text-base">{priceStart} دج</span>
            </div>
          </div>
          <div className={`flex items-center gap-3 border-r border-dashed border-primary/20 pr-4`}>
            <div className="p-2 bg-white dark:bg-background rounded-xl shadow-sm">
              <Briefcase className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('artisans.experience')}</span>
              <span className="font-black text-secondary-foreground text-base">{yearsOfExperience} {t('artisans.years')}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Link href={`/profile/${id}`} className="w-full">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] font-bold transition-all h-12 rounded-xl shadow-lg shadow-primary/25 text-base">
            {t('artisans.view_profile')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
