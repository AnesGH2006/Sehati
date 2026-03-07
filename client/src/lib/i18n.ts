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
          "common": {
            "back_home": "العودة للرئيسية",
            "save": "حفظ",
            "cancel": "إلغاء",
            "submit": "إرسال",
            "loading": "جاري التحميل..."
          },
          "nav": {
            "home": "الرئيسية",
            "artisans": "الحرفيين",
            "subscriptions": "الاشتراكات",
            "about": "من نحن",
            "chat": "المحادثات",
            "login": "تسجيل الدخول",
            "join": "انضم كحرفي",
            "night_mode": "الوضع الليلي",
            "language": "اللغة"
          },
          "hero": {
            "title": "اعثر على أمهر الحرفيين في الجزائر",
            "subtitle": "منصة تجمع بين الخبرة والإتقان. تصفح مئات الحرفيين، قارن الأسعار، وتواصل مباشرة."
          },
          "usage": {
            "title": "كيفية الاستخدام",
            "subtitle": "خطوات بسيطة للوصول إلى أفضل الخدمات الحرفية في الجزائر",
            "step1_title": "تصفح الحرفيين",
            "step1_desc": "ادخل إلى صفحة الحرفيين واستخدم الفلاتر لاختيار التخصص والمنطقة.",
            "step2_title": "قارن واطلع",
            "step2_desc": "شاهد الملفات الشخصية، سنوات الخبرة، ومعرض الأعمال لكل حرفي.",
            "step3_title": "تواصل مباشرة",
            "step3_desc": "افتح محادثة فورية للاتفاق على الموعد والسعر بكل سهولة."
          },
          "artisans": {
            "title": "جميع الحرفيين",
            "count": "عرض {{count}} حرفي متاح في الجزائر",
            "filter_title": "تصفية متقدمة",
            "filter_subtitle": "اعثر على الحرفي المناسب",
            "search_name": "بحث بالاسم...",
            "category": "التصنيف",
            "location": "المنطقة (الدائرة)",
            "max_price": "السعر الأقصى",
            "reset": "إعادة تعيين الكل",
            "no_results": "لا يوجد حرفيين يطابقون خيارات البحث حالياً.",
            "reset_filters": "إعادة تعيين الفلاتر",
            "view_profile": "عرض الملف الشخصي",
            "start_price": "يبدأ السعر من",
            "experience": "الخبرة",
            "years": "سنوات",
            "verified": "موثوق",
            "works": "أعمال"
          },
          "subscription": {
            "title": "اختر باقتك المهنية",
            "subtitle": "حلول مرنة تناسب طموحك وتساعدك على النمو في السوق الجزائري",
            "plan_starter": "Starter",
            "plan_standard": "Standard",
            "plan_pro": "Pro",
            "price_free": "مجاناً",
            "price_standard": "1500 دج",
            "price_pro": "3000 دج",
            "duration_forever": "للأبد",
            "duration_month": "/ شهر",
            "features": "المميزات:",
            "feat_profile": "ملف شخصي احترافي",
            "feat_portfolio": "معرض أعمال (5 صور)",
            "feat_portfolio_unlimited": "معرض أعمال غير محدود",
            "feat_chat": "تواصل مع الزبائن",
            "feat_search_basic": "ظهور عادي في البحث",
            "feat_search_priority": "ظهور ذو أولوية في ولايتك",
            "feat_search_top": "تصدر نتائج البحث وطنيًا",
            "feat_badge_verified": "شارة توثيق فضية",
            "feat_badge_gold": "شارة توثيق ذهبية VIP",
            "feat_stats": "إحصائيات الزوار",
            "feat_support_basic": "دعم فني عبر البريد",
            "feat_support_priority": "دعم فني ذو أولوية",
            "feat_ads": "ترويج ممول لأعمالك",
            "feat_sms": "تنبيهات SMS فورية",
            "subscribe_now": "اختر الخطة",
            "under_review": "اشتراكك تحت المراجعة",
            "review_desc": "شكراً لثقتك بنا. نقوم حالياً بمراجعة طلبك. سيتم تفعيل حسابك الحرفي خلال 24 ساعة كحد أقصى.",
            "form_title": "التسجيل كحرفي - باقة {{plan}}",
            "full_name": "الاسم الكامل",
            "email": "البريد الإلكتروني",
            "price_start": "سعر الخدمة يبدأ من (دج)",
            "exp_years": "سنوات الخبرة",
            "category_label": "الحرفة",
            "category_placeholder": "اختر الحرفة",
            "portfolio": "معرض الصور (أعمالك السابقة)",
            "portfolio_select": "اختر صور أعمالك",
            "portfolio_count": "تم اختيار {{count}} صور",
            "submit_join": "إرسال طلب الانضمام"
          },
          "footer": {
            "rights": "جميع الحقوق محفوظة",
            "about": "من نحن",
            "contact": "اتصل بنا",
            "privacy": "سياسة الخصوصية"
          }
        }
      },
      fr: {
        translation: {
          "common": {
            "back_home": "Retour à l'accueil",
            "save": "Enregistrer",
            "cancel": "Annuler",
            "submit": "Envoyer",
            "loading": "Chargement..."
          },
          "nav": {
            "home": "Accueil",
            "artisans": "Artisans",
            "subscriptions": "Abonnements",
            "about": "À propos",
            "chat": "Chat",
            "login": "Connexion",
            "join": "Devenir Artisan",
            "night_mode": "Mode Nuit",
            "language": "Langue"
          },
          "hero": {
            "title": "Trouvez les meilleurs artisans en Algérie",
            "subtitle": "Une plateforme alliant expertise et maîtrise. Parcourez des centaines d'artisans, comparez les prix et communiquez directement."
          },
          "usage": {
            "title": "Comment ça marche",
            "subtitle": "Des étapes simples pour accéder aux meilleurs services artisanaux en Algérie",
            "step1_title": "Parcourir les artisans",
            "step1_desc": "Accédez à la page des artisans et utilisez les filtres pour choisir la spécialité et la région.",
            "step2_title": "Comparer et consulter",
            "step2_desc": "Consultez les profils, les années d'expérience et la galerie de photos de chaque artisan.",
            "step3_title": "Communiquer directement",
            "step3_desc": "Ouvrez un chat instantané pour convenir facilement du rendez-vous et du prix."
          },
          "artisans": {
            "title": "Tous les Artisans",
            "count": "{{count}} artisans disponibles en Algérie",
            "filter_title": "Filtrage Avancé",
            "filter_subtitle": "Trouvez l'artisan idéal",
            "search_name": "Rechercher par nom...",
            "category": "Catégorie",
            "location": "Région (Daira)",
            "max_price": "Prix Maximum",
            "reset": "Réinitialiser tout",
            "no_results": "Aucun artisan ne correspond à votre recherche actuellement.",
            "reset_filters": "Réinitialiser les filtres",
            "view_profile": "Voir le profil",
            "start_price": "Prix à partir de",
            "experience": "Expérience",
            "years": "ans",
            "verified": "Vérifié",
            "works": "travaux"
          },
          "subscription": {
            "title": "Choisissez votre forfait professionnel",
            "subtitle": "Des solutions flexibles adaptées à vos ambitions pour croître sur le marché algérien",
            "plan_starter": "Starter",
            "plan_standard": "Standard",
            "plan_pro": "Pro",
            "price_free": "Gratuit",
            "price_standard": "1500 DA",
            "price_pro": "3000 DA",
            "duration_forever": "À vie",
            "duration_month": "/ mois",
            "features": "Caractéristiques :",
            "feat_profile": "Profil professionnel",
            "feat_portfolio": "Portfolio (5 photos)",
            "feat_portfolio_unlimited": "Portfolio illimité",
            "feat_chat": "Contact avec les clients",
            "feat_search_basic": "Visibilité standard",
            "feat_search_priority": "Visibilité prioritaire dans votre wilaya",
            "feat_search_top": "Top des résultats au niveau national",
            "feat_badge_verified": "Badge de vérification Argent",
            "feat_badge_gold": "Badge de vérification Or VIP",
            "feat_stats": "Statistiques des visiteurs",
            "feat_support_basic": "Support par email",
            "feat_support_priority": "Support prioritaire",
            "feat_ads": "Promotion sponsorisée de vos travaux",
            "feat_sms": "Alertes SMS instantanées",
            "subscribe_now": "Choisir ce plan",
            "under_review": "Abonnement en cours de révision",
            "review_desc": "Merci de votre confiance. Nous vérifions votre demande. Votre compte sera activé sous 24h maximum.",
            "form_title": "S'inscrire comme Artisan - Plan {{plan}}",
            "full_name": "Nom complet",
            "email": "Email",
            "price_start": "Prix de service à partir de (DA)",
            "exp_years": "Années d'expérience",
            "category_label": "Métier",
            "category_placeholder": "Choisir le métier",
            "portfolio": "Portfolio (travaux précédents)",
            "portfolio_select": "Choisir vos photos",
            "portfolio_count": "{{count}} photos sélectionnées",
            "submit_join": "Envoyer la demande"
          },
          "footer": {
            "rights": "Tous droits réservés",
            "about": "À propos",
            "contact": "Contact",
            "privacy": "Confidentialité"
          }
        }
      },
      en: {
        translation: {
          "common": {
            "back_home": "Back to Home",
            "save": "Save",
            "cancel": "Cancel",
            "submit": "Submit",
            "loading": "Loading..."
          },
          "nav": {
            "home": "Home",
            "artisans": "Artisans",
            "subscriptions": "Subscriptions",
            "about": "About Us",
            "chat": "Chat",
            "login": "Login",
            "join": "Join as Artisan",
            "night_mode": "Night Mode",
            "language": "Language"
          },
          "hero": {
            "title": "Find the best artisans in Algeria",
            "subtitle": "A platform combining expertise and mastery. Browse hundreds of artisans, compare prices, and communicate directly."
          },
          "usage": {
            "title": "How it Works",
            "subtitle": "Simple steps to access the best artisan services in Algeria",
            "step1_title": "Browse Artisans",
            "step1_desc": "Go to the artisans page and use filters to select specialty and area.",
            "step2_title": "Compare and View",
            "step2_desc": "View profiles, years of experience, and portfolio for each artisan.",
            "step3_title": "Direct Contact",
            "step3_desc": "Open an instant chat to easily agree on appointment and price."
          },
          "artisans": {
            "title": "All Artisans",
            "count": "Showing {{count}} artisans available in Algeria",
            "filter_title": "Advanced Filters",
            "filter_subtitle": "Find the right artisan",
            "search_name": "Search by name...",
            "category": "Category",
            "location": "Location (Daira)",
            "max_price": "Max Price",
            "reset": "Reset All",
            "no_results": "No artisans match your search at the moment.",
            "reset_filters": "Reset Filters",
            "view_profile": "View Profile",
            "start_price": "Price starts from",
            "experience": "Experience",
            "years": "years",
            "verified": "Verified",
            "works": "works"
          },
          "subscription": {
            "title": "Choose your professional plan",
            "subtitle": "Flexible solutions tailored to your ambitions to grow in the Algerian market",
            "plan_starter": "Starter",
            "plan_standard": "Standard",
            "plan_pro": "Pro",
            "price_free": "Free",
            "price_standard": "1500 DA",
            "price_pro": "3000 DA",
            "duration_forever": "Lifetime",
            "duration_month": "/ month",
            "features": "Features:",
            "feat_profile": "Professional profile",
            "feat_portfolio": "Portfolio (5 photos)",
            "feat_portfolio_unlimited": "Unlimited portfolio",
            "feat_chat": "Contact with customers",
            "feat_search_basic": "Standard visibility",
            "feat_search_priority": "Priority visibility in your wilaya",
            "feat_search_top": "Top of search results nationwide",
            "feat_badge_verified": "Silver verification badge",
            "feat_badge_gold": "Gold VIP verification badge",
            "feat_stats": "Visitor statistics",
            "feat_support_basic": "Email support",
            "feat_support_priority": "Priority support",
            "feat_ads": "Sponsored promotion of your works",
            "feat_sms": "Instant SMS alerts",
            "subscribe_now": "Choose this plan",
            "under_review": "Subscription Under Review",
            "review_desc": "Thank you for your trust. We are reviewing your request. Your account will be activated within 24 hours.",
            "form_title": "Join as Artisan - {{plan}} Plan",
            "full_name": "Full Name",
            "email": "Email",
            "price_start": "Price starts from (DA)",
            "exp_years": "Years of Experience",
            "category_label": "Craft",
            "category_placeholder": "Select craft",
            "portfolio": "Portfolio (previous works)",
            "portfolio_select": "Select work images",
            "portfolio_count": "{{count}} images selected",
            "submit_join": "Submit Request"
          },
          "footer": {
            "rights": "All rights reserved",
            "about": "About Us",
            "contact": "Contact Us",
            "privacy": "Privacy Policy"
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
