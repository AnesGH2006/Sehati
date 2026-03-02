import { Link, useLocation } from "wouter";
import { Menu, X, User, Globe, Moon, Sun, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRtl]);

  const navLinks = [
    { href: "/", label: t('nav.home') },
    { href: "/artisans", label: t('nav.artisans') },
    { href: "/subscription", label: t('nav.subscriptions') },
    { href: "/about", label: t('nav.about') || "من نحن" },
  ];

  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md" dir={isRtl ? "rtl" : "ltr"}>
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                ح
              </div>
              <span className="text-xl font-bold font-heading text-primary">حرفتي</span>
            </a>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </a>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"}>
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => changeLanguage(lang.code)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  {lang.label}
                  {i18n.language === lang.code && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/auth">
            <Button variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              تسجيل الدخول
            </Button>
          </Link>
          <Link href="/artisan/dashboard">
            <Button variant="ghost" className="gap-2 text-primary font-bold">
              لوحة التحكم
            </Button>
          </Link>
          <Link href="/subscription">
            <Button className="bg-primary hover:bg-primary/90">انضم كحرفي</Button>
          </Link>
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side={isRtl ? "right" : "left"} className="w-[300px] sm:w-[400px]" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex flex-col gap-8 mt-8">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        location === link.href ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </a>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-medium">الوضع الليلي</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-full"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-medium">اللغة / Langue</span>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={i18n.language === lang.code ? "default" : "outline"}
                        size="sm"
                        onClick={() => changeLanguage(lang.code)}
                        className="text-[10px] px-2 h-7"
                      >
                        {lang.code.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <Link href="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/subscription" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90">
                    انضم كحرفي
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
