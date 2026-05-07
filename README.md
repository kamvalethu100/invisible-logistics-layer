# Invisible Logistics Layer

The **Invisible Logistics Layer** is a real-time logistics coordination platform designed for small and medium-sized businesses (SMEs). It removes delivery coordination friction by allowing businesses to instantly request, track, and manage deliveries while being automatically matched with available drivers in real time.

## 🚀 Key Features
- **Business Dashboard**: Create delivery requests in seconds, live map tracking, and spend stats.
- **Driver App**: Real-time job offers, one-click acceptance, status management, and earnings history.
- **Matching Engine**: Intelligent proximity-based matching using the Haversine formula.
- **Dynamic Pricing**: Automatic fee calculation with surge multipliers based on supply/demand.
- **Real-Time Updates**: Powered by WebSockets (Socket.io) for instant tracking and status changes.

## 🛠 Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS.
- **Backend**: Fastify (Node.js), Socket.io.
- **Database**: SQLite (Production-ready schema).
- **Deployment**: Docker, Vercel (Frontend), Render/Railway (Backend).

## 📦 Getting Started

### Local Development (with Docker)
1. Clone the repository.
2. Run `docker-compose up --build`.
3. Access the Frontend at `http://localhost:3001` and the Backend at `http://localhost:3000`.

### Local Development (Manual)
#### Backend
1. `cd backend`
2. `npm install`
3. `npm run dev`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 📄 System Design
For a deep dive into the architecture, check out `system_design.md`.

## 🌍 Product Intent
This is not just a delivery app. It is a real-time logistics coordination engine for informal and formal economies, starting in South Africa and designed to scale globally.
