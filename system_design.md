# Invisible Logistics Layer - System Design & API Specification

## 1. System Architecture

The system will follow a service-oriented architecture, optimized for real-time responsiveness and scalability.

- **Backend:** Node.js with Fastify. Fastify provides low overhead and excellent performance.
- **Database:** SQLite for persistent data (Users, Deliveries, History). This ensures simplicity for the MVP while providing a clear path to PostgreSQL/PostGIS.
- **In-Memory Store:** In-memory data structures (JS Maps/Sets) for real-time driver locations and availability.
- **Real-time Communication:** WebSockets (using Socket.io) for live tracking and instant dispatching.
- **Geolocation:** Haversine formula implemented in the application layer for distance calculations and proximity filtering (finding drivers within a radius).

## 2. Database Schema

### Users Table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique identifier |
| email | String | Unique email for login |
| password_hash | String | Bcrypt hash |
| role | Enum | `business`, `driver`, `admin` |
| name | String | Full name or Business name |
| phone | String | Contact number |
| vehicle_type | Enum | `small`, `medium`, `large` (Drivers only) |
| status | Enum | `online`, `offline`, `busy` (Drivers only) |
| created_at | Timestamp | Account creation time |

### Deliveries Table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique identifier |
| business_id | UUID (FK) | Reference to the business user |
| driver_id | UUID (FK) | Reference to the assigned driver (nullable) |
| status | Enum | `pending`, `assigned`, `en_route_to_pickup`, `picked_up`, `en_route_to_delivery`, `delivered`, `cancelled` |
| pickup_address | String | Human-readable address |
| pickup_lat | Double | Latitude |
| pickup_lng | Double | Longitude |
| dropoff_address | String | Human-readable address |
| dropoff_lat | Double | Latitude |
| dropoff_lng | Double | Longitude |
| package_size | Enum | `small`, `medium`, `large` |
| urgency | Enum | `standard`, `express` |
| price | Decimal | Calculated price for the delivery |
| created_at | Timestamp | Request time |
| updated_at | Timestamp | Last status update |

### DriverLocationLogs (Redis-backed for real-time, optionally archived to DB)
| Field | Type | Description |
| :--- | :--- | :--- |
| driver_id | UUID | Reference to driver |
| lat | Double | Latitude |
| lng | Double | Longitude |
| timestamp | Timestamp | When the update occurred |

## 3. API Contracts

### Authentication
- `POST /api/auth/register`: Register a new business or driver.
- `POST /api/auth/login`: Authenticate and receive a JWT.

### Business Endpoints
- `POST /api/deliveries`: Create a delivery request.
  - Body: `pickup_address`, `pickup_coords`, `dropoff_address`, `dropoff_coords`, `package_size`, `urgency`
  - Returns: Delivery object with estimated price.
- `GET /api/deliveries`: List all delivery requests for the business.
- `GET /api/deliveries/:id`: Get detailed status and driver info for a specific delivery.

### Driver Endpoints
- `PATCH /api/driver/status`: Update status (`online`, `offline`).
- `GET /api/driver/history`: View past completed jobs and earnings.
- `PATCH /api/deliveries/:id/status`: Update the status of an active job (`picked_up`, `delivered`, etc.).

### Internal Matching Engine Logic
1. **Trigger:** `POST /api/deliveries` is called.
2. **Search:** Query the in-memory store or DB for `online` drivers. Filter them in the application layer using the Haversine formula to find those within a 5km radius who have the appropriate `vehicle_type`.
3. **Dispatch:** Emit a `job_offer` event via WebSocket to the highest-ranked driver.
4. **Acceptance:**
   - If Driver accepts within 30s: Update delivery to `assigned`, notify Business.
   - If Driver declines or times out: Dispatch to the next best driver.
5. **Fallback:** If no drivers respond, expand radius or notify business that no drivers are currently available.

## 4. Real-Time Tracking Strategy

1. **Driver App:** Sends location updates via WebSocket every 10 seconds while `online` or `busy`.
2. **Server:** Updates the in-memory store with the latest `driver_id -> {lat, lng}`.
3. **Tracking Room:** When a business views a delivery, they join a WebSocket room specific to that `delivery_id`.
4. **Broadcast:** The server periodically broadcasts the assigned driver's latest location to the `delivery_id` room.
5. **Status Sync:** Any status change (`picked_up`, `delivered`) is pushed instantly to the Business client.

## 5. Pricing Logic (MVP)

The price is calculated at the moment of request creation:

`Price = BaseFee + (Distance * RatePerKm) * SurgeMultiplier`

- **BaseFee:** Flat rate depending on package size (e.g., Small: $5, Medium: $10, Large: $20).
- **RatePerKm:** Fixed rate (e.g., $1.50 per km).
- **SurgeMultiplier:** Defaults to 1.0, can be increased during high demand.
- **Transparency:** The price is returned by the `POST /api/deliveries` (or a separate `POST /api/deliveries/quote`) endpoint before the user confirms.

## 6. Implementation Plan (Backend)

1. **Sprint 1: Core API & Auth**
   - Setup Fastify server.
   - Implement JWT authentication for Businesses and Drivers.
   - Basic CRUD for Deliveries.
2. **Sprint 2: Matching Engine & WebSockets**
   - Integrate Socket.io.
   - Implement Driver status management (online/offline).
   - Develop the initial matching logic (proximity-based).
3. **Sprint 3: Tracking & Status Updates**
   - Real-time location updates from Drivers to Redis.
   - Location broadcasting to Business clients.
   - Status transition flow (Pickup -> In Transit -> Delivered).
4. **Sprint 4: Pricing & History**
   - Implement the pricing algorithm.
   - Dashboard data aggregation (earnings, delivery history).
