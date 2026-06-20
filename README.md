# 🍔 Big Bites

Big Bites is a next-generation food delivery application supercharged by AI. Built with a robust MERN stack and React Native, it features natural language search, intelligent personalized recommendations, and a conversational AI support agent, delivering a seamless and deeply personalized user experience.

---

## ✨ Key Features

### 🧠 AI-Powered Capabilities (Anthropic Claude 3.5)
- **Natural Language Search**: Ditch the rigid filters. Users can type queries like *"healthy veg lunch under ₹200"* and the AI engine parses the intent, converting it into precise Elasticsearch filters natively joined with nearby open restaurants.
- **"Picked for You" Personalised Recommendations**: The AI acts as a personal concierge. It analyzes the user's order history, current time of day, and day of the week to rank candidate dishes from nearby open restaurants, complete with highly personalized reasoning (e.g., *"Since you order biryani every Friday"*).
- **Conversational Support Agent**: An empathetic AI chatbot that handles "Where is my order?", refund requests, and missing item complaints directly, fetching context from the user's recent orders.

### 📱 Modern Mobile App (React Native)
- **Stunning UI**: Built with React Native and NativeWind (TailwindCSS) for beautiful, responsive, and animated interfaces.
- **Robust State Management**: Powered by Redux Toolkit (RTK) and RTK Query for automatic caching and API invalidation.
- **Frictionless Reordering**: Instantly recreate past orders. The system checks against current restaurant menus to flag price changes or out-of-stock items dynamically before checkout.
- **Favorites System**: Users can easily save their favorite restaurants and individual dishes for quick access.

### ⚡ High-Performance Backend (Node.js)
- **Real-Time Tracking**: Socket.io integration provides live updates for order tracking.
- **Elasticsearch Engine**: Ultra-fast fuzzy text matching, geo-filtering, and dynamic relevance boosting.
- **Redis Caching**: Heavily caches AI-parsed search intents and complex queries to guarantee low latency and optimize AI API costs.
- **Smart Background Jobs**: Utilizes `node-cron` to pre-generate AI recommendations in the background, completely eliminating loading times for active users.

---

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, Redux Toolkit, NativeWind (Tailwind CSS)
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Mongoose), Redis (Caching), Elasticsearch (Search Engine)
- **AI / LLM**: Anthropic Claude API (`claude-3-5-sonnet-20241022`)
- **Authentication**: Firebase Admin (OTP Verification)
- **Payments**: Razorpay

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Instance
- Redis Instance
- Elasticsearch Instance
- Anthropic API Key
- Firebase Service Account Key

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YashG1195/big-bites.git
cd big-bites
```

**2. Setup Backend**
```bash
cd backend
npm install
# Configure your .env file with MongoDB, Redis, Elasticsearch, and Anthropic keys
npm run dev
```

**3. Setup Frontend (App)**
```bash
cd BigBites
npm install
npx expo start
```
