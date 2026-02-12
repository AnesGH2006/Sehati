import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { User, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب زبون</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-heading font-bold">مرحباً بك مجدداً</CardTitle>
                  <CardDescription>أدخل بياناتك للوصول إلى حسابك كزبون</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="username" placeholder="أدخل اسم المستخدم" className="pr-9" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type={showPass ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pr-9 pl-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 font-bold" onClick={() => setLocation("/")}>
                    تسجيل الدخول
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    هل أنت حرفي؟ <Button variant="link" className="p-0 h-auto font-bold" onClick={() => setLocation("/subscription")}>سجل عبر باقات الاشتراك</Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-heading font-bold">إنشاء حساب زبون</CardTitle>
                  <CardDescription>ابحث عن أمهر الحرفيين في الجزائر بسهولة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="reg-name">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-name" placeholder="محمد علي" className="pr-9" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-email" type="email" placeholder="example@herfati.dz" className="pr-9" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="reg-pass">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="reg-pass" 
                        type={showPass ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pr-9 pl-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-primary hover:bg-primary/90 font-bold" onClick={() => setLocation("/")}>
                    إنشاء الحساب
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
