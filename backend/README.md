# Invisible Logistics Layer - Backend

This is the backend for the Invisible Logistics Layer MVP.

## Tech Stack
- **Fastify**: High-performance web framework.
- **SQLite**: Database for persistence.
- **JWT**: For authentication.
- **Zod**: For schema validation.

## Prerequisites
- Node.js (v18+)
- npm

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (see `.env.example`).
3. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Auth
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login and get a token.
- `GET /api/auth/me`: Get current user info (requires Auth).

### Deliveries
- `POST /api/deliveries`: Create a new delivery request (Business only). Triggers matching engine.
- `GET /api/deliveries`: List deliveries (Business: their own, Driver: assigned + pending).
- `GET /api/deliveries/:id`: Get delivery details.
- `PATCH /api/deliveries/:id/accept`: Accept a delivery job (Driver only).
- `PATCH /api/deliveries/:id/status`: Update delivery status (Driver only).

## WebSockets
The server uses Socket.io for real-time communication.

### Authentication
Provide a JWT token in the `auth` object or as a query parameter when connecting:
```javascript
const socket = io({
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Events (Client -> Server)
- `update_location`: `{ lat, lng }` (Drivers only). Updates driver location in the matching engine.
- `track_delivery`: `deliveryId`. Joins a room to receive status and location updates for a specific delivery.

### Events (Server -> Client)
- `job_offer`: `deliveryObject`. Sent to nearby drivers when a new job is created.
- `status_update`: `deliveryObject`. Sent to the delivery room when status changes.
- `location_update`: `{ lat, lng }`. Sent to the delivery room when the assigned driver moves.
