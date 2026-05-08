# Verifiable Data Categorization Summary

The Invisible Logistics Layer now supports strict data categorization to ensure that 'real' growth and performance metrics are never contaminated by 'test' or 'simulated' activity.

## 1. Data Categories
Every user and delivery is assigned a `data_category`:
- `real`: Actual business activity (Default).
- `test`: Internal testing and QA.
- `simulated`: Synthetic data generated for performance testing or demos.

## 2. Database Schema
Both `users` and `deliveries` tables include a `data_category` column with a `CHECK` constraint to enforce valid values.

## 3. Strict Separation Logic
- **Registration**: Users default to `real` unless specified during registration.
- **Delivery Creation**: Deliveries automatically inherit the `data_category` of the business user who created them.
- **Matching Engine**: The proximity matching logic only connects businesses with drivers of the same `data_category`. A `real` delivery will never be assigned to a `simulated` driver.
- **Analytics & History**: Endpoints like `/api/deliveries/stats`, `/api/deliveries/history`, and `/api/auth/me` strictly filter data by category. By default, they return data matching the user's own category, but support an optional `?category=` query parameter for cross-category reporting (useful for admins).

## 4. Telemetry & Verifiability
GPS telemetry events (location updates) are logged on the server with their respective `data_category`.
Example log format:
`[Telemetry] Driver <uuid> (simulated): -26.2041, 28.0473`

This allows for independent verification of performance claims by auditing logs against the database records for specific time periods and categories.
