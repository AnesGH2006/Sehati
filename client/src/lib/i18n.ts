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
            "chat": "المحادثات",
            "login": "تسجيل الدخول",
            "join": "انضم كحرفي"
          },
          "hero": {
            "title": "اعثر على أمهر الحرفيين في تيارت",
            "subtitle": "منصة تجمع بين الخبرة والإتقان. تصفح مئات الحرفيين، قارن الأسعار، وتواصل مباشرة.",
            "search_placeholder": "ماذا تبحث؟",
            "daira_placeholder": "اختر الدائرة",
            "search_btn": "بحث"
          },
          "usage": {
            "title": "كيفية الاستخدام",
            "subtitle": "خطوات بسيطة للوصول إلى أفضل الخدمات الحرفية في تيارت",
            "step1_title": "تصفح الحرفيين",
            "step1_desc": "ادخل إلى صفحة الحرفيين واستخدم الفلاتر لاختيار التخصص والمنطقة.",
            "step2_title": "قارن واطلع",
            "step2_desc": "شاهد الملفات الشخصية، سنوات الخبرة، ومعرض الأعمال لكل حرفي.",
            "step3_title": "تواصل مباشرة",
            "step3_desc": "افتح محادثة فورية للاتفاق على الموعد والسعر بكل سهولة."
          },
          "artisans": {
            "title": "جميع الحرفيين",
            "count": "عرض {{count}} حرفي متاح في تيارت",
            "filter_title": "تصفية متقدمة",
            "filter_subtitle": "اعثر على الحرفي المناسب",
            "search_name": "بحث بالاسم...",
            "category": "التصنيف",
            "location": "المنطقة (الدائرة)",
            "max_price": "السعر الأقصى",
            "reset": "إعادة تعيين الكل",
            "no_results": "لا يوجد حرفيين يطابقون خيارات البحث حالياً.",
            "reset_filters": "إعادة تعيين الفلاتر"
          }
        }
      },
      fr: {
        translation: {
          "nav": {
            "home": "Accueil",
            "artisans": "Artisans",
            "subscriptions": "Abonnements",
            "chat": "Chat",
            "login": "Connexion",
            "join": "Devenir Artisan"
          },
          "hero": {
            "title": "Trouvez les meilleurs artisans à Tiaret",
            "subtitle": "Une plateforme alliant expertise et maîtrise. Parcourez des centaines d'artisans, comparez les prix et communiquez directement.",
            "search_placeholder": "Que cherchez-vous ?",
            "daira_placeholder": "Choisir la Daira",
            "search_btn": "Rechercher"
          },
          "usage": {
            "title": "Comment ça marche",
            "subtitle": "Des étapes simples pour accéder aux meilleurs services artisanaux à Tiaret",
            "step1_title": "Parcourir les artisans",
            "step1_desc": "Accédez à la page des artisans et utilisez les filtres pour choisir la spécialité et la région.",
            "step2_title": "Comparer et consulter",
            "step2_desc": "Consultez les profils, les années d'expérience et la galerie de photos de chaque artisan.",
            "step3_title": "Communiquer directement",
            "step3_desc": "Ouvrez un chat instantané pour convenir facilement du rendez-vous et du prix."
          },
          "artisans": {
            "title": "Tous les Artisans",
            "count": "{{count}} artisans disponibles à Tiaret",
            "filter_title": "Filtrage Avancé",
            "filter_subtitle": "Trouvez l'artisan idéal",
            "search_name": "Rechercher par nom...",
            "category": "Catégorie",
            "location": "Région (Daira)",
            "max_price": "Prix Maximum",
            "reset": "Réinitialiser tout",
            "no_results": "Aucun artisan ne correspond à votre recherche actuellement.",
            "reset_filters": "Réinitialiser les filtres"
          }
        }
      },
      en: {
        translation: {
          "nav": {
            "home": "Home",
            "artisans": "Artisans",
            "subscriptions": "Subscriptions",
            "chat": "Chat",
            "login": "Login",
            "join": "Join as Artisan"
          },
          "hero": {
            "title": "Find the best artisans in Tiaret",
            "subtitle": "A platform combining expertise and mastery. Browse hundreds of artisans, compare prices, and communicate directly.",
            "search_placeholder": "What are you looking for?",
            "daira_placeholder": "Select Daira",
            "search_btn": "Search"
          },
          "usage": {
            "title": "How it Works",
            "subtitle": "Simple steps to access the best artisan services in Tiaret",
            "step1_title": "Browse Artisans",
            "step1_desc": "Go to the artisans page and use filters to select specialty and area.",
            "step2_title": "Compare and View",
            "step2_desc": "View profiles, years of experience, and portfolio for each artisan.",
            "step3_title": "Direct Contact",
            "step3_desc": "Open an instant chat to easily agree on appointment and price."
          },
          "artisans": {
            "title": "All Artisans",
            "count": "Showing {{count}} artisans available in Tiaret",
            "filter_title": "Advanced Filters",
            "filter_subtitle": "Find the right artisan",
            "search_name": "Search by name...",
            "category": "Category",
            "location": "Location (Daira)",
            "max_price": "Max Price",
            "reset": "Reset All",
            "no_results": "No artisans match your search at the moment.",
            "reset_filters": "Reset Filters"
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
