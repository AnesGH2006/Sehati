import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArtisanCard } from "@/components/artisan/artisan-card";
import { MOCK_ARTISANS, DAIRAS, CATEGORIES, LOCATIONS } from "@/lib/constants";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [selectedDairas, setSelectedDairas] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([10000]);

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
    // API artisans use their real IDs; map category id → Arabic label
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
    // Give mock artisans offset IDs to avoid clashing with API artisans
    const mockMapped = MOCK_ARTISANS.map(m => ({ ...m, isFromApi: false }));
    return [...apiMapped, ...mockMapped];
  }, [apiArtisans]);

  const filteredArtisans = useMemo(() => {
    return allArtisans.filter((artisan: any) => {
      const matchesSearch = artisan.name.includes(searchQuery) || (artisan.description && artisan.description.includes(searchQuery));
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(artisan.category);
      const matchesDaira = selectedDairas.length === 0 || selectedDairas.includes(artisan.daira);
      const matchesPrice = artisan.priceStart <= priceRange[0];
      return matchesSearch && matchesCategory && matchesDaira && matchesPrice;
    });
  }, [allArtisans, searchQuery, selectedCategories, selectedDairas, priceRange]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleDaira = (daira: string) => {
    setSelectedDairas(prev => 
      prev.includes(daira) ? prev.filter(d => d !== daira) : [...prev, daira]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedWilaya(null);
    setSelectedDairas([]);
    setPriceRange([50000]);
  };

  const isRtl = i18n.language === 'ar';

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRtl ? "right" : "left"} className="w-[300px]">
                  <div className="mt-6">
                    <Filters 
                      selectedCategories={selectedCategories}
                      toggleCategory={toggleCategory}
                      selectedWilaya={selectedWilaya}
                      setSelectedWilaya={setSelectedWilaya}
                      selectedDairas={selectedDairas}
                      toggleDaira={toggleDaira}
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      clearFilters={clearFilters}
                      t={t}
                      isRtl={isRtl}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* Active Mobile Filters */}
            <ActiveFilters 
              selectedCategories={selectedCategories} 
              toggleCategory={toggleCategory}
              selectedDairas={selectedDairas}
              toggleDaira={toggleDaira}
            />
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-24 h-fit">
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-xl">{t('artisans.filter_title')}</h2>
              <p className="text-sm text-muted-foreground">{t('artisans.filter_subtitle')}</p>
            </div>
            <div className="relative">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-muted-foreground`} />
              <Input 
                placeholder={t('artisans.search_name')} 
                className={isRtl ? "pr-9" : "pl-9"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Filters 
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              selectedWilaya={selectedWilaya}
              setSelectedWilaya={setSelectedWilaya}
              selectedDairas={selectedDairas}
              toggleDaira={toggleDaira}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              clearFilters={clearFilters}
              t={t}
              isRtl={isRtl}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2">{t('artisans.title')}</h1>
                <p className="text-muted-foreground">{t('artisans.count', { count: filteredArtisans.length })}</p>
              </div>
              <ActiveFilters 
                className="hidden md:flex"
                selectedCategories={selectedCategories} 
                toggleCategory={toggleCategory}
                selectedDairas={selectedDairas}
                toggleDaira={toggleDaira}
              />
            </div>

            <motion.div 
              layout 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredArtisans.map((artisan) => (
                  <motion.div
                    key={artisan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArtisanCard
                      id={artisan.id}
                      name={artisan.name}
                      category={artisan.category}
                      daira={artisan.daira}
                      phone={artisan.phone || "06XXXXXXXX"}
                      rating={artisan.rating}
                      reviews={artisan.reviews}
                      priceStart={artisan.priceStart}
                      yearsOfExperience={artisan.yearsOfExperience}
                      image={artisan.image}
                      isVerified={artisan.isVerified}
                      portfolioImages={artisan.portfolioImages}
                      isNew={artisan.isNew}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredArtisans.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed"
              >
                <p className="text-muted-foreground">{t('artisans.no_results')}</p>
                <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">{t('artisans.reset_filters')}</Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ActiveFilters({ selectedCategories, toggleCategory, selectedDairas, toggleDaira, className }: any) {
  if (selectedCategories.length === 0 && selectedDairas.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {selectedCategories.map((cat: string) => (
        <Badge key={cat} variant="secondary" className="gap-1 px-3 py-1">
          {cat}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleCategory(cat)} />
        </Badge>
      ))}
      {selectedDairas.map((daira: string) => (
        <Badge key={daira} variant="outline" className="gap-1 px-3 py-1 border-primary/30 text-primary">
          {daira}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleDaira(daira)} />
        </Badge>
      ))}
    </div>
  );
}

function Filters({ selectedCategories, toggleCategory, selectedWilaya, setSelectedWilaya, selectedDairas, toggleDaira, priceRange, setPriceRange, clearFilters, t, isRtl }: any) {
  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["categories", "location"]} className="w-full">
        <AccordionItem value="categories">
          <AccordionTrigger className="font-heading font-bold">{t('artisans.category')}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {CATEGORIES.map((cat) => (
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
                <Select onValueChange={(val) => { setSelectedWilaya(val); }} value={selectedWilaya || ""}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="اختر ولاية" />
                  </SelectTrigger>
                  <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                    {DAIRAS.map(wilaya => <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedWilaya && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">الدوائر</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pl-2 custom-scrollbar border rounded-md p-2 bg-muted/20">
                    {(LOCATIONS as any)[selectedWilaya].map((daira: string) => (
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
              <div className="text-center font-bold text-primary">{priceRange[0]} دج</div>
              <Slider 
                value={priceRange} 
                onValueChange={setPriceRange}
                max={10000} 
                min={500}
                step={500} 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>500 دج</span>
                <span>10000 دج</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Button variant="ghost" className="w-full mt-4 text-muted-foreground" onClick={clearFilters}>{t('artisans.reset')}</Button>
    </div>
  );
}
