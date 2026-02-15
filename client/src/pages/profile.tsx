import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { MOCK_ARTISANS } from "@/lib/constants";
import { MapPin, Star, MessageCircle, Share2, Heart, CheckCircle2, Clock, Globe } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const [match, params] = useRoute("/profile/:id");
  const id = params ? parseInt(params.id) : 1;
  const artisan = MOCK_ARTISANS.find(a => a.id === id) || MOCK_ARTISANS[0];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      <main className="flex-1 pb-16" dir="rtl">
        {/* Cover Image */}
        <div className="h-64 md:h-80 w-full bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img src={artisan.image} alt="cover" className="w-full h-full object-cover blur-sm scale-105" />
        </div>

        <div className="container px-4 md:px-8 relative z-20 -mt-20">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background overflow-hidden shadow-lg shrink-0 bg-muted">
                <img src={artisan.image} alt={artisan.name} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-heading font-bold">{artisan.name}</h1>
                      {artisan.isVerified && (
                        <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-50" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-lg flex items-center gap-2 mt-1 font-bold">
                      <span className="text-primary">{artisan.category}</span>
                      <span className="opacity-30">•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {artisan.daira}</span>
                    </p>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" size="icon" className="rounded-2xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-2xl border-primary/20 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all duration-300">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Link href={`/chat/${artisan.id}`} className="flex-1 md:flex-none">
                      <Button size="lg" className="w-full md:w-auto gap-3 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 text-lg font-black transition-all active:scale-95 group">
                        <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        تواصل معي الآن
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
                   <div className="flex items-center gap-1">
                     <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                     <span className="font-bold text-lg">{artisan.rating}</span>
                     <span className="text-muted-foreground">({artisan.reviews} تقييم)</span>
                   </div>
                   <div className="w-px h-6 bg-border"></div>
                   <div className="flex items-center gap-2 text-sm">
                     <Clock className="w-4 h-4 text-muted-foreground" />
                     <span>يرد خلال ساعة</span>
                   </div>
                   <div className="w-px h-6 bg-border"></div>
                   <div className="flex items-center gap-2 text-sm">
                     <Globe className="w-4 h-4 text-muted-foreground" />
                     <span>يتحدث العربية، الفرنسية</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-10">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="about" className="px-6 py-3 rounded-lg text-base">حول الحرفي</TabsTrigger>
                  <TabsTrigger value="portfolio" className="px-6 py-3 rounded-lg text-base">معرض الأعمال</TabsTrigger>
                  <TabsTrigger value="reviews" className="px-6 py-3 rounded-lg text-base">التقييمات</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-3">نبذة تعريفية</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {artisan.description}
                      <br /><br />
                      أعمل في هذا المجال منذ سنوات طويلة، وأضمن لكم جودة العمل والالتزام بالمواعيد. متخصص في جميع أنواع الأعمال اليدوية والتركيبات الحديثة.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                      <h4 className="font-bold mb-2">الخدمات المقدمة</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>التركيب والصيانة</li>
                        <li>التصليحات العاجلة</li>
                        <li>الاستشارات الفنية</li>
                        <li>التصميم والتنفيذ</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <h4 className="font-bold mb-2">أوقات العمل</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex justify-between"><span>الأحد - الخميس</span> <span>08:00 - 18:00</span></li>
                        <li className="flex justify-between"><span>السبت</span> <span>09:00 - 14:00</span></li>
                        <li className="flex justify-between"><span>الجمعة</span> <span className="text-red-500">مغلق</span></li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-video md:aspect-square rounded-[2rem] overflow-hidden bg-muted group relative shadow-lg hover:shadow-primary/20 transition-all duration-500">
                        <img 
                          src={`https://picsum.photos/seed/${artisan.id * 10 + i}/600/600`} 
                          alt="Project" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                          <p className="text-white font-bold text-lg mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">مشروع متميز #{i}</p>
                          <Button variant="secondary" size="sm" className="w-full rounded-xl font-bold backdrop-blur-md bg-white/20 border-white/20 text-white hover:bg-white hover:text-black">عرض التفاصيل</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                   <div className="text-center py-12 text-muted-foreground">
                     قريباً...
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
