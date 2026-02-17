
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
  { id: "carpentry", label: "نجارة", icon: "Hammer" },
  { id: "plumbing", label: "سباكة", icon: "Wrench" },
  { id: "electrical", label: "كهرباء", icon: "Zap" },
  { id: "painting", label: "دهانات", icon: "Paintbrush" },
  { id: "masonry", label: "بناء", icon: "BrickWall" },
  { id: "mechanic", label: "ميكانيك", icon: "Car" },
  { id: "welding", label: "تلحيم", icon: "Flame" },
  { id: "gardening", label: "بستنة", icon: "Flower2" },
  { id: "tailoring", label: "خياطة", icon: "Scissors" },
];

export const MOCK_ARTISANS = [
  {
    id: 1,
    name: "أحمد بن علي",
    category: "نجارة",
    daira: "الجزائر",
    rating: 4.8,
    reviews: 124,
    priceStart: 2000,
    phone: "0550123456",
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=400&fit=crop",
    isVerified: true,
    description: "خبرة 15 سنة في النجارة العصرية والتقليدية. صناعة الأثاث والأبواب والنوافذ."
  },
  {
    id: 2,
    name: "فاطمة الزهراء",
    category: "خياطة وتطريز",
    daira: "وهران",
    rating: 4.9,
    reviews: 89,
    priceStart: 1500,
    phone: "0660987654",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop",
    isVerified: true,
    description: "مختصة في اللباس التقليدي والعصري. خياطة حسب الطلب بجودة عالية."
  },
  {
    id: 3,
    name: "يوسف قدور",
    category: "كهرباء",
    daira: "جيجل",
    rating: 4.5,
    reviews: 56,
    priceStart: 1000,
    phone: "0770112233",
    image: "https://images.unsplash.com/photo-1590674867571-67d801951467?w=400&h=400&fit=crop",
    isVerified: false,
    description: "تركيب وصيانة الشبكات الكهربائية المنزلية والصناعية. تدخل سريع."
  },
  {
    id: 4,
    name: "محمد السعيد",
    category: "سباكة",
    daira: "الجزائر",
    rating: 4.7,
    reviews: 210,
    priceStart: 1200,
    phone: "0555667788",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
    isVerified: true,
    description: "تصليح التسربات وتركيب الأنابيب والتدفئة المركزية."
  }
];

export const MOCK_MESSAGES = [
  {
    id: 1,
    senderId: "customer",
    text: "السلام عليكم، هل أنت متاح لعمل يوم الغد؟",
    time: "10:30 AM",
    isMe: true,
  },
  {
    id: 2,
    senderId: "artisan",
    text: "وعليكم السلام، نعم متاح في الفترة المسائية.",
    time: "10:35 AM",
    isMe: false,
  },
  {
    id: 3,
    senderId: "customer",
    text: "ممتاز، أحتاج تركيب خزانة في حي التفاح.",
    time: "10:36 AM",
    isMe: true,
  },
];
