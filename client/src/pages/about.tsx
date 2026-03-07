import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Shield, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full py-40 md:py-56 overflow-hidden bg-[#050505] text-white flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[140px]" />
          </div>
          
          <div className="container max-w-[1920px] px-6 relative z-10 text-center" dir={isRtl ? "rtl" : "ltr"}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl mx-auto"
            >
              <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-heading font-black tracking-tighter mb-10 bg-gradient-to-l from-white via-white to-white/40 bg-clip-text text-transparent leading-[1] transition-all">
                {isRtl ? "من نحن؟" : "Who we are?"} <span className="text-primary italic">حرفتي</span>
              </h1>
              <p className="text-2xl md:text-4xl text-muted-foreground font-medium max-w-4xl mx-auto leading-relaxed opacity-80">
                {isRtl 
                  ? "نحن منصة جزائرية 100% تهدف إلى إحياء الصناعات التقليدية والحرف اليدوية، من خلال ربط الحرفيين المبدعين بالزبائن مباشرة."
                  : "We are a 100% Algerian platform aiming to revive traditional industries and handicrafts by connecting creative artisans directly with customers."}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-32 w-full flex justify-center" dir={isRtl ? "rtl" : "ltr"}>
          <div className="container max-w-[1920px] px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-[1600px] mx-auto">
              <motion.div
                initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <h2 className="text-5xl md:text-6xl font-heading font-black text-foreground">
                  {isRtl ? "رؤيتنا وأهدافنا" : "Our Vision & Goals"}
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                  {isRtl 
                    ? "في \"حرفتي\"، نؤمن بأن الحرفي الجزائري يمتلك مهارات استثنائية تستحق أن تظهر للعالم. هدفنا هو القضاء على الوسطاء وتوفير منصة مجانية بالكامل تضمن للحرفي حقه وللزبون الجودة والمصداقية."
                    : "At Herfati, we believe that Algerian artisans possess exceptional skills that deserve to be shown to the world. Our goal is to eliminate intermediaries and provide a completely free platform."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: <Users className="text-primary" />, title: isRtl ? "دعم الحرفيين" : "Artisan Support", desc: isRtl ? "توفير أدوات رقمية مجانية لإدارة أعمالهم." : "Providing free digital tools to manage their business." },
                    { icon: <Target className="text-primary" />, title: isRtl ? "سهولة الوصول" : "Easy Access", desc: isRtl ? "ربط الزبائن بأقرب حرفي في دائرتهم." : "Connecting customers with the nearest artisan in their circle." },
                    { icon: <Shield className="text-primary" />, title: isRtl ? "الثقة والأمان" : "Trust & Safety", desc: isRtl ? "نظام تقييم شفاف لضمان أفضل خدمة." : "Transparent rating system to ensure best service." },
                    { icon: <Heart className="text-primary" />, title: isRtl ? "إحياء التراث" : "Reviving Heritage", desc: isRtl ? "الحفاظ على الحرف التقليدية من الاندثار." : "Preserving traditional crafts from extinction." }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-muted/50 border border-border/50 space-y-4 hover:bg-muted transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <h4 className="text-lg font-black text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl"
              >
                <img 
                  src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800" 
                  alt="Craftsmanship" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Free Commitment Section */}
        <section className="py-40 w-full bg-primary text-white overflow-hidden relative flex justify-center">
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-white/10 rounded-full -mr-60 -mt-60 blur-[120px]" />
          <div className="container max-w-[1920px] px-6 relative z-10 text-center space-y-12" dir={isRtl ? "rtl" : "ltr"}>
            <div className="max-w-4xl mx-auto">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-heading font-black mb-10 leading-tight"
              >
                {isRtl ? "التزامنا: مجانية للأبد" : "Our Commitment: Free Forever"}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl font-medium opacity-90 leading-relaxed"
              >
                {isRtl 
                  ? "منصة \"حرفتي\" ليست مجرد مشروع تجاري، بل هي مبادرة لدعم المجتمع. نعدكم بأن تسجيل الحرفيين سيبقى مجانياً بالكامل، دون عمولات أو رسوم خفية، ليبقى الربح كاملاً لمن يستحقه."
                  : "Herfati is not just a business project, but a community support initiative. We promise that artisan registration will remain completely free, with no commissions or hidden fees, so that all profits go to those who deserve it."}
              </motion.p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
