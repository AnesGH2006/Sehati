import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { User, Lock, Mail, Eye, EyeOff, Phone, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type Screen = "main" | "verify-email" | "forgot-password" | "reset-password";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { loginCustomer } = useAuth();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>("main");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ otp: "", newPassword: "" });

  const inputClass = "h-12 pr-9 bg-muted/30 border-border/50 focus:border-primary/50";

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: "تنبيه", description: "أدخل البريد وكلمة المرور", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
      const data = await res.json();
      if (res.status === 403 && data.needsVerification) {
        setPendingEmail(data.email); setScreen("verify-email");
        toast({ title: "تأكيد مطلوب", description: "أدخل رمز التحقق المرسل لبريدك" }); return;
      }
      if (!res.ok) { toast({ title: "خطأ", description: data.message, variant: "destructive" }); return; }
      loginCustomer({ id: data.user.id, name: data.user.name, phone: data.user.phone || "" });
      toast({ title: "مرحباً بك! 👋", description: `أهلاً ${data.user.name}` });
      setLocation("/");
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({ title: "تنبيه", description: "أدخل جميع البيانات المطلوبة", variant: "destructive" }); return;
    }
    if (registerForm.password.length < 6) {
      toast({ title: "تنبيه", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(registerForm) });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.message, variant: "destructive" }); return; }
      setPendingEmail(registerForm.email); setScreen("verify-email");
      toast({ title: "✉️ تحقق من بريدك", description: data.message });
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast({ title: "تنبيه", description: "أدخل الرمز المكون من 6 أرقام", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, otp }) });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.message, variant: "destructive" }); return; }
      toast({ title: "✅ تم التأكيد!", description: "يمكنك الآن تسجيل الدخول" });
      setScreen("main"); setOtp("");
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail }) });
      const data = await res.json();
      toast({ title: data.success ? "✉️ تم الإرسال" : "خطأ", description: data.message, variant: data.success ? "default" : "destructive" });
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast({ title: "تنبيه", description: "أدخل بريدك الإلكتروني", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.message, variant: "destructive" }); return; }
      setPendingEmail(forgotEmail); setScreen("reset-password");
      toast({ title: "✉️ تحقق من بريدك", description: "تم إرسال رمز إعادة التعيين" });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetForm.otp || !resetForm.newPassword) { toast({ title: "تنبيه", description: "أدخل جميع الحقول", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, ...resetForm }) });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.message, variant: "destructive" }); return; }
      toast({ title: "✅ تم تغيير كلمة المرور" });
      setScreen("main"); setResetForm({ otp: "", newPassword: "" });
    } finally { setLoading(false); }
  };

  // ── OTP Screen ───────────────────────────────────────────────────────────
  if (screen === "verify-email") return (
    <div className="min-h-screen flex flex-col bg-background"><Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-border/50 shadow-xl" dir="rtl">
            <CardHeader className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-heading font-bold">تأكيد البريد الإلكتروني</CardTitle>
              <CardDescription>أرسلنا رمز التحقق إلى<br /><strong className="text-foreground">{pendingEmail}</strong></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                placeholder="_ _ _ _ _ _" maxLength={6}
                className="w-full h-14 text-center text-3xl font-bold tracking-[0.5em] border border-border/50 rounded-xl bg-muted/30 focus:outline-none focus:border-primary/50" />
              <Button className="w-full h-12 font-bold" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
                {loading ? "جاري التحقق..." : "تأكيد الحساب ✅"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button onClick={handleResendOTP} disabled={loading} className="text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
                  <RefreshCw className="h-3.5 w-3.5" /> إعادة الإرسال
                </button>
                <button onClick={() => setScreen("main")} className="text-muted-foreground hover:underline">رجوع</button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main><Footer />
    </div>
  );

  // ── Forgot Password Screen ────────────────────────────────────────────────
  if (screen === "forgot-password") return (
    <div className="min-h-screen flex flex-col bg-background"><Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-border/50 shadow-xl" dir="rtl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-heading font-bold">نسيت كلمة المرور؟</CardTitle>
              <CardDescription>أدخل بريدك وسنرسل لك رمز إعادة التعيين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="example@email.com" className={inputClass}
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()} />
              </div>
              <Button className="w-full h-12 font-bold" onClick={handleForgotPassword} disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رمز إعادة التعيين"}
              </Button>
              <button onClick={() => setScreen("main")} className="w-full text-center text-sm text-muted-foreground hover:underline">رجوع</button>
            </CardContent>
          </Card>
        </motion.div>
      </main><Footer />
    </div>
  );

  // ── Reset Password Screen ─────────────────────────────────────────────────
  if (screen === "reset-password") return (
    <div className="min-h-screen flex flex-col bg-background"><Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-border/50 shadow-xl" dir="rtl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-heading font-bold">إعادة تعيين كلمة المرور</CardTitle>
              <CardDescription>أدخل الرمز المرسل لـ {pendingEmail}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input value={resetForm.otp} onChange={e => setResetForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="_ _ _ _ _ _" maxLength={6}
                className="w-full h-14 text-center text-3xl font-bold tracking-[0.5em] border border-border/50 rounded-xl bg-muted/30 focus:outline-none focus:border-primary/50" />
              <div className="relative">
                <Lock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input type={showPass ? "text" : "password"} placeholder="6 أحرف على الأقل" className={`${inputClass} pl-10`}
                  value={resetForm.newPassword} onChange={e => setResetForm(p => ({ ...p, newPassword: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-3.5 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button className="w-full h-12 font-bold" onClick={handleResetPassword} disabled={loading}>
                {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
              </Button>
              <button onClick={() => setScreen("main")} className="w-full text-center text-sm text-muted-foreground hover:underline">رجوع</button>
            </CardContent>
          </Card>
        </motion.div>
      </main><Footer />
    </div>
  );

  // ── Main Screen ───────────────────────────────────────────────────────────
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
                      <Mail className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="example@email.com" className={inputClass}
                        value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleLogin()} />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input type={showPass ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pl-10`}
                        value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleLogin()} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-3.5 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setScreen("forgot-password")} className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</button>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full font-bold h-12" onClick={handleLogin} disabled={loading}>
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

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-heading font-bold">إنشاء حساب زبون</CardTitle>
                  <CardDescription>ابحث عن أمهر الحرفيين في الجزائر</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "الاسم الكامل", id: "name", icon: User, placeholder: "محمد علي", type: "text" },
                    { label: "البريد الإلكتروني", id: "email", icon: Mail, placeholder: "example@email.com", type: "email" },
                    { label: "رقم الهاتف (اختياري)", id: "phone", icon: Phone, placeholder: "06XXXXXXXX", type: "text" },
                  ].map(({ label, id, icon: Icon, placeholder, type }) => (
                    <div key={id} className="space-y-2 text-right">
                      <Label>{label}</Label>
                      <div className="relative">
                        <Icon className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input type={type} placeholder={placeholder} className={inputClass}
                          value={(registerForm as any)[id]}
                          onChange={e => setRegisterForm(p => ({ ...p, [id]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 text-right">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input type={showPass ? "text" : "password"} placeholder="6 أحرف على الأقل" className={`${inputClass} pl-10`}
                        value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleRegister()} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-3.5 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full font-bold h-12" onClick={handleRegister} disabled={loading}>
                    {loading ? "جاري الإنشاء..." : "إنشاء الحساب ✉️"}
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