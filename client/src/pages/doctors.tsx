import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DoctorCard } from "@/components/doctor/doctor-card";
import { DAIRAS, SPECIALTIES, LOCATIONS } from "@/lib/constants";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function Doctors() {
  const urlParams     = new URLSearchParams(window.location.search);
  const initQuery     = urlParams.get("q")         ?? "";
  const initSpecialty = urlParams.get("specialty") ?? "";
  const initWilaya    = urlParams.get("wilaya")    ?? "";
  const initDaira     = urlParams.get("daira")     ?? "";

  const [searchQuery,          setSearchQuery]          = useState(initQuery);
  const [selectedSpecialties,  setSelectedSpecialties]  = useState<string[]>(initSpecialty ? [initSpecialty] : []);
  const [selectedWilaya,       setSelectedWilaya]       = useState<string | null>(initWilaya || null);
  const [selectedDairas,       setSelectedDairas]       = useState<string[]>(initDaira ? [initDaira] : []);
  const [feeRange,             setFeeRange]             = useState([20000]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sp = p.get("specialty") ?? "";
    if (sp) setSelectedSpecialties([sp]);
  }, [window.location.search]);

  const { data: apiDoctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      const res = await fetch("/api/doctors");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const allDoctors = useMemo(() => {
    return apiDoctors.map((d: any) => ({
      id:                 d.id,
      name:               d.name,
      specialty:          d.specialty,
      daira:              d.daira,
      wilaya:             d.wilaya,
      phone:              d.phone || "",
      description:        d.description || "",
      rating:             d.rating || 0,
      reviews:            d.reviewCount || 0,
      consultationFee:    d.consultationFee,
      yearsOfExperience:  d.yearsOfExperience || 0,
      image:              d.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=2DD4BF&color=fff&size=400`,
      isVerified:         d.isVerified || false,
      clinicName:         d.clinicName || "",
      licenseNumber:      d.licenseNumber || "",
    }));
  }, [apiDoctors]);

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doctor: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch    = !q || doctor.name.toLowerCase().includes(q) || doctor.specialty.toLowerCase().includes(q) || (doctor.clinicName && doctor.clinicName.toLowerCase().includes(q));
      const matchesSpecialty = selectedSpecialties.length === 0 || selectedSpecialties.includes(doctor.specialty);
      const matchesWilaya    = !selectedWilaya || doctor.wilaya === selectedWilaya;
      const matchesDaira     = selectedDairas.length === 0 || selectedDairas.includes(doctor.daira);
      const matchesFee       = !doctor.consultationFee || doctor.consultationFee <= feeRange[0];
      return matchesSearch && matchesSpecialty && matchesWilaya && matchesDaira && matchesFee;
    });
  }, [allDoctors, searchQuery, selectedSpecialties, selectedWilaya, selectedDairas, feeRange]);

  const toggleSpecialty = (sp: string) =>
    setSelectedSpecialties(prev => prev.includes(sp) ? prev.filter(s => s !== sp) : [...prev, sp]);

  const toggleDaira = (daira: string) =>
    setSelectedDairas(prev => prev.includes(daira) ? prev.filter(d => d !== daira) : [...prev, daira]);

  const clearFilters = () => {
    setSearchQuery(""); setSelectedSpecialties([]); setSelectedWilaya(null);
    setSelectedDairas([]); setFeeRange([20000]);
    window.history.replaceState({}, "", "/doctors");
  };

  const activeFilterCount =
    selectedSpecialties.length + selectedDairas.length +
    (selectedWilaya ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 container px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Mobile Filter */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن طبيب..." className="pr-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">{activeFilterCount}</span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="mt-6">
                    <Filters selectedSpecialties={selectedSpecialties} toggleSpecialty={toggleSpecialty}
                      selectedWilaya={selectedWilaya} setSelectedWilaya={v => { setSelectedWilaya(v); setSelectedDairas([]); }}
                      selectedDairas={selectedDairas} toggleDaira={toggleDaira}
                      feeRange={feeRange} setFeeRange={setFeeRange} clearFilters={clearFilters} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <ActiveFilters selectedSpecialties={selectedSpecialties} toggleSpecialty={toggleSpecialty}
              selectedDairas={selectedDairas} toggleDaira={toggleDaira}
              selectedWilaya={selectedWilaya} clearWilaya={() => { setSelectedWilaya(null); setSelectedDairas([]); }} />
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-24 h-fit" dir="rtl">
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-xl">فلترة الأطباء</h2>
              <p className="text-xs text-muted-foreground">ابحث بالتخصص أو المنطقة</p>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث عن طبيب..." className="pr-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Filters selectedSpecialties={selectedSpecialties} toggleSpecialty={toggleSpecialty}
              selectedWilaya={selectedWilaya} setSelectedWilaya={v => { setSelectedWilaya(v); setSelectedDairas([]); }}
              selectedDairas={selectedDairas} toggleDaira={toggleDaira}
              feeRange={feeRange} setFeeRange={setFeeRange} clearFilters={clearFilters} />
          </aside>

          {/* Main Content */}
          <div className="flex-1" dir="rtl">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-1">الأطباء</h1>
                <p className="text-muted-foreground text-sm">
                  {filteredDoctors.length} طبيب
                  {selectedWilaya && <span className="text-primary font-medium"> في {selectedWilaya}</span>}
                  {selectedSpecialties.length === 1 && <span className="text-primary font-medium"> • {selectedSpecialties[0]}</span>}
                </p>
              </div>
              <div className="hidden md:flex flex-wrap gap-2">
                <ActiveFilters selectedSpecialties={selectedSpecialties} toggleSpecialty={toggleSpecialty}
                  selectedDairas={selectedDairas} toggleDaira={toggleDaira}
                  selectedWilaya={selectedWilaya} clearWilaya={() => { setSelectedWilaya(null); setSelectedDairas([]); }} />
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredDoctors.map((doctor: any) => (
                  <motion.div key={doctor.id} layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}>
                    <DoctorCard
                      id={doctor.id} name={doctor.name}
                      specialty={doctor.specialty} daira={doctor.daira}
                      phone={doctor.phone} rating={doctor.rating}
                      reviews={doctor.reviews} consultationFee={doctor.consultationFee}
                      yearsOfExperience={doctor.yearsOfExperience}
                      image={doctor.image} isVerified={doctor.isVerified}
                      clinicName={doctor.clinicName}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredDoctors.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground font-medium">لم يُعثر على أطباء بهذه المواصفات</p>
                <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">مسح الفلاتر</Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ActiveFilters({ selectedSpecialties, toggleSpecialty, selectedDairas, toggleDaira, selectedWilaya, clearWilaya }: any) {
  if (!selectedSpecialties.length && !selectedDairas.length && !selectedWilaya) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {selectedWilaya && (
        <Badge className="gap-1 px-3 py-1 bg-primary/10 text-primary border-primary/30">
          <MapPin className="w-3 h-3" /> {selectedWilaya}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={clearWilaya} />
        </Badge>
      )}
      {selectedSpecialties.map((sp: string) => (
        <Badge key={sp} variant="secondary" className="gap-1 px-3 py-1">
          {sp} <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleSpecialty(sp)} />
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

function Filters({ selectedSpecialties, toggleSpecialty, selectedWilaya, setSelectedWilaya, selectedDairas, toggleDaira, feeRange, setFeeRange, clearFilters }: any) {
  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["specialties", "location"]} className="w-full">
        <AccordionItem value="specialties">
          <AccordionTrigger className="font-heading font-bold">التخصص الطبي</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2 max-h-52 overflow-y-auto pr-1">
              {SPECIALTIES.map(sp => (
                <div key={sp.id} className="flex items-center gap-2">
                  <Checkbox id={`sp-${sp.id}`} checked={selectedSpecialties.includes(sp.label)} onCheckedChange={() => toggleSpecialty(sp.label)} />
                  <Label htmlFor={`sp-${sp.id}`} className="text-sm font-normal cursor-pointer">{sp.label}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location">
          <AccordionTrigger className="font-heading font-bold">المنطقة</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">الولاية</Label>
                <Select onValueChange={setSelectedWilaya} value={selectedWilaya || ""} dir="rtl">
                  <SelectTrigger className="h-9"><SelectValue placeholder="اختر ولاية" /></SelectTrigger>
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
                        <Checkbox id={`loc-${daira}`} checked={selectedDairas.includes(daira)} onCheckedChange={() => toggleDaira(daira)} />
                        <Label htmlFor={`loc-${daira}`} className="text-xs font-normal cursor-pointer">{daira}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fee">
          <AccordionTrigger className="font-heading font-bold">سعر الكشف</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 px-2 space-y-4">
              <div className="text-center font-bold text-primary text-lg">
                {feeRange[0] === 20000 ? "الكل" : `${feeRange[0].toLocaleString()} دج`}
              </div>
              <Slider value={feeRange} onValueChange={setFeeRange} max={20000} min={0} step={500} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 دج</span><span>20,000 دج</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={clearFilters}>مسح الفلاتر</Button>
    </div>
  );
}