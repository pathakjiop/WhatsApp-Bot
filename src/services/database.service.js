class InMemoryDB {
  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.sessions = new Map();
  }

  // User operations
  async createUser(data) {
    const user = {
      ...data,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.id, user);
    this.users.set(user.whatsappId, user); // Also index by whatsappId
    
    console.log('📝 InMemoryDB: User created', { id: user.id, whatsappId: user.whatsappId });
    return user;
  }

  async findUserByWhatsappId(whatsappId) {
    return this.users.get(whatsappId);
  }

  async findUserById(id) {
    return this.users.get(id);
  }

  async updateUser(whatsappId, data) {
    const user = await this.findUserByWhatsappId(whatsappId);
    if (user) {
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    }
    return null;
  }

  async upsertUser(query, data) {
    const existing = await this.findUserByWhatsappId(query.whatsappId);
    if (existing) {
      return this.updateUser(query.whatsappId, data);
    } else {
      return this.createUser({ ...query, ...data });
    }
  }

  // Order operations
  async createOrder(data) {
    const order = {
      ...data,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.orders.set(order.id, order);
    this.orders.set(order.orderId, order); // Also index by orderId
    
    console.log('📝 InMemoryDB: Order created', { id: order.id, orderId: order.orderId });
    return order;
  }

  async findOrderById(id) {
    return this.orders.get(id);
  }

  async findOrderByOrderId(orderId) {
    return this.orders.get(orderId);
  }

  async findOrderByRazorpayOrderId(razorpayOrderId) {
    return Array.from(this.orders.values()).find(
      order => order.razorpayOrderId === razorpayOrderId
    );
  }

  async updateOrder(orderId, data) {
    const order = await this.findOrderByOrderId(orderId);
    if (order) {
      Object.assign(order, data, { updatedAt: new Date() });
      return order;
    }
    return null;
  }

  async findOrdersByWhatsappId(whatsappId) {
    return Array.from(this.orders.values()).filter(
      order => order.whatsappId === whatsappId
    );
  }

  // Session operations
  async createSession(userId, data) {
    const session = {
      userId,
      ...data,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sessions.set(session.id, session);
    this.sessions.set(userId, session); // Also index by userId
    
    return session;
  }

  async findSessionByUserId(userId) {
    return this.sessions.get(userId);
  }

  async updateSession(userId, data) {
    const session = await this.findSessionByUserId(userId);
    if (session) {
      Object.assign(session, data, { updatedAt: new Date() });
      return session;
    }
    return null;
  }

  // Statistics
  getStats() {
    return {
      users: this.users.size / 2, // Divide by 2 because we store each user twice
      orders: this.orders.size / 2,
      sessions: this.sessions.size / 2,
    };
  }

  // Clear all data (for testing)
  clear() {
    this.users.clear();
    this.orders.clear();
    this.sessions.clear();
    console.log('🧹 InMemoryDB: All data cleared');
  }
}

// Create singleton instance
const inMemoryDB = new InMemoryDB();

// Check if we should use in-memory DB
const useInMemoryDB = !process.env.MONGODB_URI || process.env.NODE_ENV === 'test';

if (useInMemoryDB) {
  console.log('📝 Using InMemoryDB for development/testing');
}

module.exports = {
  inMemoryDB,
  useInMemoryDB,
};