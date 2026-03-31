import { 
  type Artisan, 
  type InsertArtisan,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
} from "@shared/schema";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

interface DataStore {
  artisans: Artisan[];
  artisanIdCounter: number;
  conversations: Conversation[];
  messages: Message[];
  messageIdCounter: number;
  reviews: Review[];
  reviewIdCounter: number;
}

function loadData(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(raw);
      return {
        artisans: data.artisans || [],
        artisanIdCounter: data.artisanIdCounter || 1,
        conversations: data.conversations || [],
        messages: data.messages || [],
        messageIdCounter: data.messageIdCounter || 1,
        reviews: data.reviews || [],
        reviewIdCounter: data.reviewIdCounter || 1,
      };
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return {
    artisans: [],
    artisanIdCounter: 1,
    conversations: [],
    messages: [],
    messageIdCounter: 1,
    reviews: [],
    reviewIdCounter: 1,
  };
}

function saveData(store: DataStore) {
  try {
    // Never store base64 images in the JSON file — only file paths / URLs
    const toSave: DataStore = {
      ...store,
      artisans: store.artisans.map(a => ({
        ...a,
        portfolioImages: (a.portfolioImages || []).filter((img: string) => !img.startsWith("data:")),
        imageUrl: a.imageUrl?.startsWith("data:") ? null : a.imageUrl,
      })),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export interface IStorage {
  getArtisan(id: number): Promise<Artisan | undefined>;
  getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]>;
  createArtisan(artisan: InsertArtisan): Promise<Artisan>;
  updateArtisan(id: number, updates: Partial<Artisan>): Promise<Artisan | undefined>;
  deleteArtisan(id: number): Promise<boolean>;

  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string, role: 'artisan' | 'customer'): Promise<Conversation[]>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(conv: InsertConversation): Promise<Conversation>;

  getMessages(conversationId: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByArtisan(artisanId: number): Promise<Review[]>;
  hasReviewed(artisanId: number, customerId: string): Promise<boolean>;
}

class FileStorage implements IStorage {
  private store: DataStore;

  constructor() {
    this.store = loadData();
  }

  private save() {
    saveData(this.store);
  }

  async getArtisan(id: number): Promise<Artisan | undefined> {
    return this.store.artisans.find(a => a.id === id);
  }

  async getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]> {
    let result = [...this.store.artisans];
    if (filters?.category) result = result.filter(a => a.category === filters.category);
    if (filters?.daira) result = result.filter(a => a.daira === filters.daira);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    if (filters?.minPrice !== undefined) result = result.filter(a => a.priceStart >= filters.minPrice!);
    if (filters?.maxPrice !== undefined) result = result.filter(a => a.priceStart <= filters.maxPrice!);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createArtisan(insertArtisan: InsertArtisan): Promise<Artisan> {
    const artisan: Artisan = {
      id: this.store.artisanIdCounter++,
      userId: insertArtisan.userId || null,
      name: insertArtisan.name,
      email: insertArtisan.email,
      phone: insertArtisan.phone,
      category: insertArtisan.category,
      wilaya: insertArtisan.wilaya || "الجزائر",
      daira: insertArtisan.daira,
      description: insertArtisan.description || null,
      priceStart: insertArtisan.priceStart || 1000,
      rating: 0,
      reviewCount: 0,
      isVerified: insertArtisan.isVerified || false,
      yearsOfExperience: insertArtisan.yearsOfExperience || 0,
      imageUrl: insertArtisan.imageUrl || null,
      portfolioImages: insertArtisan.portfolioImages || [],
      languages: insertArtisan.languages || ["العربية"],
      workingHours: insertArtisan.workingHours || null,
      subscriptionType: insertArtisan.subscriptionType || "free",
      subscriptionDuration: insertArtisan.subscriptionDuration || 1,
      subscriptionExpiresAt: insertArtisan.subscriptionExpiresAt || null,
      createdAt: new Date(),
    };
    this.store.artisans.push(artisan);
    this.save();
    return artisan;
  }

  async updateArtisan(id: number, updates: Partial<Artisan>): Promise<Artisan | undefined> {
    const idx = this.store.artisans.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.store.artisans[idx] = { ...this.store.artisans[idx], ...updates };
    this.save();
    return this.store.artisans[idx];
  }

  async deleteArtisan(id: number): Promise<boolean> {
    const before = this.store.artisans.length;
    this.store.artisans = this.store.artisans.filter(a => a.id !== id);
    this.save();
    return this.store.artisans.length < before;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.store.conversations.find(c => c.id === id);
  }

  async getConversationsByUser(userId: string, role: 'artisan' | 'customer'): Promise<Conversation[]> {
    return this.store.conversations
      .filter(c => role === 'customer' ? c.customerId === userId : String(c.artisanId) === userId)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async getAllConversations(): Promise<Conversation[]> {
    return [...this.store.conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const existing = this.store.conversations.find(c => c.id === insertConversation.id);
    if (existing) {
      // Update customerName if now known
      if (insertConversation.customerName && !existing.customerName) {
        existing.customerName = insertConversation.customerName;
        this.save();
      }
      return existing;
    }
    const conversation: Conversation = {
      id: insertConversation.id,
      artisanId: insertConversation.artisanId,
      customerId: insertConversation.customerId,
      customerName: insertConversation.customerName || null,
      lastMessageAt: new Date(),
      lastMessage: insertConversation.lastMessage || null,
      createdAt: new Date(),
    };
    this.store.conversations.push(conversation);
    this.save();
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.store.messages.filter(m => m.conversationId === conversationId);
  }

  async getAllMessages(): Promise<Message[]> {
    return [...this.store.messages];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.store.messageIdCounter++,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      receiverId: insertMessage.receiverId,
      senderType: insertMessage.senderType,
      content: insertMessage.content,
      isRead: false,
      createdAt: new Date(),
    };
    this.store.messages.push(message);
    const conv = this.store.conversations.find(c => c.id === insertMessage.conversationId);
    if (conv) {
      conv.lastMessageAt = new Date();
      conv.lastMessage = insertMessage.content.startsWith("data:image") ? "📷 صورة" : insertMessage.content;
    }
    this.save();
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    this.store.messages.forEach(m => {
      if (m.conversationId === conversationId && m.receiverId === userId) m.isRead = true;
    });
    this.save();
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      id: this.store.reviewIdCounter++,
      artisanId: insertReview.artisanId,
      customerId: insertReview.customerId,
      customerName: insertReview.customerName,
      rating: insertReview.rating,
      comment: insertReview.comment || null,
      createdAt: new Date(),
    };
    this.store.reviews.push(review);
    // Recompute artisan rating
    const artisanReviews = this.store.reviews.filter(r => r.artisanId === insertReview.artisanId);
    const avg = artisanReviews.reduce((s, r) => s + r.rating, 0) / artisanReviews.length;
    const artIdx = this.store.artisans.findIndex(a => a.id === insertReview.artisanId);
    if (artIdx !== -1) {
      this.store.artisans[artIdx].rating = Math.round(avg * 10) / 10;
      this.store.artisans[artIdx].reviewCount = artisanReviews.length;
    }
    this.save();
    return review;
  }

  async getReviewsByArtisan(artisanId: number): Promise<Review[]> {
    return this.store.reviews
      .filter(r => r.artisanId === artisanId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async hasReviewed(artisanId: number, customerId: string): Promise<boolean> {
    return this.store.reviews.some(r => r.artisanId === artisanId && r.customerId === customerId);
  }
}

export const storage = new FileStorage();
