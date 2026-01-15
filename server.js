require("dotenv").config()
const app = require("./src/app")

const PORT = process.env.PORT || 3000

console.log("\n" + "=".repeat(60))
console.log("🚀 WhatsApp Land Records Bot - Starting...")
console.log("=".repeat(60))
console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
console.log(`Port: ${PORT}`)
console.log(`Base URL: ${process.env.BASE_URL || "http://localhost:" + PORT}`)
console.log("=".repeat(60))

// Check required environment variables
const requiredEnvVars = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "VERIFY_TOKEN"]

const missingVars = requiredEnvVars.filter((env) => !process.env[env])
if (missingVars.length > 0) {
  console.warn(`\n⚠️  WARNING: Missing environment variables: ${missingVars.join(", ")}`)
  console.warn("   Configure them in .env file or they will be required for full functionality\n")
}

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`)
  console.log("\n📋 Available Endpoints:")
  console.log("   GET  /health                    - Health check")
  console.log("   GET  /webhook                   - Webhook verification")
  console.log("   POST /webhook                   - Receive messages & forms")
  console.log("   GET  /payment/checkout          - Checkout page")
  console.log("   GET  /payment/success           - Payment success callback")
  console.log("   GET  /payment/failure           - Payment failure callback")
  console.log("   GET  /test/data                 - View all data (dev only)")
  console.log("   POST /test/clear                - Clear data (dev only)")
  console.log("\n🔗 ngrok Setup (for local testing):")
  console.log("   1. Run: ngrok http " + PORT)
  console.log("   2. Copy ngrok URL")
  console.log("   3. Set Webhook URL in Meta Dashboard")
  console.log("   4. Test by sending 'hi' on WhatsApp")
  console.log("\n🤖 Bot Status: Ready!")
  console.log("=".repeat(60) + "\n")
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`)
    console.log("\n💡 Quick Fix Options:")
    console.log(`   Option 1: Kill process on port ${PORT}`)
    console.log(`      Windows: netstat -ano | findstr :${PORT}`)
    console.log(`      Then: taskkill /PID <PID> /F`)
    console.log(`      Mac/Linux: lsof -ti:${PORT} | xargs kill -9`)
    console.log(`   Option 2: Use a different port`)
    console.log(`      Set: PORT=3001 npm run dev`)
    console.log("")
    process.exit(1)
  } else {
    throw err
  }
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n📴 SIGTERM received, shutting down gracefully...")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("\n📴 SIGINT received, shutting down gracefully...")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})

// Error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})
