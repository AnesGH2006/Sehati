import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Shield, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden bg-[#050505] text-white">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
          </div>
          
          <div className="container max-w-7xl px-6 relative z-10 text-center" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tighter mb-6 bg-gradient-to-l from-white via-white to-white/40 bg-clip-text text-transparent">
                من نحن؟ <span className="text-primary italic">حرفتي</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                نحن منصة جزائرية 100% تهدف إلى إحياء الصناعات التقليدية والحرف اليدوية في منطقة تيارت وكافة ربوع الوطن، من خلال ربط الحرفيين المبدعين بالزبائن مباشرة.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-24 container max-w-7xl px-6" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-heading font-black text-foreground">رؤيتنا وأهدافنا</h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                في "حرفتي"، نؤمن بأن الحرفي الجزائري يمتلك مهارات استثنائية تستحق أن تظهر للعالم. هدفنا هو القضاء على الوسطاء وتوفير منصة مجانية بالكامل تضمن للحرفي حقه وللزبون الجودة والمصداقية.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Users className="text-primary" />, title: "دعم الحرفيين", desc: "توفير أدوات رقمية مجانية لإدارة أعمالهم." },
                  { icon: <Target className="text-primary" />, title: "سهولة الوصول", desc: "ربط الزبائن بأقرب حرفي في دائرتهم." },
                  { icon: <Shield className="text-primary" />, title: "الثقة والأمان", desc: "نظام تقييم شفاف لضمان أفضل خدمة." },
                  { icon: <Heart className="text-primary" />, title: "إحياء التراث", desc: "الحفاظ على الحرف التقليدية من الاندثار." }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <h4 className="font-black text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
            </motion.div>
          </div>
        </section>

        {/* Free Commitment Section */}
        <section className="py-24 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="container max-w-4xl px-6 relative z-10 text-center space-y-8" dir="rtl">
            <h2 className="text-4xl md:text-5xl font-heading font-black">التزامنا: مجانية للأبد</h2>
            <p className="text-xl font-medium opacity-90 leading-relaxed">
              منصة "حرفتي" ليست مجرد مشروع تجاري، بل هي مبادرة لدعم المجتمع. نعدكم بأن تسجيل الحرفيين سيبقى مجانياً بالكامل، دون عمولات أو رسوم خفية، ليبقى الربح كاملاً لمن يستحقه.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
