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
    <Card className="overflow-hidden group hover:shadow-[0_20px_60px_rgba(var(--primary-rgb),0.2)] transition-all duration-500 border-border/40 bg-card/40 backdrop-blur-2xl rounded-[2.5rem] relative flex flex-col h-full">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-60 transition-opacity duration-500" />
        
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex flex-col gap-2`}>
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-none shadow-lg font-bold px-3 py-1 text-xs">
            {category}
          </Badge>
          {isVerified && (
            <div className="bg-green-500 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl font-bold">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>{t('artisans.verified')}</span>
            </div>
          )}
        </div>
        
        <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'} flex flex-col items-end gap-1.5`}>
          <div className="flex items-center gap-1.5 bg-amber-400 text-black px-2.5 py-1 rounded-lg shadow-lg font-bold text-xs">
            <Star className="w-3.5 h-3.5 fill-black" />
            <span>{rating}</span>
          </div>
          <span className="text-[10px] text-white/90 font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">{reviews} {isRtl ? 'تقييم' : 'reviews'}</span>
        </div>

        {portfolioImages.length > 0 && (
          <div className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} bg-white/10 hover:bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-colors`}>
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="font-bold">{portfolioImages.length} {isRtl ? 'صورة' : 'photos'}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="space-y-3 mb-6">
          <h3 className="font-heading font-bold text-2xl tracking-tight group-hover:text-primary transition-colors duration-300 line-clamp-1">{name}</h3>
          <div className="flex items-center text-muted-foreground/80 font-bold text-sm">
            <MapPin className={`w-4 h-4 text-primary ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
            {daira}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="flex flex-col p-3 rounded-2xl bg-muted/50 border border-border/50 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('artisans.start_price')}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-primary text-lg">{priceStart}</span>
              <span className="text-[10px] font-bold text-primary/70">دج</span>
            </div>
          </div>
          <div className="flex flex-col p-3 rounded-2xl bg-muted/50 border border-border/50 transition-colors group-hover:bg-secondary/5 group-hover:border-secondary/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('artisans.experience')}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-foreground text-lg">{yearsOfExperience}</span>
              <span className="text-[10px] font-bold text-muted-foreground">{t('artisans.years')}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Link href={`/profile/${id}`} className="w-full">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] font-bold transition-all h-12 rounded-2xl text-base group/btn">
            {t('artisans.view_profile')}
            <span className={`inline-block transition-transform group-hover/btn:translate-x-1 ${isRtl ? 'rotate-180 mr-2' : 'ml-2'}`}>→</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
