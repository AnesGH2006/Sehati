
export const LOCATIONS = {
  "الجزائر": [
    "سيدي امحمد",
    "الدار البيضاء",
    "الشراقة",
    "زرالدة",
    "بئر مراد رايس",
    "باب الوادي",
    "الحراش",
    "براقي",
    "حسين داي",
    "بوزريعة"
  ],
  "وهران": [
    "وهران",
    "عين الترك",
    "أرزيو",
    "بطيوة",
    "السانية",
    "قديل",
    "بئر الجير",
    "بوتليليس"
  ],
  "جيجل": [
    "جيجل",
    "الطاهير",
    "الميلية",
    "الجيملة",
    "زيامة منصورية"
  ]
};

export const DAIRAS = Object.keys(LOCATIONS);

export const CATEGORIES = [
  { id: "carpentry", label: "نجارة(نجار)", icon: "Hammer" },
  { id: "plumbing", label: "سباكة(بلومبي)", icon: "Wrench" },
  { id: "electrical", label: "كهرباء (فولتاجي)", icon: "Zap" },
  { id: "painting", label: "دهانات(صباغ)", icon: "Paintbrush" },
  { id: "masonry", label: "بناء(ماصون)", icon: "BrickWall" },
  { id: "mechanic", label: "ميكانيك(ميكانيسيان)", icon: "Car" },
  { id: "welding", label: "تلحيم(سودار)", icon: "Flame" },
  { id: "gardening", label: "بستنة(فلاح)", icon: "Flower2" },
  { id: "tailoring", label: "خياطة(خياط)", icon: "Scissors" },
];

export const MOCK_ARTISANS = [
  {
    id: 1,
    name: "أحمد بن علي",
  },
];

export const MOCK_MESSAGES = [
  {
    id: 1,
    senderId: "customer",
    text: "السلام عليكم، هل أنت متاح لعمل يوم الغد؟",
    time: "10:30 AM",
    isMe: true,
  },
];
