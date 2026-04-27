import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArtisanCard } from "@/components/artisan/artisan-card";
import { DAIRAS, CATEGORIES, LOCATIONS, MOCK_ARTISANS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function Artisans() {
  const { t, i18n } = useTranslation();

  const urlParams   = new URLSearchParams(window.location.search);
  const initQuery   = urlParams.get("q")        ?? "";
  const initCat     = urlParams.get("category") ?? "";
  const initWilaya  = urlParams.get("wilaya")   ?? "";
  const initDaira   = urlParams.get("daira")    ?? "";

  const [searchQuery,        setSearchQuery]        = useState(initQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initCat ? [initCat] : []);
  const [selectedWilaya,     setSelectedWilaya]     = useState<string | null>(initWilaya || null);
  const [selectedDairas,     setSelectedDairas]     = useState<string[]>(initDaira ? [initDaira] : []);
  const [priceRange,         setPriceRange]         = useState([50000]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const cat = p.get("category") ?? "";
    if (cat) setSelectedCategories([cat]);
  }, [window.location.search]);

  const { data: apiArtisans = [] } = useQuery({
    queryKey: ["/api/artisans"],
    queryFn: async () => {
      const res = await fetch("/api/artisans");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const allArtisans = useMemo(() => {
    const apiMapped = apiArtisans.map((a: any) => ({
      id: a.id,
      name: a.name,
      category: CATEGORIES.find(c => c.id === a.category)?.label || a.category,
      daira: a.daira,
      wilaya: a.wilaya,
      phone: a.phone || "06XXXXXXXX",
      description: a.description || "",
      rating: a.rating || 0,
      reviews: a.reviewCount || 0,
      priceStart: a.priceStart,
      yearsOfExperience: a.yearsOfExperience || 1,
      image: a.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=2DD4BF&color=fff&size=400`,
      isVerified: a.isVerified || false,
      portfolioImages: a.portfolioImages || [],
      isNew: true,
      isFromApi: true,
    }));
    const mockMapped = MOCK_ARTISANS.map(m => ({ ...m, isFromApi: false }));
    return [...apiMapped, ...mockMapped];
  }, [apiArtisans]);

  const filteredArtisans = useMemo(() => {
    return allArtisans.filter((artisan: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        artisan.name.toLowerCase().includes(q) ||
        (artisan.description && artisan.description.toLowerCase().includes(q)) ||
        artisan.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(artisan.category);
      const matchesWilaya   = !selectedWilaya || artisan.wilaya === selectedWilaya;
      const matchesDaira    = selectedDairas.length === 0 || selectedDairas.includes(artisan.daira);
      const matchesPrice    = !artisan.priceStart || artisan.priceStart <= priceRange[0];
      return matchesSearch && matchesCategory && matchesWilaya && matchesDaira && matchesPrice;
    });
  }, [allArtisans, searchQuery, selectedCategories, selectedWilaya, selectedDairas, priceRange]);

  const toggleCategory = (cat: string) =>
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleDaira = (daira: string) =>
    setSelectedDairas(prev => prev.includes(daira) ? prev.filter(d => d !== daira) : [...prev, daira]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedWilaya(null);
    setSelectedDairas([]);
    setPriceRange([50000]);
    window.history.replaceState({}, "", "/artisans");
  };

  const isRtl = i18n.language === 'ar';

  const activeFilterCount =
    selectedCategories.length + selectedDairas.length +
    (selectedWilaya ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      <main className="flex-1 container px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Mobile Filter Trigger */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input
                  placeholder={t('artisans.search_name')}
                  className={isRtl ? "pr-9" : "pl-9"}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRtl ? "right" : "left"} className="w-[300px]">
                  <div className="mt-6">
                    <Filters
                      selectedCategories={selectedCategories} toggleCategory={toggleCategory}
                      selectedWilaya={selectedWilaya} setSelectedWilaya={v => { setSelectedWilaya(v); setSelectedDairas([]); }}
                      selectedDairas={selectedDairas} toggleDaira={toggleDaira}
                      priceRange={priceRange} setPriceRange={setPriceRange}
                      clearFilters={clearFilters} t={t} isRtl={isRtl}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <ActiveFilters
              selectedCategories={selectedCategories} toggleCategory={toggleCategory}
              selectedDairas={selectedDairas} toggleDaira={toggleDaira}
              selectedWilaya={selectedWilaya} clearWilaya={() => { setSelectedWilaya(null); setSelectedDairas([]); }}
            />
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-24 h-fit" dir="rtl">
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-xl">{t('artisans.filter_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('artisans.filter_subtitle')}</p>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('artisans.search_name')}
                className="pr-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Filters
              selectedCategories={selectedCategories} toggleCategory={toggleCategory}
              selectedWilaya={selectedWilaya} setSelectedWilaya={v => { setSelectedWilaya(v); setSelectedDairas([]); }}
              selectedDairas={selectedDairas} toggleDaira={toggleDaira}
              priceRange={priceRange} setPriceRange={setPriceRange}
              clearFilters={clearFilters} t={t} isRtl={isRtl}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1" dir="rtl">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-1">{t('artisans.title')}</h1>
                <p className="text-muted-foreground text-sm">
                  {filteredArtisans.length} حرفي
                  {selectedWilaya && <span className="text-primary font-medium"> في {selectedWilaya}</span>}
                  {selectedCategories.length === 1 && <span className="text-primary font-medium"> • {selectedCategories[0]}</span>}
                </p>
              </div>
              <div className="hidden md:flex flex-wrap gap-2">
                <ActiveFilters
                  selectedCategories={selectedCategories} toggleCategory={toggleCategory}
                  selectedDairas={selectedDairas} toggleDaira={toggleDaira}
                  selectedWilaya={selectedWilaya} clearWilaya={() => { setSelectedWilaya(null); setSelectedDairas([]); }}
                />
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredArtisans.map((artisan: any) => (
                  <motion.div
                    key={artisan.id} layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArtisanCard
                      id={artisan.id} name={artisan.name}
                      category={artisan.category} daira={artisan.daira}
                      phone={artisan.phone || "06XXXXXXXX"}
                      rating={artisan.rating} reviews={artisan.reviews}
                      priceStart={artisan.priceStart}
                      yearsOfExperience={artisan.yearsOfExperience}
                      image={artisan.image} isVerified={artisan.isVerified}
                      portfolioImages={artisan.portfolioImages} isNew={artisan.isNew}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredArtisans.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed"
              >
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground font-medium">لم يُعثر على حرفيين بهذه المواصفات</p>
                <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                  {t('artisans.reset_filters')}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Active Filters Badges ─────────────────────────────────────────────────────
function ActiveFilters({ selectedCategories, toggleCategory, selectedDairas, toggleDaira, selectedWilaya, clearWilaya, className }: any) {
  if (!selectedCategories.length && !selectedDairas.length && !selectedWilaya) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {selectedWilaya && (
        <Badge className="gap-1 px-3 py-1 bg-primary/10 text-primary border-primary/30">
          <MapPin className="w-3 h-3" /> {selectedWilaya}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={clearWilaya} />
        </Badge>
      )}
      {selectedCategories.map((cat: string) => (
        <Badge key={cat} variant="secondary" className="gap-1 px-3 py-1">
          {cat} <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleCategory(cat)} />
        </Badge>
      ))}
      {selectedDairas.map((daira: string) => (
        <Badge key={daira} variant="outline" className="gap-1 px-3 py-1 border-primary/30 text-primary">
          {daira} <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleDaira(daira)} />
        </Badge>
      ))}
    </div>
  );
}

// ── Sidebar Filters ────────────────────────────────────────────────────────────
function Filters({ selectedCategories, toggleCategory, selectedWilaya, setSelectedWilaya, selectedDairas, toggleDaira, priceRange, setPriceRange, clearFilters, t, isRtl }: any) {
  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["categories", "location"]} className="w-full">

        <AccordionItem value="categories">
          <AccordionTrigger className="font-heading font-bold">{t('artisans.category')}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2 max-h-52 overflow-y-auto pr-1">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={selectedCategories.includes(cat.label)}
                    onCheckedChange={() => toggleCategory(cat.label)}
                  />
                  <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">{cat.label}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location">
          <AccordionTrigger className="font-heading font-bold">{t('artisans.location')}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">الولاية</Label>
                <Select onValueChange={setSelectedWilaya} value={selectedWilaya || ""} dir="rtl">
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="اختر ولاية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">كل الولايات</SelectItem>
                    {DAIRAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedWilaya && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">الدوائر</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 border rounded-md p-2 bg-muted/20">
                    {((LOCATIONS as any)[selectedWilaya] ?? []).map((daira: string) => (
                      <div key={daira} className="flex items-center gap-2">
                        <Checkbox
                          id={`loc-${daira}`}
                          checked={selectedDairas.includes(daira)}
                          onCheckedChange={() => toggleDaira(daira)}
                        />
                        <Label htmlFor={`loc-${daira}`} className="text-xs font-normal cursor-pointer">{daira}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="font-heading font-bold">{t('artisans.max_price')}</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 px-2 space-y-4">
              <div className="text-center font-bold text-primary text-lg">
                {priceRange[0] === 50000 ? "الكل" : `${priceRange[0].toLocaleString()} دج`}
              </div>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={50000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 دج</span>
                <span>50,000 دج</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={clearFilters}>
        {t('artisans.reset')}
      </Button>
    </div>
  );
}