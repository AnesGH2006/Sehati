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
            "chat": "المحادثات",
            "login": "تسجيل الدخول",
            "join": "انضم كحرفي",
            "night_mode": "الوضع الليلي",
            "language": "اللغة"
          },
          "hero": {
            "title": "اعثر على أمهر الحرفيين في تيارت",
            "subtitle": "منصة تجمع بين الخبرة والإتقان. تصفح مئات الحرفيين، قارن الأسعار، وتواصل مباشرة."
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
            "reset_filters": "إعادة تعيين الفلاتر",
            "view_profile": "عرض الملف الشخصي",
            "start_price": "يبدأ السعر من",
            "experience": "الخبرة",
            "years": "سنوات",
            "verified": "موثوق",
            "works": "أعمال"
          },
          "subscription": {
            "title": "باقة الحرفي المتميز",
            "subtitle": "خطة واحدة بسيطة وشاملة لنمو نشاطك في تيارت",
            "plan_name": "حرفي محترف",
            "plan_desc": "كل ما تحتاجه للنجاح في منصة حرفتي",
            "duration": "اختر مدة الاشتراك:",
            "month": "شهر واحد",
            "3months": "3 أشهر",
            "6months": "6 أشهر",
            "price_1": "4000 دج",
            "price_3": "11,000 دج",
            "price_6": "20,000 دج",
            "features": "مميزات الباقة:",
            "feat_profile": "ملف شخصي احترافي كامل",
            "feat_portfolio": "معرض أعمال غير محدود الصور",
            "feat_chat": "تواصل مباشر مع الزبائن",
            "feat_search": "ظهور مميز في نتائج البحث",
            "feat_stats": "إحصائيات لزيارات ملفك",
            "feat_support": "دعم فني مخصص",
            "subscribe_now": "اشترك الآن",
            "under_review": "اشتراكك تحت المراجعة",
            "review_desc": "شكراً لثقتك بنا. نقوم حالياً بمراجعة وصل الدفع الخاص بك. سيتم تفعيل حسابك الحرفي خلال 24 ساعة كحد أقصى.",
            "form_title": "التسجيل كحرفي - باقة {{plan}}",
            "form_desc": "أدخل معلوماتك المهنية وارفع وصل الدفع لتفعيل حسابك.",
            "full_name": "الاسم الكامل",
            "email": "البريد الإلكتروني",
            "price_start": "سعر الخدمة يبدأ من (دج)",
            "exp_years": "سنوات الخبرة",
            "category_label": "الحرفة",
            "category_placeholder": "اختر الحرفة",
            "daira_label": "الدائرة",
            "daira_placeholder": "اختر الدائرة",
            "portfolio": "معرض الصور (أعمالك السابقة)",
            "portfolio_select": "اختر صور أعمالك",
            "portfolio_count": "تم اختيار {{count}} صور",
            "receipt": "وصل الدفع (CCP / Baridimob)",
            "receipt_upload": "ارفع صورة الوصل",
            "receipt_hint": "يمكنك الدفع عبر Baridimob أو مكتب البريد CCP",
            "submit_join": "إرسال طلب الانضمام"
          },
          "footer": {
            "rights": "جميع الحقوق محفوظة",
            "about": "حول حرفتي",
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
            "chat": "Chat",
            "login": "Connexion",
            "join": "Devenir Artisan",
            "night_mode": "Mode Nuit",
            "language": "Langue"
          },
          "hero": {
            "title": "Trouvez les meilleurs artisans à Tiaret",
            "subtitle": "Une plateforme alliant expertise et maîtrise. Parcourez des centaines d'artisans, comparez les prix et communiquez directement."
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
            "reset_filters": "Réinitialiser les filtres",
            "view_profile": "Voir le profil",
            "start_price": "Prix à partir de",
            "experience": "Expérience",
            "years": "ans",
            "verified": "Vérifié",
            "works": "travaux"
          },
          "subscription": {
            "title": "Forfait Artisan Premium",
            "subtitle": "Un plan simple et complet pour faire croître votre activité à Tiaret",
            "plan_name": "Artisan Pro",
            "plan_desc": "Tout ce dont vous avez besoin pour réussir sur Herfati",
            "duration": "Choisissez la durée :",
            "month": "1 mois",
            "3months": "3 mois",
            "6months": "6 mois",
            "price_1": "4000 DA",
            "price_3": "11,000 DA",
            "price_6": "20,000 DA",
            "features": "Avantages du forfait :",
            "feat_profile": "Profil professionnel complet",
            "feat_portfolio": "Galerie photos illimitée",
            "feat_chat": "Communication directe avec les clients",
            "feat_search": "Visibilité prioritaire",
            "feat_stats": "Statistiques de visite",
            "feat_support": "Support technique dédié",
            "subscribe_now": "S'abonner maintenant",
            "under_review": "Abonnement en cours de révision",
            "review_desc": "Merci de votre confiance. Nous vérifions votre reçu de paiement. Votre compte sera activé sous 24h maximum.",
            "form_title": "S'inscrire comme Artisan - Plan {{plan}}",
            "form_desc": "Entrez vos informations professionnelles et téléchargez le reçu pour activer votre compte.",
            "full_name": "Nom complet",
            "email": "Email",
            "price_start": "Prix de service à partir de (DA)",
            "exp_years": "Années d'expérience",
            "category_label": "Métier",
            "category_placeholder": "Choisir le métier",
            "daira_label": "Daira",
            "daira_placeholder": "Choisir la daira",
            "portfolio": "Portfolio (travaux précédents)",
            "portfolio_select": "Choisir vos photos",
            "portfolio_count": "{{count}} photos sélectionnées",
            "receipt": "Reçu de paiement (CCP / Baridimob)",
            "receipt_upload": "Télécharger le reçu",
            "receipt_hint": "Paiement via Baridimob ou bureau de poste CCP",
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
            "chat": "Chat",
            "login": "Login",
            "join": "Join as Artisan",
            "night_mode": "Night Mode",
            "language": "Language"
          },
          "hero": {
            "title": "Find the best artisans in Tiaret",
            "subtitle": "A platform combining expertise and mastery. Browse hundreds of artisans, compare prices, and communicate directly."
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
            "reset_filters": "Reset Filters",
            "view_profile": "View Profile",
            "start_price": "Price starts from",
            "experience": "Experience",
            "years": "years",
            "verified": "Verified",
            "works": "works"
          },
          "subscription": {
            "title": "Premium Artisan Plan",
            "subtitle": "A simple and comprehensive plan to grow your business in Tiaret",
            "plan_name": "Artisan Pro",
            "plan_desc": "Everything you need to succeed on Herfati",
            "duration": "Choose duration:",
            "month": "1 Month",
            "3months": "3 Months",
            "6months": "6 Months",
            "price_1": "4000 DA",
            "price_3": "11,000 DA",
            "price_6": "20,000 DA",
            "features": "Plan Features:",
            "feat_profile": "Full professional profile",
            "feat_portfolio": "Unlimited portfolio images",
            "feat_chat": "Direct customer communication",
            "feat_search": "Priority search results",
            "feat_stats": "Profile visit statistics",
            "feat_support": "Dedicated technical support",
            "subscribe_now": "Subscribe Now",
            "under_review": "Subscription Under Review",
            "review_desc": "Thank you for your trust. We are reviewing your payment receipt. Your account will be activated within 24 hours.",
            "form_title": "Join as Artisan - {{plan}} Plan",
            "form_desc": "Enter your professional details and upload payment receipt to activate.",
            "full_name": "Full Name",
            "email": "Email",
            "price_start": "Price starts from (DA)",
            "exp_years": "Years of Experience",
            "category_label": "Craft",
            "category_placeholder": "Select craft",
            "daira_label": "Daira",
            "daira_placeholder": "Select daira",
            "portfolio": "Portfolio (previous works)",
            "portfolio_select": "Select work images",
            "portfolio_count": "{{count}} images selected",
            "receipt": "Payment Receipt (CCP / Baridimob)",
            "receipt_upload": "Upload Receipt",
            "receipt_hint": "Payment via Baridimob or CCP post office",
            "submit_join": "Submit Request"
          },
          "footer": {
            "rights": "All rights reserved",
            "about": "About",
            "contact": "Contact",
            "privacy": "Privacy"
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
