# WhatsApp Bot for Land Record Services

A WhatsApp Business API bot that allows users to apply for land record services (8A, 7/12, Ferfar, Property Card) and make payments via Razorpay.

## Features

- WhatsApp Business API integration
- Interactive buttons and WhatsApp Flows
- Razorpay payment gateway integration
- MongoDB for data storage
- Webhook handling for real-time messaging
- Payment success/failure notifications

## Prerequisites

- Node.js 18+
- MongoDB
- WhatsApp Business Account with API access
- Razorpay account

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure variables
4. Start the server: `npm run dev`

## Environment Variables

See `.env.example` for all required variables.

## WhatsApp Setup

1. Create a WhatsApp Business Account
2. Get API credentials from Facebook Developer Console
3. Set up webhook URL: `https://your-domain.com/webhook`
4. Configure verify token

## Payment Setup

1. Create Razorpay account
2. Get API keys from Razorpay Dashboard
3. Configure webhook in Razorpay for payment events

## API Endpoints

- `GET /health` - Health check
- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - WhatsApp webhook handler
- `GET /payment/success` - Payment success callback
- `GET /payment/failure` - Payment failure callback
- `POST /payment/webhook` - Razorpay webhook

## Flow

1. User sends "hi" to bot
2. Bot responds with service options
3. User selects service → WhatsApp Flow opens
4. User fills form → Submits
5. Payment link sent → User pays
6. Payment confirmation on WhatsApp
7. Application submitted notification

## Testing

Run tests: `npm test`

## Deployment

The application is ready for deployment on platforms like:
- Railway
- Render
- Heroku
- AWS EC2

## License

MIT License