import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: {
          "nav": {
            "home": "الرئيسية",
            "artisans": "الحرفيين",
            "subscriptions": "الاشتراكات",
            "chat": "المحادثات"
          },
          "hero": {
            "title": "اعثر على أمهر الحرفيين في تيارت",
            "subtitle": "منصة تجمع بين الخبرة والإتقان. تصفح مئات الحرفيين، قارن الأسعار، وتواصل مباشرة."
          }
        }
      },
      fr: {
        translation: {
          "nav": {
            "home": "Accueil",
            "artisans": "Artisans",
            "subscriptions": "Abonnements",
            "chat": "Chat"
          },
          "hero": {
            "title": "Trouvez les meilleurs artisans à Tiaret",
            "subtitle": "Une plateforme alliant expertise et maîtrise. Parcourez des centaines d'artisans, comparez les prix et communiquez directement."
          }
        }
      },
      en: {
        translation: {
          "nav": {
            "home": "Home",
            "artisans": "Artisans",
            "subscriptions": "Subscriptions",
            "chat": "Chat"
          },
          "hero": {
            "title": "Find the best artisans in Tiaret",
            "subtitle": "A platform combining expertise and mastery. Browse hundreds of artisans, compare prices, and communicate directly."
          }
        }
      }
    },
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
