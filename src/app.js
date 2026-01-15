const express = require("express")
const cors = require("cors")
const webhookRoutes = require("./routes/webhook.routes")
const paymentRoutes = require("./routes/payment.routes")

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Routes
app.use("/webhook", webhookRoutes)
app.use("/payment", paymentRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "WhatsApp Land Records Bot",
    uptime: process.uptime(),
  })
})

// Test endpoints (development only)
app.get("/test/data", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" })
  }

  const db = require("./services/database.service")
  Promise.all([db.getUsers(), db.getOrders(), db.getSessions()]).then(([users, orders, sessions]) => {
    res.json({
      users,
      orders,
      sessions,
      stats: {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalSessions: sessions.length,
        completedOrders: orders.filter((o) => o.status === "completed").length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
      },
    })
  })
})

app.post("/test/clear", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" })
  }

  const db = require("./services/database.service")
  db.clearAll()

  res.json({
    message: "All test data cleared",
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: {
      webhook: {
        GET: "/webhook - Verification",
        POST: "/webhook - Receive messages",
      },
      payment: {
        GET: "/payment/checkout - Payment page",
        GET: "/payment/success - Success callback",
        GET: "/payment/failure - Failure callback",
      },
      health: "GET /health",
      test: "GET /test/data, POST /test/clear (dev only)",
    },
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

module.exports = app
