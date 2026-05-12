export const LOCATIONS: Record<string, string[]> = {
  "تلمسان": ["تلمسان", "ندرومة", "رمشي", "بني صاف", "سبدو", "مغنية", "غزوات", "بن سكران"],
  "الجزائر": ["سيدي امحمد", "الدار البيضاء", "الشراقة", "زرالدة", "بئر مراد رايس", "باب الوادي", "الحراش", "براقي", "حسين داي", "بوزريعة", "بئر خادم", "القبة", "المحمدية", "رويبة", "الرغاية"],
  "سطيف": ["سطيف", "الأرواح", "عين أزال", "عين ولمان", "قجال", "خربة سي خير", "بوقاعة"],
  "عنابة": ["عنابة", "البوني", "سرايدي", "برحال", "الحجار", "العلمة"],
  "المدية": ["المدية", "كاف لخضر", "بني سليمان", "السواقي", "قصر الحكيم", "شلالة العذاورة"],
  "مستغانم": ["مستغانم", "موستاغانم", "عين تادلس", "صيادة", "خير الدين", "حاسي ماماش"],
  "معسكر": ["معسكر", "تيقنين", "قطنة", "بوهني", "سيق", "فروحة", "مامونية"],
  "وهران": ["وهران", "عين الترك", "أرزيو", "بطيوة", "السانية", "قديل", "بئر الجير", "بوتليليس", "مرسى الحجاج"],
  "عين تيموشنت": ["عين تيموشنت", "حمام بوحجر", "بن عزوز", "وادي بركيش", "أولاد كيحول"],
};

export const DAIRAS = Object.keys(LOCATIONS);

export const SPECIALTIES = [
  { id: "general",        label: "طب عام",                  icon: "Stethoscope"  },
  { id: "pediatrics",     label: "طب الأطفال",              icon: "Baby"         },
  { id: "cardiology",     label: "طب القلب",                icon: "HeartPulse"   },
  { id: "dentistry",      label: "طب الأسنان",              icon: "Smile"        },
  { id: "ophthalmology",  label: "طب العيون",               icon: "Eye"          },
  { id: "neurology",      label: "طب الأعصاب",              icon: "Brain"        },
  { id: "gynecology",     label: "طب النساء والتوليد",      icon: "UserRound"    },
  { id: "dermatology",    label: "طب الجلدية",              icon: "Scan"         },
  { id: "orthopedics",    label: "طب العظام",               icon: "Bone"         },
  { id: "ent",            label: "أنف وأذن وحنجرة",         icon: "Ear"          },
  { id: "urology",        label: "طب المسالك البولية",      icon: "Droplets"     },
  { id: "gastro",         label: "أمراض الجهاز الهضمي",    icon: "Activity"     },
  { id: "endocrinology",  label: "طب الغدد الصماء",         icon: "FlaskConical" },
  { id: "psychiatry",     label: "الطب النفسي",             icon: "BrainCircuit" },
  { id: "radiology",      label: "الأشعة والتصوير الطبي",  icon: "ScanLine"     },
  { id: "surgery",        label: "الجراحة العامة",          icon: "Scissors"     },
  { id: "oncology",       label: "طب الأورام",              icon: "Microscope"   },
  { id: "nephrology",     label: "طب الكلى",                icon: "Filter"       },
  { id: "pulmonology",    label: "طب الرئة والتنفس",        icon: "Wind"         },
  { id: "rheumatology",   label: "أمراض الروماتيزم",        icon: "PersonStanding"},
];

/** Returns the Arabic label for a specialty by its id. Falls back to the id itself. */
export function specialtyLabel(id?: string | null): string {
  if (!id) return "";
  return SPECIALTIES.find(s => s.id === id)?.label || id;
}

export const MOCK_DOCTORS = [
];

export const MOCK_MESSAGES = [
  {
    id: 1,
    senderId: "patient",
    text: "السلام عليكم، هل لديك موعد متاح غداً؟",
    time: "10:30 AM",
    isMe: true,
  },
];