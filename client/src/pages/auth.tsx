import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { User, Lock, Mail, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { loginCustomer } = useAuth();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", phone: "" });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: "تنبيه", description: "أدخل البريد وكلمة المرور", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.message, variant: "destructive" });
        return;
      }
      // Login as customer
      loginCustomer({
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone || "",
      });
      toast({ title: "مرحباً بك! 👋", description: `أهلاً ${data.user.name}` });
      setLocation("/");
    } catch {
      toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({ title: "تنبيه", description: "أدخل جميع البيانات المطلوبة", variant: "destructive" });
      return;
    }
    if (registerForm.password.length < 6) {
      toast({ title: "تنبيه", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.message, variant: "destructive" });
        return;
      }
      loginCustomer({
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone || "",
      });
      toast({ title: "تم إنشاء الحساب! 🎉", description: `مرحباً ${data.user.name}` });
      setLocation("/");
    } catch {
      toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-heading font-bold">مرحباً بك مجدداً</CardTitle>
                  <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label>البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email" placeholder="example@email.com" className="pr-9"
                        value={loginForm.email}
                        onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPass ? "text" : "password"} placeholder="••••••••"
                        className="pr-9 pl-10"
                        value={loginForm.password}
                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full font-bold" onClick={handleLogin} disabled={loading}>
                    {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    هل أنت حرفي؟{" "}
                    <Button variant="link" className="p-0 h-auto font-bold" onClick={() => setLocation("/subscription")}>
                      سجل عبر باقات الاشتراك
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-heading font-bold">إنشاء حساب زبون</CardTitle>
                  <CardDescription>ابحث عن أمهر الحرفيين في الجزائر</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label>الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="محمد علي" className="pr-9"
                        value={registerForm.name}
                        onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="example@email.com" className="pr-9"
                        value={registerForm.email}
                        onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>رقم الهاتف (اختياري)</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="06XXXXXXXX" className="pr-9"
                        value={registerForm.phone}
                        onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type={showPass ? "text" : "password"} placeholder="6 أحرف على الأقل"
                        className="pr-9 pl-10"
                        value={registerForm.password}
                        onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleRegister()}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full font-bold" onClick={handleRegister} disabled={loading}>
                    {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
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