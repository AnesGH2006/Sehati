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
import crypto from "crypto";

const DATA_FILE = path.join(process.cwd(), "data.json");

// ── User types ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: "customer" | "artisan";
  artisanId?: number;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: string;
  createdAt: string;
}

interface DataStore {
  artisans: Artisan[];
  artisanIdCounter: number;
  conversations: Conversation[];
  messages: Message[];
  messageIdCounter: number;
  reviews: Review[];
  reviewIdCounter: number;
  users: User[];
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "herfati_salt").digest("hex");
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
        users: data.users || [],
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
    users: [],
  };
}

function saveData(store: DataStore) {
  try {
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
  // ── Auth ──────────────────────────────────────────────────────────────────
  registerUser(name: string, email: string, password: string, phone?: string): Promise<User | null>;
  loginUser(email: string, password: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  linkUserToArtisan(userId: string, artisanId: number): Promise<void>;
  verifyUserEmail(email: string, otp: string): Promise<boolean>;
  setUserOTP(email: string, otp: string): Promise<void>;
  resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean>;

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
  deleteMessage(id: number): Promise<boolean>;
  editMessage(id: number, content: string): Promise<Message | null>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByArtisan(artisanId: number): Promise<Review[]>;
  hasReviewed(artisanId: number, customerId: string): Promise<boolean>;
  deleteReview(id: number): Promise<boolean>;
}

class FileStorage implements IStorage {
  private store: DataStore;

  constructor() {
    this.store = loadData();
  }

  private save() {
    saveData(this.store);
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async registerUser(name: string, email: string, password: string, phone?: string): Promise<User | null> {
    const exists = this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return null;
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      phone,
      role: "customer",
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    this.store.users.push(user);
    this.save();
    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const user = this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.store.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async setUserOTP(email: string, otp: string): Promise<void> {
    const idx = this.store.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return;
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    this.store.users[idx].otp = otp;
    this.store.users[idx].otpExpiry = expiry;
    this.save();
  }

  async verifyUserEmail(email: string, otp: string): Promise<boolean> {
    const idx = this.store.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    const user = this.store.users[idx];
    if (!user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    this.store.users[idx].isVerified = true;
    this.store.users[idx].otp = undefined;
    this.store.users[idx].otpExpiry = undefined;
    this.save();
    return true;
  }

  async resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean> {
    const idx = this.store.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    const user = this.store.users[idx];
    if (!user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    this.store.users[idx].passwordHash = hashPassword(newPassword);
    this.store.users[idx].otp = undefined;
    this.store.users[idx].otpExpiry = undefined;
    this.save();
    return true;
  }

  async linkUserToArtisan(userId: string, artisanId: number): Promise<void> {
    const userIdx = this.store.users.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      this.store.users[userIdx].role = "artisan";
      this.store.users[userIdx].artisanId = artisanId;
    }
    const artisanIdx = this.store.artisans.findIndex(a => a.id === artisanId);
    if (artisanIdx !== -1) {
      this.store.artisans[artisanIdx].userId = userId;
    }
    this.save();
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
    // Also delete related reviews and conversations
    this.store.reviews = this.store.reviews.filter(r => r.artisanId !== id);
    this.store.conversations = this.store.conversations.filter(c => c.artisanId !== id);
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

  async deleteMessage(id: number): Promise<boolean> {
    const before = this.store.messages.length;
    this.store.messages = this.store.messages.filter(m => m.id !== id);
    this.save();
    return this.store.messages.length < before;
  }

  async editMessage(id: number, content: string): Promise<Message | null> {
    const idx = this.store.messages.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.store.messages[idx] = { ...this.store.messages[idx], content };
    this.save();
    return this.store.messages[idx];
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
    this._recalcRating(insertReview.artisanId);
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

  // ── NEW: Delete review & recalculate artisan rating ──────────────────────
  async deleteReview(id: number): Promise<boolean> {
    const review = this.store.reviews.find(r => r.id === id);
    if (!review) return false;
    this.store.reviews = this.store.reviews.filter(r => r.id !== id);
    this._recalcRating(review.artisanId);
    this.save();
    return true;
  }

  // Helper: recalculate rating & reviewCount for an artisan
  private _recalcRating(artisanId: number) {
    const artisanReviews = this.store.reviews.filter(r => r.artisanId === artisanId);
    const artIdx = this.store.artisans.findIndex(a => a.id === artisanId);
    if (artIdx === -1) return;
    if (artisanReviews.length === 0) {
      this.store.artisans[artIdx].rating = 0;
      this.store.artisans[artIdx].reviewCount = 0;
    } else {
      const avg = artisanReviews.reduce((s, r) => s + r.rating, 0) / artisanReviews.length;
      this.store.artisans[artIdx].rating = Math.round(avg * 10) / 10;
      this.store.artisans[artIdx].reviewCount = artisanReviews.length;
    }
  }
}

export const storage = new FileStorage();