import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../database.sqlite');

export async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      vehicle_type TEXT,
      status TEXT,
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      driver_id TEXT,
      status TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      pickup_lat REAL NOT NULL,
      pickup_lng REAL NOT NULL,
      dropoff_address TEXT NOT NULL,
      dropoff_lat REAL NOT NULL,
      dropoff_lng REAL NOT NULL,
      package_size TEXT NOT NULL,
      urgency TEXT NOT NULL,
      price REAL NOT NULL,
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users (id),
      FOREIGN KEY (driver_id) REFERENCES users (id)
    );
  `);

  // Add data_category column if it doesn't exist (for existing databases)
  try {
    await db.exec("ALTER TABLE users ADD COLUMN data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated'))");
  } catch (e) {
    // Column might already exist
  }
  try {
    await db.exec("ALTER TABLE deliveries ADD COLUMN data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated'))");
  } catch (e) {
    // Column might already exist
  }

  return db;
}
