# 🚀 WhatsApp Land Records Bot - Complete Code Flow Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Detailed File-by-File Flow](#detailed-file-by-file-flow)
4. [Complete User Journey Flow](#complete-user-journey-flow)
5. [Ngrok Integration](#ngrok-integration)
6. [Data Flow](#data-flow)

---

## System Overview

This is a WhatsApp chatbot that helps users apply for land record services (8A Form, 7/12 Form, Ferfar, Property Card) through an automated conversation flow with form filling and payment processing.

**Tech Stack:**

- Node.js + Express.js (Backend Server)
- WhatsApp Business API (Messaging)
- Meta Graph API (WhatsApp Integration)
- File-based JSON Database (Data Storage)
- Ngrok (Local Development Tunneling)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S WHATSAPP APP                         │
│                    (User sends message: "hi")                       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Message sent via WhatsApp
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      META/FACEBOOK SERVERS                          │
│              (WhatsApp Business API Platform)                       │
│                                                                     │
│  • Receives message from user                                      │
│  • Converts to webhook POST request                                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS POST /webhook
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          NGROK TUNNEL                               │
│                  (For Local Development Only)                       │
│                                                                     │
│  https://abc123.ngrok.io → http://localhost:3000                   │
│                                                                     │
│  • Forwards webhook from Meta to local server                      │
│  • Provides public URL for local testing                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ POST http://localhost:3000/webhook
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      YOUR EXPRESS SERVER                            │
│                     (Running on Port 3000)                          │
│                                                                     │
│  ┌──────────────┐                                                  │
│  │  server.js   │ ← Entry Point                                    │
│  │              │   • Loads environment variables (.env)            │
│  │              │   • Starts Express server                         │
│  │              │   • Imports app.js                                │
│  └──────┬───────┘                                                  │
│         │                                                           │
│         ↓                                                           │
│  ┌──────────────┐                                                  │
│  │   app.js     │ ← Main Application Setup                         │
│  │              │   • Configures Express middleware                │
│  │              │   • Sets up CORS                                  │
│  │              │   • Registers route handlers                      │
│  │              │   • /webhook → webhook.routes.js                 │
│  │              │   • /payment → payment.routes.js                 │
│  └──────┬───────┘                                                  │
│         │                                                           │
│         ↓                                                           │
│  ┌──────────────────────────────────────────────────┐             │
│  │        ROUTES LAYER                              │             │
│  ├──────────────────────────────────────────────────┤             │
│  │                                                  │             │
│  │  webhook.routes.js      payment.routes.js       │             │
│  │  • GET /webhook         • GET /checkout          │             │
│  │  • POST /webhook        • GET /success           │             │
│  │                         • GET /failure           │             │
│  └──────────────────┬───────────────────────────────┘             │
│                     │                                              │
│                     ↓                                              │
│  ┌──────────────────────────────────────────────────┐             │
│  │        CONTROLLERS LAYER                         │             │
│  ├──────────────────────────────────────────────────┤             │
│  │                                                  │             │
│  │  webhook.controller.js  payment.controller.js    │             │
│  │  • verify()            • handleSuccess()         │             │
│  │  • handleWebhook()     • handleFailure()         │             │
│  │  • handleIncoming...() • createPaymentLink()     │             │
│  │                                                  │             │
│  │  message.controller.js                           │             │
│  │  • handleMessage()                               │             │
│  │  • triggerServiceFlow()                          │             │
│  │  • handleFlowCompletion()                        │             │
│  └──────────────────┬───────────────────────────────┘             │
│                     │                                              │
│                     ↓                                              │
│  ┌──────────────────────────────────────────────────┐             │
│  │        SERVICES LAYER                            │             │
│  ├──────────────────────────────────────────────────┤             │
│  │                                                  │             │
│  │  whatsapp.service.js                             │             │
│  │  • sendMessage()                                 │             │
│  │  • sendTextMessage()                             │             │
│  │  • sendInteractiveMessage()                      │             │
│  │  • sendPaymentLink()                             │             │
│  │                                                  │             │
│  │  database.service.js                             │             │
│  │  • upsertUser()                                  │             │
│  │  • createOrder()                                 │             │
│  │  • updateOrder()                                 │             │
│  │  • createOrUpdateSession()                       │             │
│  │                                                  │             │
│  │  payment.service.js                              │             │
│  │  • createPaymentLink()                           │             │
│  │  • verifyPayment()                               │             │
│  └──────────────────┬───────────────────────────────┘             │
│                     │                                              │
│                     ↓                                              │
│  ┌──────────────────────────────────────────────────┐             │
│  │        DATA STORAGE (JSON Files)                 │             │
│  ├──────────────────────────────────────────────────┤             │
│  │                                                  │             │
│  │  ./data/users.json                               │             │
│  │  ./data/orders.json                              │             │
│  │  ./data/sessions.json                            │             │
│  └──────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Response sent back through ngrok
                                 ↓
                        User receives message
```

---

## Detailed File-by-File Flow

### 1️⃣ **server.js** (Entry Point)

**Location:** Root directory  
**Purpose:** Bootstrap the application

```javascript
FLOW:
1. Load environment variables from .env file
   ↓
2. Import app.js (Express application)
   ↓
3. Define PORT (default: 3000)
   ↓
4. Check required environment variables:
   - WHATSAPP_ACCESS_TOKEN
   - WHATSAPP_PHONE_NUMBER_ID
   - VERIFY_TOKEN
   ↓
5. Start Express server on PORT
   ↓
6. Listen for HTTP requests
   ↓
7. Log available endpoints
   ↓
8. Setup error handlers:
   - EADDRINUSE (port already in use)
   - SIGTERM/SIGINT (graceful shutdown)
   - uncaughtException
   - unhandledRejection
```

**What Happens:**

- Server starts listening on port 3000
- Waits for incoming HTTP requests
- All requests are forwarded to `app.js`

**Console Output:**

```
============================================================
🚀 WhatsApp Land Records Bot - Starting...
============================================================
Environment: development
Port: 3000
Base URL: http://localhost:3000
============================================================
✅ Server running on http://localhost:3000
```

---

### 2️⃣ **src/app.js** (Application Configuration)

**Purpose:** Configure Express app and define routes

```javascript
FLOW:
1. Create Express application instance
   ↓
2. Apply middleware:
   - cors() → Enable cross-origin requests
   - express.json() → Parse JSON request bodies
   - express.urlencoded() → Parse URL-encoded data
   ↓
3. Register route handlers:
   - /webhook → webhookRoutes
   - /payment → paymentRoutes
   - /health → Health check endpoint
   - /test/data → View database (dev only)
   - /test/clear → Clear database (dev only)
   ↓
4. Setup 404 handler (unknown routes)
   ↓
5. Setup global error handler
   ↓
6. Export app module
```

**Route Mapping:**

```
GET  /health              → Health check
GET  /webhook             → Webhook verification
POST /webhook             → Receive WhatsApp messages
GET  /payment/checkout    → Payment checkout page
GET  /payment/success     → Payment success callback
GET  /payment/failure     → Payment failure callback
GET  /test/data           → View all data (dev only)
POST /test/clear          → Clear data (dev only)
```

---

### 3️⃣ **src/routes/webhook.routes.js** (Webhook Routes)

**Purpose:** Define webhook endpoints

```javascript
FLOW:
1. Import webhookController
   ↓
2. Define routes:
   - GET  / → webhookController.verify()
   - POST / → webhookController.handleWebhook()
   ↓
3. Export router
```

**Route Handlers:**

- `GET /webhook` → Used by Meta to verify webhook URL
- `POST /webhook` → Receives messages from WhatsApp users

---

### 4️⃣ **src/controllers/webhook.controller.js** (Webhook Logic)

**Purpose:** Handle all webhook-related operations

#### Method: `verify(req, res)` - Webhook Verification

**When Called:** When Meta tries to verify your webhook URL (one-time setup)

```javascript
FLOW:
1. Extract query parameters:
   - hub.mode
   - hub.verify_token
   - hub.challenge
   ↓
2. Validate:
   - mode === "subscribe"
   - token === process.env.VERIFY_TOKEN
   ↓
3. If valid:
   - Return challenge (200 OK)
   ↓
4. If invalid:
   - Return 403 Forbidden
```

**Example Request from Meta:**

```
GET /webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=123456
```

**Response:**

```
200 OK
Body: 123456
```

---

#### Method: `handleWebhook(req, res)` - Main Webhook Handler

**When Called:** Every time a user sends a message on WhatsApp

```javascript
FLOW:
1. Receive webhook POST from Meta
   ↓
2. Extract req.body.entry array
   ↓
3. Loop through each entry
   ↓
4. Loop through each change in entry
   ↓
5. Check value type:
   
   A. If value.messages exists:
      → Call handleIncomingMessages(value)
      
   B. If value.statuses exists:
      → Call handleStatusUpdates(value)
      
   C. If value.errors exists:
      → Call handleErrors(value)
   ↓
6. Always return 200 OK (even on error)
   - Meta retries if we return 500
```

**Webhook Payload Example:**

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "type": "text",
                "id": "wamid.abc123",
                "timestamp": "1234567890",
                "text": {
                  "body": "hi"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

#### Method: `handleIncomingMessages(value)` - Process Messages

```javascript
FLOW:
1. Extract messages array from value
   ↓
2. Loop through each message
   ↓
3. Log message details:
   - From (phone number)
   - Type (text/interactive/button)
   - ID (message ID)
   - Timestamp
   ↓
4. Route by message type:

   A. TYPE = "text":
      → Extract message.text.body
      → Call messageController.handleMessage(from, text)
      
   B. TYPE = "interactive":
      → Check if button_reply or nfm_reply (flow)
      → If flow: handleFlowCompletion()
      → If button: handleMessage()
      
   C. TYPE = "button":
      → Extract button.text
      → Call handleMessage()
      
   D. Other types:
      → Send error message to user
```

---

### 5️⃣ **src/controllers/message.controller.js** (Message Processing)

**Purpose:** Process user messages and manage conversation flow

#### Method: `handleMessage(from, messageText, messageType)`

**When Called:** When user sends text message or clicks button

```javascript
FLOW:
1. Log incoming message details
   ↓
2. Ensure user exists in database:
   → database.upsertUser(from, userData)
   ↓
3. Normalize message text:
   → text.toLowerCase().trim()
   ↓
4. Match message against patterns:

   A. text === "hi" OR "hello" OR "start":
      ┌─────────────────────────────────────┐
      │ 1. Load welcomeMessage() template   │
      │ 2. Send interactive button message  │
      │    with service options:            │
      │    - 8A Form                        │
      │    - 7/12 Form                      │
      │    - Ferfar                         │
      │    - Property Card                  │
      │ 3. Wait for user selection          │
      └─────────────────────────────────────┘
   
   B. text === "8a_service" OR "8a" OR "8a form":
      → triggerServiceFlow(from, "8a_service", "8A Form")
      
   C. text === "712_service" OR "712" OR "7/12":
      → triggerServiceFlow(from, "712_service", "7/12 Form")
      
   D. text === "ferfar_service" OR "ferfar":
      → triggerServiceFlow(from, "ferfar_service", "Ferfar")
      
   E. text === "property_card_service" OR "property" OR "property card":
      → triggerServiceFlow(from, "property_card_service", "Property Card")
      
   F. No match:
      → Send default error message
      → Prompt user to type "hi"
```

---

#### Method: `triggerServiceFlow(whatsappId, serviceId, serviceName)`

**When Called:** User selects a service

```javascript
FLOW:
1. Create/update session in database:
   {
     whatsappId: "919876543210",
     step: "awaiting_flow_completion",
     selectedService: "8a_service",
     serviceName: "8A Form",
     createdAt: "2025-01-19T10:30:00Z"
   }
   ↓
2. Build WhatsApp Flow message:
   → buildFlowMessage(serviceId, serviceName)
   ↓
3. Send interactive flow message to user:
   {
     type: "interactive",
     interactive: {
       type: "flow",
       header: { text: "8A Form" },
       body: { text: "Please fill out the form..." },
       action: {
         name: "flow",
         parameters: {
           flow_id: "1234567890",
           flow_token: "token_1234567890_8a_service",
           flow_cta: "Start Form"
         }
       }
     }
   }
   ↓
4. WhatsApp app opens form for user to fill
```

**What User Sees:**

```
┌────────────────────────────────┐
│  8A Form                       │
├────────────────────────────────┤
│ Please fill out the 8A form    │
│ to proceed with your           │
│ application.                   │
│                                │
│  [ Start Form ]  ← Button     │
│                                │
│ Your data is secure and        │
│ encrypted.                     │
└────────────────────────────────┘
```

---

#### Method: `handleFlowCompletion(whatsappId, flowToken, flowData)`

**When Called:** User completes and submits the WhatsApp Flow form

```javascript
FLOW:
1. User fills form in WhatsApp
   ↓
2. WhatsApp sends webhook with form data:
   {
     "interactive": {
       "nfm_reply": {
         "response_json": "{\"name\":\"John\",\"village\":\"ABC\",...}"
       }
     }
   }
   ↓
3. Parse flow data from JSON string
   ↓
4. Retrieve user session from database:
   → database.findSessionByWhatsappId(whatsappId)
   ↓
5. Create order in database:
   {
     orderId: "ORD_1234567890_abc123",
     whatsappId: "919876543210",
     serviceType: "8A Form",
     userData: { name: "John", village: "ABC", ... },
     amount: 500,
     status: "pending",
     paymentStatus: "pending",
     createdAt: "2025-01-19T10:35:00Z"
   }
   ↓
6. Update session with order details:
   {
     step: "awaiting_payment",
     orderId: "ORD_1234567890_abc123"
   }
   ↓
7. Generate payment link:
   http://localhost:3000/payment/checkout?orderId=ORD_1234567890_abc123&whatsappId=919876543210
   ↓
8. Send confirmation message to user:
   "Thank you for filling the form!
    Order ID: ORD_1234567890_abc123
    Service: 8A Form
    Amount: ₹500
    Click below to proceed with payment:"
   ↓
9. Send payment link message:
   → whatsappService.sendPaymentLink()
```

**User receives:**

```
Thank you for filling the form!

Order ID: ORD_1234567890_abc123
Service: 8A Form
Amount: ₹500

Click below to proceed with payment:
```

Then another message:

```
💰 Payment Required

Service: 8A Form
Amount: ₹500
Order ID: ORD_1234567890_abc123

Please pay using this link:
http://localhost:3000/payment/checkout?orderId=...

After payment, you'll receive confirmation here.
```

---

### 6️⃣ **src/services/whatsapp.service.js** (WhatsApp API Integration)

**Purpose:** Send messages to WhatsApp users via Meta Graph API

#### Method: `sendMessage(to, message)`

```javascript
FLOW:
1. Check if real WhatsApp credentials exist
   ↓
2. If credentials missing:
   → Return mock response (test mode)
   → Log warning
   ↓
3. Build API request:
   URL: https://graph.facebook.com/v19.0/{phoneNumberId}/messages
   Method: POST
   Headers:
     - Authorization: Bearer {accessToken}
     - Content-Type: application/json
   Body:
     {
       messaging_product: "whatsapp",
       recipient_type: "individual",
       to: "919876543210",
       ...message
     }
   ↓
4. Make HTTP request to WhatsApp API
   ↓
5. Handle response:
   - Success: Return message ID
   - Error: Log error, return mock response
```

**Example API Call:**

```javascript
POST https://graph.facebook.com/v19.0/123456789/messages
Authorization: Bearer EAAxxxxxxxxxx
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919876543210",
  "type": "text",
  "text": {
    "body": "Hello from the bot!"
  }
}
```

**Response from WhatsApp:**

```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "919876543210",
      "wa_id": "919876543210"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLOTE5ODc2NTQzMjEwFQIAERgSQzAyQjYxMDkxRjQ0QTA2MjY1AA=="
    }
  ]
}
```

---

#### Other Methods:

**`sendTextMessage(to, text)`**

- Wrapper for sending simple text messages
- Calls `sendMessage()` with text type

**`sendPaymentLink(to, orderDetails)`**

- Formats payment details
- Sends as text message with link

**`sendConfirmation(to, orderDetails)`**

- Sends order confirmation after payment
- Includes order details and success message

---

### 7️⃣ **src/services/database.service.js** (Data Persistence)

**Purpose:** Store and retrieve data using JSON files

**Storage Location:** `./data/` directory

**Files:**

- `users.json` - User profiles
- `orders.json` - Order records
- `sessions.json` - Conversation sessions

#### Initialization Flow:

```javascript
FLOW:
1. Constructor creates DatabaseService instance
   ↓
2. Define file paths:
   - usersFile: ./data/users.json
   - ordersFile: ./data/orders.json
   - sessionsFile: ./data/sessions.json
   ↓
3. Call init() method:
   → Create ./data/ directory if not exists
   → Create JSON files with [] if not exist
   ↓
4. Ready to read/write data
```

#### Key Methods:

**`upsertUser(whatsappId, userData)`**

```javascript
FLOW:
1. Check if user exists with whatsappId
   ↓
2. If exists:
   → Update existing user record
   ↓
3. If not exists:
   → Create new user record
   {
     id: "user_1234567890_abc123",
     whatsappId: "919876543210",
     phoneNumber: "919876543210",
     lastSeen: "2025-01-19T10:30:00Z",
     lastMessage: "hi",
     createdAt: "2025-01-19T10:30:00Z",
     updatedAt: "2025-01-19T10:30:00Z"
   }
   ↓
4. Save to users.json
   ↓
5. Return user object
```

**`createOrder(orderData)`**

```javascript
FLOW:
1. Generate unique order ID
   ↓
2. Create order object:
   {
     id: "order_1234567890_abc123",
     orderId: "ORD1234567890123",
     whatsappId: "919876543210",
     serviceType: "8A Form",
     userData: { name: "John", ... },
     amount: 500,
     status: "pending",
     paymentStatus: "pending",
     createdAt: "2025-01-19T10:35:00Z",
     updatedAt: "2025-01-19T10:35:00Z"
   }
   ↓
3. Append to orders array
   ↓
4. Save to orders.json
   ↓
5. Return order object
```

**`createOrUpdateSession(whatsappId, sessionData)`**

```javascript
FLOW:
1. Check if session exists for whatsappId
   ↓
2. If exists:
   → Update session with new data
   ↓
3. If not exists:
   → Create new session
   {
     id: "session_1234567890_abc123",
     whatsappId: "919876543210",
     step: "awaiting_flow_completion",
     selectedService: "8a_service",
     serviceName: "8A Form",
     createdAt: "2025-01-19T10:30:00Z",
     updatedAt: "2025-01-19T10:30:00Z"
   }
   ↓
4. Save to sessions.json
   ↓
5. Return session object
```

---

### 8️⃣ **src/routes/payment.routes.js** (Payment Routes)

**Purpose:** Handle payment checkout and callbacks

```javascript
ROUTES:
1. GET /payment/checkout
   → Display payment form (HTML page)
   
2. GET /payment/success
   → Payment success callback
   → paymentController.handleSuccess()
   
3. GET /payment/failure
   → Payment failure callback
   → paymentController.handleFailure()
```

#### Checkout Page Flow:

```javascript
FLOW:
1. User clicks payment link from WhatsApp
   ↓
2. Browser opens: /payment/checkout?orderId=ORD123&whatsappId=919876543210
   ↓
3. Server renders HTML payment form:
   - Order ID display
   - Email input
   - Card number input (test: 4111111111111111)
   - Pay Now button
   ↓
4. User fills form and clicks "Pay Now"
   ↓
5. Form submits to: /payment/success?orderId=ORD123&mock=true
```

**HTML Form:**

```html
<form method="GET" action="/payment/success">
  <input type="hidden" name="orderId" value="ORD123">
  <input type="hidden" name="mock" value="true">
  <input type="email" name="email" required>
  <input type="text" name="card" required>
  <button type="submit">Pay Now</button>
</form>
```

---

### 9️⃣ **src/controllers/payment.controller.js** (Payment Processing)

#### Method: `handleSuccess(req, res)`

**When Called:** After user completes payment

```javascript
FLOW:
1. Extract query parameters:
   - orderId
   - paymentId
   - signature
   - mock (for testing)
   ↓
2. Find order in database:
   → database.findOrderByOrderId(orderId)
   ↓
3. Validate order exists
   ↓
4. If mock payment (testing):
   → Update order status to "completed"
   → Set paymentStatus to "captured"
   → Set paymentId to mock value
   → Set completedAt timestamp
   ↓
5. If real payment:
   → Verify payment signature
   → Update order if verified
   ↓
6. Send confirmation to WhatsApp:
   → sendPaymentConfirmation(whatsappId, order)
   ↓
7. Update session to "completed"
   ↓
8. Display success HTML page:
   ✅ Payment Successful!
   Order ID: ORD123
   Amount: ₹500
   Service: 8A Form
   You will receive confirmation on WhatsApp shortly.
```

**Database Update:**

```javascript
Order before:
{
  orderId: "ORD123",
  status: "pending",
  paymentStatus: "pending",
  amount: 500
}

Order after:
{
  orderId: "ORD123",
  status: "completed",
  paymentStatus: "captured",
  paymentId: "mock_payment_1234567890",
  amount: 500,
  completedAt: "2025-01-19T10:40:00Z"
}
```

**WhatsApp Confirmation:**

```
✅ Payment Successful!

Order ID: ORD123
Service: 8A Form
Amount: ₹500
Date: 19/01/2025

Your application has been received. We'll process it within 24 hours.
```

---

#### Method: `handleFailure(req, res)`

**When Called:** If payment fails

```javascript
FLOW:
1. Extract orderId from query
   ↓
2. Find order in database
   ↓
3. Update order:
   - status: "failed"
   - paymentStatus: "failed"
   - failedAt: timestamp
   ↓
4. Send failure message to WhatsApp:
   "Payment failed for order ORD123. Please try again or contact support."
   ↓
5. Display failure HTML page:
   ❌ Payment Failed
   Your payment could not be processed.
   Please try again or contact support.
```

---

### 🔟 **src/templates/welcome.template.js** (Message Templates)

**Purpose:** Provide reusable message templates

#### Function: `welcomeMessage()`

**Returns:** Interactive button message object

```javascript
{
  type: 'interactive',
  interactive: {
    type: 'button',
    header: {
      type: 'text',
      text: 'Welcome to Land Record Services'
    },
    body: {
      text: 'Hello! I\'m here to help you with land record services...'
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: '8a_service', title: '8A Form' } },
        { type: 'reply', reply: { id: '712_service', title: '7/12 Form' } },
        { type: 'reply', reply: { id: 'ferfar_service', title: 'Ferfar' } },
        { type: 'reply', reply: { id: 'property_card_service', title: 'Property Card' } }
      ]
    }
  }
}
```

---

## Complete User Journey Flow

### 🎯 Scenario: User applies for "8A Form" service

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates Conversation                                │
└─────────────────────────────────────────────────────────────────────┘

USER ACTION:
Opens WhatsApp → Types "hi" → Sends message

BACKEND FLOW:
1. WhatsApp → Meta Servers
   ↓
2. Meta → Webhook POST to ngrok URL
   ↓
3. Ngrok → Forwards to localhost:3000/webhook
   ↓
4. server.js receives request
   ↓
5. app.js routes to webhook.routes.js
   ↓
6. webhook.routes.js → POST / → webhookController.handleWebhook()
   ↓
7. webhookController parses webhook payload
   ↓
8. Extracts: from="919876543210", text="hi"
   ↓
9. Calls: messageController.handleMessage("919876543210", "hi")
   ↓
10. messageController creates/updates user in database
    → database.upsertUser()
    ↓
11. Matches text "hi" → Sends welcome message
    → whatsappService.sendMessage(from, welcomeMessage())
    ↓
12. whatsappService makes API call to Meta Graph API
    ↓
13. Meta delivers message to user's WhatsApp

USER SEES:
┌────────────────────────────────┐
│ Welcome to Land Record Services│
├────────────────────────────────┤
│ Hello! I'm here to help you   │
│ with land record services.    │
│ Please choose:                 │
│                                │
│  [ 8A Form ]                  │
│  [ 7/12 Form ]                │
│  [ Ferfar ]                   │
│  [ Property Card ]            │
└────────────────────────────────┘

DATABASE STATE:
users.json:
[
  {
    "id": "user_1234567890_abc123",
    "whatsappId": "919876543210",
    "phoneNumber": "919876543210",
    "lastSeen": "2025-01-19T10:30:00Z",
    "lastMessage": "hi",
    "createdAt": "2025-01-19T10:30:00Z"
  }
]


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Selects Service                                       │
└─────────────────────────────────────────────────────────────────────┘

USER ACTION:
Clicks "8A Form" button

BACKEND FLOW:
1. WhatsApp sends button click as interactive message
   ↓
2. Webhook POST with:
   {
     "interactive": {
       "button_reply": {
         "id": "8a_service",
         "title": "8A Form"
       }
     }
   }
   ↓
3. webhookController.handleIncomingMessages()
   → Detects type="interactive"
   → Extracts replyId="8a_service"
   ↓
4. Calls: messageController.handleMessage("919876543210", "8a_service")
   ↓
5. Matches "8a_service" pattern
   ↓
6. Calls: triggerServiceFlow("919876543210", "8a_service", "8A Form")
   ↓
7. Creates session in database:
   → database.createOrUpdateSession()
   {
     whatsappId: "919876543210",
     step: "awaiting_flow_completion",
     selectedService: "8a_service",
     serviceName: "8A Form"
   }
   ↓
8. Builds flow message with:
   - flow_id: env.WHATSAPP_FLOW_ID_8A
   - flow_token: "token_1234567890_8a_service"
   - flow_cta: "Start Form"
   ↓
9. Sends interactive flow message to user
   → whatsappService.sendMessage()

USER SEES:
┌────────────────────────────────┐
│  8A Form                       │
├────────────────────────────────┤
│ Please fill out the 8A form    │
│ to proceed with your           │
│ application.                   │
│                                │
│  [ Start Form ]  ← Clickable  │
│                                │
│ Your data is secure and        │
│ encrypted.                     │
└────────────────────────────────┘

DATABASE STATE:
sessions.json:
[
  {
    "id": "session_1234567890_abc123",
    "whatsappId": "919876543210",
    "step": "awaiting_flow_completion",
    "selectedService": "8a_service",
    "serviceName": "8A Form",
    "createdAt": "2025-01-19T10:31:00Z"
  }
]


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: User Fills Form                                            │
└─────────────────────────────────────────────────────────────────────┘

USER ACTION:
1. Clicks "Start Form" button
2. WhatsApp opens in-app form (WhatsApp Flow)
3. Fills out form fields:
   - Full Name: "John Doe"
   - Village: "ABC Village"
   - Survey Number: "123/4"
   - Taluka: "XYZ Taluka"
   - District: "Pune"
   - Mobile: "9876543210"
   - Email: "john@example.com"
4. Clicks "Submit" in the form

BACKEND FLOW:
1. WhatsApp Flow submits data
   ↓
2. Meta sends webhook POST with:
   {
     "interactive": {
       "type": "nfm_reply",
       "nfm_reply": {
         "response_json": "{\"name\":\"John Doe\",\"village\":\"ABC Village\",...}",
         "name": "flow",
         "body": "Submitted"
       }
     }
   }
   ↓
3. webhookController.handleIncomingMessages()
   → Detects nfm_reply (form submission)
   → Extracts flowToken
   ↓
4. Calls: messageController.handleFlowCompletion()
   ↓
5. Parses form data from JSON string
   ↓
6. Retrieves session from database:
   → database.findSessionByWhatsappId("919876543210")
   ↓
7. Creates order:
   → database.createOrder({
       orderId: "ORD_1234567890_abc123",
       whatsappId: "919876543210",
       serviceType: "8A Form",
       userData: { name: "John Doe", village: "ABC Village", ... },
       amount: 500,
       status: "pending",
       paymentStatus: "pending"
     })
   ↓
8. Updates session:
   → step: "awaiting_payment"
   → orderId: "ORD_1234567890_abc123"
   ↓
9. Generates payment link:
   http://localhost:3000/payment/checkout?orderId=ORD_1234567890_abc123
   ↓
10. Sends confirmation message:
    "Thank you for filling the form!
     Order ID: ORD_1234567890_abc123
     Service: 8A Form
     Amount: ₹500"
    ↓
11. Sends payment link message

USER SEES:
Message 1:
```

Thank you for filling the form!

Order ID: ORD_1234567890_abc123 Service: 8A Form Amount: ₹500

Click below to proceed with payment:

```

Message 2:
```

💰 Payment Required

Service: 8A Form Amount: ₹500 Order ID: ORD_1234567890_abc123

Please pay using this link: http://localhost:3000/payment/checkout?orderId=ORD_1234567890_abc123

After payment, you'll receive confirmation here.

```

DATABASE STATE:
orders.json:
[
  {
    "id": "order_1234567890_abc123",
    "orderId": "ORD_1234567890_abc123",
    "whatsappId": "919876543210",
    "serviceType": "8A Form",
    "userData": {
      "name": "John Doe",
      "village": "ABC Village",
      "surveyNumber": "123/4",
      "taluka": "XYZ Taluka",
      "district": "Pune",
      "mobile": "9876543210",
      "email": "john@example.com"
    },
    "amount": 500,
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2025-01-19T10:35:00Z"
  }
]

sessions.json (updated):
[
  {
    "id": "session_1234567890_abc123",
    "whatsappId": "919876543210",
    "step": "awaiting_payment",
    "selectedService": "8a_service",
    "serviceName": "8A Form",
    "orderId": "ORD_1234567890_abc123",
    "createdAt": "2025-01-19T10:31:00Z",
    "updatedAt": "2025-01-19T10:35:00Z"
  }
]


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: User Makes Payment                                         │
└─────────────────────────────────────────────────────────────────────┘

USER ACTION:
1. Clicks payment link in WhatsApp
2. Browser opens checkout page
3. Sees order details
4. Fills email and card details
5. Clicks "Pay Now"

BACKEND FLOW:
1. Browser GET request:
   /payment/checkout?orderId=ORD_1234567890_abc123&whatsappId=919876543210
   ↓
2. payment.routes.js renders HTML checkout form
   ↓
3. User submits form → GET request:
   /payment/success?orderId=ORD_1234567890_abc123&mock=true&paymentId=mock_payment_1234567890
   ↓
4. payment.routes.js → paymentController.handleSuccess()
   ↓
5. Finds order in database:
   → database.findOrderByOrderId("ORD_1234567890_abc123")
   ↓
6. Updates order:
   {
     status: "completed",
     paymentStatus: "captured",
     paymentId: "mock_payment_1234567890",
     completedAt: "2025-01-19T10:40:00Z"
   }
   ↓
7. Sends WhatsApp confirmation:
   → paymentController.sendPaymentConfirmation()
   → whatsappService.sendTextMessage()
   ↓
8. Updates session:
   {
     step: "completed",
     completedAt: "2025-01-19T10:40:00Z"
   }
   ↓
9. Returns success HTML page to browser

USER SEES IN BROWSER:
┌────────────────────────────────┐
│           ✅                   │
│   Payment Successful!          │
│                                │
│ Order ID: ORD_1234567890_abc123│
│ Amount: ₹500                   │
│ Service: 8A Form               │
│                                │
│ You will receive confirmation  │
│ on WhatsApp shortly.           │
│                                │
│ You can close this window.     │
└────────────────────────────────┘

USER SEES IN WHATSAPP:
```

✅ Payment Successful!

Order ID: ORD_1234567890_abc123 Service: 8A Form Amount: ₹500 Date: 19/01/2025

Your application has been received. We'll process it within 24 hours.

```

FINAL DATABASE STATE:

users.json:
[
  {
    "id": "user_1234567890_abc123",
    "whatsappId": "919876543210",
    "phoneNumber": "919876543210",
    "lastSeen": "2025-01-19T10:40:00Z",
    "lastMessage": "hi",
    "createdAt": "2025-01-19T10:30:00Z",
    "updatedAt": "2025-01-19T10:40:00Z"
  }
]

orders.json:
[
  {
    "id": "order_1234567890_abc123",
    "orderId": "ORD_1234567890_abc123",
    "whatsappId": "919876543210",
    "serviceType": "8A Form",
    "userData": {
      "name": "John Doe",
      "village": "ABC Village",
      "surveyNumber": "123/4",
      "taluka": "XYZ Taluka",
      "district": "Pune",
      "mobile": "9876543210",
      "email": "john@example.com"
    },
    "amount": 500,
    "status": "completed",
    "paymentStatus": "captured",
    "paymentId": "mock_payment_1234567890",
    "createdAt": "2025-01-19T10:35:00Z",
    "updatedAt": "2025-01-19T10:40:00Z",
    "completedAt": "2025-01-19T10:40:00Z"
  }
]

sessions.json:
[
  {
    "id": "session_1234567890_abc123",
    "whatsappId": "919876543210",
    "step": "completed",
    "selectedService": "8a_service",
    "serviceName": "8A Form",
    "orderId": "ORD_1234567890_abc123",
    "createdAt": "2025-01-19T10:31:00Z",
    "updatedAt": "2025-01-19T10:40:00Z",
    "completedAt": "2025-01-19T10:40:00Z"
  }
]
```

---

## Ngrok Integration

### What is Ngrok?

Ngrok creates a secure tunnel from a public URL to your local server. This is necessary because:

1. WhatsApp webhook requires HTTPS
2. Meta needs a publicly accessible URL
3. Your local server (localhost:3000) is not accessible from internet

### How Ngrok Works:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WITHOUT NGROK                                    │
└─────────────────────────────────────────────────────────────────────┘

Meta Servers (Internet)
        ↓
        X  ← Cannot reach localhost
        
Your Computer (localhost:3000)


┌─────────────────────────────────────────────────────────────────────┐
│                     WITH NGROK                                      │
└─────────────────────────────────────────────────────────────────────┘

Meta Servers (Internet)
        ↓
        | HTTPS POST
        ↓
https://abc123.ngrok.io/webhook  ← Public URL
        ↓
        | Ngrok Tunnel (Secure)
        ↓
http://localhost:3000/webhook  ← Your Local Server
        ↓
Your Express App processes the request
```

### Setup Steps:

```bash
# 1. Install ngrok
npm install -g ngrok
# OR download from https://ngrok.com/download

# 2. Start your server
npm run dev
# Server running on http://localhost:3000

# 3. Start ngrok (in new terminal)
ngrok http 3000

# Output:
# Session Status: online
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### Configure Meta Webhook:

```
1. Go to Meta Developer Dashboard
2. Your App → WhatsApp → Configuration
3. Webhook URL: https://abc123.ngrok.io/webhook
4. Verify Token: (your VERIFY_TOKEN from .env)
5. Subscribe to messages and message_statuses
6. Click "Verify and Save"
```

### Verification Process:

```
Meta sends: GET https://abc123.ngrok.io/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=123456
        ↓
Ngrok forwards to: http://localhost:3000/webhook
        ↓
webhook.controller.verify() receives request
        ↓
Validates token
        ↓
Returns challenge: 123456
        ↓
Meta receives: 200 OK with body "123456"
        ↓
Webhook verified! ✅
```

### Message Flow with Ngrok:

```
User sends "hi" on WhatsApp
        ↓
WhatsApp → Meta Servers
        ↓
Meta → POST https://abc123.ngrok.io/webhook
        ↓
Ngrok → POST http://localhost:3000/webhook
        ↓
Your app processes message
        ↓
Your app → POST https://graph.facebook.com/v19.0/.../messages
        ↓
Meta → WhatsApp
        ↓
User receives response
```

### Ngrok Console:

When ngrok is running, you can see live requests:

```
http://localhost:4040
```

This shows:

- All HTTP requests
- Request/response headers
- Request/response bodies
- Timing information

---

## Data Flow Summary

### 1. User Message Flow:

```
User's WhatsApp
    ↓ (sends message)
Meta Servers
    ↓ (webhook POST)
Ngrok (if local dev)
    ↓ (tunnel)
Express Server (localhost:3000)
    ↓ (routing)
webhook.routes.js
    ↓ (handler)
webhook.controller.js
    ↓ (process)
message.controller.js
    ↓ (business logic)
database.service.js (save data)
whatsapp.service.js (send response)
    ↓ (API call)
Meta Graph API
    ↓ (deliver)
User's WhatsApp
```

### 2. Payment Flow:

```
User clicks payment link
    ↓ (browser)
Express Server
    ↓ (render)
HTML Checkout Form
    ↓ (submit)
payment.controller.handleSuccess()
    ↓ (update)
database.service.js (update order)
    ↓ (confirm)
whatsapp.service.js (send confirmation)
    ↓ (deliver)
User's WhatsApp
```

### 3. Database Operations:

```
Request Received
    ↓
Controller processes
    ↓
database.service methods:
    - upsertUser()
    - createOrder()
    - updateOrder()
    - createOrUpdateSession()
    ↓
Read from JSON files:
    - ./data/users.json
    - ./data/orders.json
    - ./data/sessions.json
    ↓
Modify data in memory
    ↓
Write back to JSON files
    ↓
Return updated objects
```

---

## Key Concepts

### 1. Webhook Pattern:

- Meta sends HTTP POST to your server when events occur
- Your server must respond within 20 seconds
- Always return 200 OK (even on errors)
- Meta retries failed webhooks

### 2. WhatsApp Flows:

- Interactive forms within WhatsApp
- Defined by flow_id in Meta dashboard
- User fills form → WhatsApp sends data via webhook
- Data comes as JSON string in nfm_reply

### 3. Session Management:

- Track user's conversation state
- Store in sessions.json
- States: awaiting_flow_completion, awaiting_payment, completed
- Link sessions to orders

### 4. Order Lifecycle:

```
pending → (form filled) → awaiting_payment → (payment made) → completed
                                          ↓
                                      (payment failed) → failed
```

### 5. Environment Variables:

```env
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789
VERIFY_TOKEN=your_verify_token
WHATSAPP_FLOW_ID_8A=1234567890
WHATSAPP_FLOW_ID_712=1234567891
WHATSAPP_FLOW_ID_FERFAR=1234567892
WHATSAPP_FLOW_ID_PROPERTY=1234567893
BASE_URL=https://abc123.ngrok.io
NODE_ENV=development
PORT=3000
```

---

## Debugging Tips

### View All Data:

```
GET http://localhost:3000/test/data
```

### Clear All Data:

```
POST http://localhost:3000/test/clear
```

### Check Server Health:

```
GET http://localhost:3000/health
```

### View Ngrok Requests:

```
http://localhost:4040
```

### Console Logs to Watch:

```
✅ Database initialized
🔧 WhatsApp Service Config
💬 PROCESSING MESSAGE
📤 SENDING WHATSAPP MESSAGE
RAW WEBHOOK RECEIVED
```

---

## Common Issues & Solutions

### Issue: Webhook not receiving messages

**Solution:**

1. Check ngrok is running
2. Verify webhook URL in Meta dashboard
3. Check VERIFY_TOKEN matches
4. Look at ngrok console for requests

### Issue: Messages not sending

**Solution:**

1. Check WHATSAPP_ACCESS_TOKEN is valid
2. Verify WHATSAPP_PHONE_NUMBER_ID
3. Look for API errors in console
4. Test with mock mode first

### Issue: Order not creating

**Solution:**

1. Check ./data/ directory exists
2. Verify JSON files are writable
3. Look for database service errors
4. Check session exists before order creation

---

## Production Deployment

For production, replace:

1. Ngrok → Proper domain with SSL (e.g., your-domain.com)
2. JSON files → Real database (PostgreSQL, MongoDB)
3. Mock payment → Real payment gateway (Razorpay)
4. Environment variables → Production values

---

## Summary

This bot orchestrates a complete workflow:

1. User initiates conversation
2. Bot presents service options
3. User selects service
4. WhatsApp Flow form opens
5. User fills and submits form
6. Bot creates order
7. Bot sends payment link
8. User completes payment
9. Bot confirms order
10. Admin processes application

All communication happens through Meta's WhatsApp Business API, with ngrok providing the bridge between Meta and your local development server.