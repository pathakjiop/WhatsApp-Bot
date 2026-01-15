const fs = require("fs").promises
const path = require("path")

class DatabaseService {
  constructor() {
    this.dataDir = process.env.DATA_DIR || "./data"
    this.usersFile = path.join(this.dataDir, "users.json")
    this.ordersFile = path.join(this.dataDir, "orders.json")
    this.sessionsFile = path.join(this.dataDir, "sessions.json")

    // Initialize data directory and files
    this.init()
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })

      // Initialize files if they don't exist
      const files = [
        { path: this.usersFile, default: [] },
        { path: this.ordersFile, default: [] },
        { path: this.sessionsFile, default: [] },
      ]

      for (const file of files) {
        try {
          await fs.access(file.path)
        } catch {
          await fs.writeFile(file.path, JSON.stringify(file.default, null, 2))
        }
      }

      console.log("✅ Database initialized")
    } catch (error) {
      console.error("❌ Database initialization failed:", error)
    }
  }

  // Helper method to read JSON file
  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error)
      return []
    }
  }

  // Helper method to write JSON file
  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error)
      return false
    }
  }

  // User operations
  async createUser(userData) {
    const users = await this.readFile(this.usersFile)
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(newUser)
    await this.writeFile(this.usersFile, users)
    return newUser
  }

  async findUserByWhatsappId(whatsappId) {
    const users = await this.readFile(this.usersFile)
    return users.find((user) => user.whatsappId === whatsappId)
  }

  async findUserById(id) {
    const users = await this.readFile(this.usersFile)
    return users.find((user) => user.id === id)
  }

  async updateUser(whatsappId, updates) {
    const users = await this.readFile(this.usersFile)
    const userIndex = users.findIndex((user) => user.whatsappId === whatsappId)

    if (userIndex === -1) {
      return null
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.usersFile, users)
    return users[userIndex]
  }

  async upsertUser(whatsappId, userData) {
    const existingUser = await this.findUserByWhatsappId(whatsappId)

    if (existingUser) {
      return this.updateUser(whatsappId, userData)
    } else {
      return this.createUser({ whatsappId, ...userData })
    }
  }

  // Order operations
  async createOrder(orderData) {
    const orders = await this.readFile(this.ordersFile)
    const newOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
      paymentStatus: "pending",
    }

    orders.push(newOrder)
    await this.writeFile(this.ordersFile, orders)
    return newOrder
  }

  async findOrderById(id) {
    const orders = await this.readFile(this.ordersFile)
    return orders.find((order) => order.id === id)
  }

  async findOrderByOrderId(orderId) {
    const orders = await this.readFile(this.ordersFile)
    return orders.find((order) => order.orderId === orderId)
  }

  async findOrdersByWhatsappId(whatsappId) {
    const orders = await this.readFile(this.ordersFile)
    return orders.filter((order) => order.whatsappId === whatsappId)
  }

  async updateOrder(orderId, updates) {
    const orders = await this.readFile(this.ordersFile)
    const orderIndex = orders.findIndex((order) => order.orderId === orderId)

    if (orderIndex === -1) {
      return null
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.ordersFile, orders)
    return orders[orderIndex]
  }

  // Session operations
  async createSession(sessionData) {
    const sessions = await this.readFile(this.sessionsFile)
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...sessionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    sessions.push(newSession)
    await this.writeFile(this.sessionsFile, sessions)
    return newSession
  }

  async findSessionByWhatsappId(whatsappId) {
    const sessions = await this.readFile(this.sessionsFile)
    return sessions.find((session) => session.whatsappId === whatsappId)
  }

  async updateSession(whatsappId, updates) {
    const sessions = await this.readFile(this.sessionsFile)
    const sessionIndex = sessions.findIndex((session) => session.whatsappId === whatsappId)

    if (sessionIndex === -1) {
      return null
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.sessionsFile, sessions)
    return sessions[sessionIndex]
  }

  async createOrUpdateSession(whatsappId, sessionData) {
    const existingSession = await this.findSessionByWhatsappId(whatsappId)

    if (existingSession) {
      return this.updateSession(whatsappId, sessionData)
    } else {
      return this.createSession(sessionData)
    }
  }

  // Get all data (for testing)
  async getUsers() {
    return await this.readFile(this.usersFile)
  }

  async getOrders() {
    return await this.readFile(this.ordersFile)
  }

  async getSessions() {
    return await this.readFile(this.sessionsFile)
  }

  getStats() {
    return {
      usersCount: this.getUsers().then((users) => users.length),
      ordersCount: this.getOrders().then((orders) => orders.length),
      sessionsCount: this.getSessions().then((sessions) => sessions.length),
    }
  }

  // Clear all data (for testing)
  async clearAll() {
    await this.writeFile(this.usersFile, [])
    await this.writeFile(this.ordersFile, [])
    await this.writeFile(this.sessionsFile, [])
    console.log("🧹 All data cleared")
  }
}

// Create singleton instance
const databaseService = new DatabaseService()

module.exports = databaseService
