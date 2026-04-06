import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <footer className="bg-muted/30 border-t pt-12 pb-6">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-2 justify-start">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                ح
              </div>
              <span className="text-xl font-bold font-heading text-primary">حرفتي</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          <div className="text-right">
            <h3 className="font-heading font-bold text-lg mb-4">{t('nav.home')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/"><span className="hover:text-primary transition-colors cursor-pointer">{t('nav.home')}</span></Link></li>
              <li><Link href="/artisans"><span className="hover:text-primary transition-colors cursor-pointer">{t('nav.artisans')}</span></Link></li>
              <li><Link href="/subscription"><span className="hover:text-primary transition-colors cursor-pointer">{t('nav.subscriptions')}</span></Link></li>
              <li><Link href="/about"><span className="hover:text-primary transition-colors cursor-pointer">{t('footer.about')}</span></Link></li>
            </ul>
          </div>

          <div className="text-right">
            <h3 className="font-heading font-bold text-lg mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-start">
                <MapPin className="h-4 w-4 text-primary" />
                <span>الجزائر</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <Phone className="h-4 w-4 text-primary" />
                <span>+213 0538200828</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <Mail className="h-4 w-4 text-primary" />
                <span>alaagh23dz@gmail.com</span>
              </li>
            </ul>
          </div>

          <div className="text-right">
            <h3 className="font-heading font-bold text-lg mb-4">{t('footer.rights')}</h3>
            <div className="flex gap-4 justify-start">
              <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:text-primary hover:shadow-md transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="Instagram.com/alaagh23alg" className="bg-white p-2 rounded-full shadow-sm hover:text-primary hover:shadow-md transition-all">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} حرفتي. {t('footer.rights')}.</p>
        </div>
      </div>
    </footer>
  );
}
