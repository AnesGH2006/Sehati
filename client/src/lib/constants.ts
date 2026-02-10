
export const DAIRAS = [
  "الجزائر",
  "وهران",
  "جيجل"
];

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
    daira: "تيارت",
    rating: 4.8,
    reviews: 124,
    priceStart: 2000,
    image: "/attached_assets/artisan-1.jpg", // Placeholder
    isVerified: true,
    description: "خبرة 15 سنة في النجارة العصرية والتقليدية. صناعة الأثاث والأبواب والنوافذ."
  },
  {
    id: 2,
    name: "فاطمة الزهراء",
    category: "خياطة وتطريز",
    daira: "السوقر",
    rating: 4.9,
    reviews: 89,
    priceStart: 1500,
    image: "/attached_assets/artisan-2.jpg", // Placeholder
    isVerified: true,
    description: "مختصة في اللباس التقليدي والعصري. خياطة حسب الطلب بجودة عالية."
  },
  {
    id: 3,
    name: "يوسف قدور",
    category: "كهرباء",
    daira: "فرندة",
    rating: 4.5,
    reviews: 56,
    priceStart: 1000,
    image: "/attached_assets/artisan-1.jpg", // reuse
    isVerified: false,
    description: "تركيب وصيانة الشبكات الكهربائية المنزلية والصناعية. تدخل سريع."
  },
  {
    id: 4,
    name: "محمد السعيد",
    category: "سباكة",
    daira: "قصر الشلالة",
    rating: 4.7,
    reviews: 210,
    priceStart: 1200,
    image: "/attached_assets/artisan-1.jpg", // reuse
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
