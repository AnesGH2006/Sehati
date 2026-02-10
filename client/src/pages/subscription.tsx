import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Check, Mail, User, CreditCard, Upload, Clock, Briefcase, Banknote, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAIRAS, CATEGORIES, LOCATIONS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Subscription() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [duration, setDuration] = useState("1");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isRtl = i18n.language === 'ar';

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast({
      title: t('subscription.subscribe_now'),
      description: t('subscription.under_review'),
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md p-8 bg-card rounded-3xl border shadow-xl"
          >
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary">{t('subscription.under_review')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('subscription.review_desc')}
            </p>
            <Button className="w-full" variant="outline" onClick={() => window.location.href = "/"}>{t('common.back_home')}</Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h1 className="text-4xl font-heading font-bold">{t('subscription.title')}</h1>
            <p className="text-xl text-muted-foreground">{t('subscription.subtitle')}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary relative shadow-2xl z-10">
              <div className={`absolute -top-4 ${isRtl ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg`}>
                {t('subscription.plan_name')}
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-3xl font-heading text-primary">{t('subscription.plan_name')}</CardTitle>
                <CardDescription className="text-lg">{t('subscription.plan_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <Label className="text-base font-bold mb-4 block">{t('subscription.duration')}</Label>
                  <Tabs defaultValue="1" className="w-full" onValueChange={setDuration}>
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-background/50">
                      <TabsTrigger value="1" className="py-3 flex flex-col">
                        <span className="font-bold">{t('subscription.month')}</span>
                        <span className="text-xs opacity-70">{t('subscription.price_1')}</span>
                      </TabsTrigger>
                      <TabsTrigger value="3" className="py-3 flex flex-col">
                        <span className="font-bold">{t('subscription.3months')}</span>
                        <span className="text-xs opacity-70">{t('subscription.price_3')}</span>
                      </TabsTrigger>
                      <TabsTrigger value="6" className="py-3 flex flex-col">
                        <span className="font-bold">{t('subscription.6months')}</span>
                        <span className="text-xs opacity-70">{t('subscription.price_6')}</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-4 px-4">
                  <h3 className="font-bold text-lg border-b pb-2">{t('subscription.features')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureItem text={t('subscription.feat_profile')} />
                    <FeatureItem text={t('subscription.feat_portfolio')} />
                    <FeatureItem text={t('subscription.feat_chat')} />
                    <FeatureItem text={t('subscription.feat_search')} />
                    <FeatureItem text={t('subscription.feat_stats')} />
                    <FeatureItem text={t('subscription.feat_support')} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <JoinDialog plan={duration === "1" ? t('subscription.month') : duration === "3" ? t('subscription.3months') : t('subscription.6months')} onSubmit={handleJoin} t={t} i18n={i18n} />
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary/10 rounded-full p-1">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

function JoinDialog({ plan, onSubmit, t, i18n }: { plan: string, onSubmit: (e: any) => void, t: any, i18n: any }) {
  const [receipt, setReceipt] = useState<string | null>(null);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const isRtl = i18n.language === 'ar';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-14 text-xl bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/20">
          <CreditCard className={`${isRtl ? 'ml-2' : 'mr-2'} w-6 h-6`} />
          {t('subscription.subscribe_now')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t('subscription.form_title', { plan })}</DialogTitle>
          <DialogDescription>
            {t('subscription.form_desc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.full_name')}</Label>
              <div className="relative">
                <User className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input placeholder="محمد علي" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('subscription.email')}</Label>
              <div className="relative">
                <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input type="email" placeholder="example@gmail.com" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.price_start')}</Label>
              <div className="relative">
                <Banknote className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input type="number" placeholder="1500" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('subscription.exp_years')}</Label>
              <div className="relative">
                <Briefcase className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input type="number" placeholder="5" className={isRtl ? "pr-9" : "pl-9"} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('subscription.category_label')}</Label>
              <Select dir={isRtl ? "rtl" : "ltr"}>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder={t('subscription.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الولاية</Label>
              <Select dir={isRtl ? "rtl" : "ltr"} onValueChange={setSelectedWilaya}>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder="الولاية" />
                </SelectTrigger>
                <SelectContent>
                  {DAIRAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدائرة</Label>
              <Select dir={isRtl ? "rtl" : "ltr"} disabled={!selectedWilaya}>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder="الدائرة" />
                </SelectTrigger>
                <SelectContent>
                  {selectedWilaya && (LOCATIONS as any)[selectedWilaya].map((d: string) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">{t('subscription.portfolio')}</Label>
            <input 
              type="file" 
              hidden 
              ref={portfolioRef} 
              multiple 
              accept="image/*" 
              onChange={(e) => setPortfolioCount(e.target.files?.length || 0)} 
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => portfolioRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              {portfolioCount > 0 ? t('subscription.portfolio_count', { count: portfolioCount }) : t('subscription.portfolio_select')}
            </Button>
          </div>
          
          <div className="p-4 border-2 border-dashed rounded-xl bg-primary/5 text-center space-y-2">
            <Label className="block mb-2 font-bold text-primary">{t('subscription.receipt')}</Label>
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={(e) => setReceipt(e.target.files?.[0]?.name || null)} 
              required 
            />
            <Button 
              type="button" 
              variant="default" 
              className="w-full gap-2 shadow-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {receipt || t('subscription.receipt_upload')}
            </Button>
            <p className="text-[10px] text-muted-foreground italic">{t('subscription.receipt_hint')}</p>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold mt-4">{t('subscription.submit_join')}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
