import { 
  type User, 
  type InsertUser, 
  type Artisan, 
  type InsertArtisan,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  users,
  artisans,
  messages,
  conversations
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getArtisan(id: number): Promise<Artisan | undefined>;
  getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]>;
  createArtisan(artisan: InsertArtisan): Promise<Artisan>;
  updateArtisan(id: number, updates: Partial<InsertArtisan>): Promise<Artisan | undefined>;
  
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string, role: 'artisan' | 'customer'): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private artisanList: Artisan[] = [];
  private artisanIdCounter = 1;
  private conversationMap: Map<string, Conversation> = new Map();
  private messageList: Message[] = [];
  private messageIdCounter = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = `user-${Date.now()}`;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      role: insertUser.role || "customer",
      showPassword: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getArtisan(id: number): Promise<Artisan | undefined> {
    return this.artisanList.find(a => a.id === id);
  }

  async getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]> {
    let result = [...this.artisanList];
    if (filters?.category) {
      result = result.filter(a => a.category === filters.category);
    }
    if (filters?.daira) {
      result = result.filter(a => a.daira === filters.daira);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(s) || 
        (a.description && a.description.toLowerCase().includes(s))
      );
    }
    if (filters?.minPrice !== undefined) {
      result = result.filter(a => a.priceStart >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      result = result.filter(a => a.priceStart <= filters.maxPrice!);
    }
    return result;
  }

  async createArtisan(insertArtisan: InsertArtisan): Promise<Artisan> {
    const artisan: Artisan = {
      id: this.artisanIdCounter++,
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
    this.artisanList.push(artisan);
    return artisan;
  }

  async updateArtisan(id: number, updates: Partial<InsertArtisan>): Promise<Artisan | undefined> {
    const idx = this.artisanList.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.artisanList[idx] = { ...this.artisanList[idx], ...updates } as Artisan;
    return this.artisanList[idx];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversationMap.get(id);
  }

  async getConversationsByUser(userId: string, role: 'artisan' | 'customer'): Promise<Conversation[]> {
    return Array.from(this.conversationMap.values()).filter(c =>
      role === 'customer' ? c.customerId === userId : String(c.artisanId) === userId
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const conversation: Conversation = {
      id: insertConversation.id,
      artisanId: insertConversation.artisanId,
      customerId: insertConversation.customerId,
      lastMessageAt: new Date(),
      lastMessage: insertConversation.lastMessage || null,
      createdAt: new Date(),
    };
    this.conversationMap.set(conversation.id, conversation);
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageList.filter(m => m.conversationId === conversationId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.messageIdCounter++,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      receiverId: insertMessage.receiverId,
      senderType: insertMessage.senderType,
      content: insertMessage.content,
      isRead: false,
      createdAt: new Date(),
    };
    this.messageList.push(message);
    const conv = this.conversationMap.get(insertMessage.conversationId);
    if (conv) {
      conv.lastMessageAt = new Date();
      conv.lastMessage = insertMessage.content;
    }
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    this.messageList.forEach(m => {
      if (m.conversationId === conversationId && m.receiverId === userId) {
        m.isRead = true;
      }
    });
  }
}

export const storage = new MemStorage();
