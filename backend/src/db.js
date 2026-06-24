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
      status TEXT DEFAULT 'offline',
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      country_code TEXT DEFAULT 'ZA',
      currency_code TEXT DEFAULT 'ZAR',
      region TEXT DEFAULT 'johannesburg',
      verification_status TEXT DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      verification_metadata TEXT,
      is_premium INTEGER DEFAULT 0,
      gold_status INTEGER DEFAULT 0,
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
      currency_code TEXT DEFAULT 'ZAR',
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      country_code TEXT DEFAULT 'ZA',
      region TEXT DEFAULT 'johannesburg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users (id),
      FOREIGN KEY (driver_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS failures (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      delivery_id TEXT,
      reason TEXT,
      data_category TEXT NOT NULL CHECK(data_category IN ('real', 'test', 'simulated')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('sme', 'driver')),
      status TEXT NOT NULL CHECK(status IN ('CONTACTED', 'INTERESTED', 'QUALIFIED', 'SIGNED', 'PENDING')),
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      country_code TEXT DEFAULT 'ZA',
      currency_code TEXT DEFAULT 'ZAR',
      region TEXT DEFAULT 'johannesburg',
      notes TEXT,
      metadata TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')),
      provider TEXT NOT NULL,
      provider_tx_id TEXT,
      type TEXT NOT NULL,
      data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated')),
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      user_id TEXT,
      delivery_id TEXT,
      data_category TEXT NOT NULL CHECK(data_category IN ('real', 'test', 'simulated')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS referral_credits (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      referred_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency_code TEXT DEFAULT 'ZAR',
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users (id),
      FOREIGN KEY (referred_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migrations for existing DB
  try {
    await db.exec("ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN referral_code TEXT");
  } catch (e) {}
  try {
    await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN referred_by TEXT");
  } catch (e) {}
  
  try {
    await db.exec("ALTER TABLE deliveries ADD COLUMN insurance_opt_in INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE deliveries ADD COLUMN insurance_premium REAL DEFAULT 0");
  } catch (e) {}

  try {
    await db.exec("ALTER TABLE deliveries ADD COLUMN accepted_at DATETIME");
  } catch (e) {}

  // Multi-region migrations
  const tables = ['users', 'deliveries', 'leads'];
  for (const table of tables) {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN country_code TEXT DEFAULT 'ZA'`);
    } catch (e) {}
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN currency_code TEXT DEFAULT 'ZAR'`);
    } catch (e) {}
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN region TEXT DEFAULT 'johannesburg'`);
    } catch (e) {}
  }

  // Verification and Premium migrations
  try {
    await db.exec("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN verification_metadata TEXT");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN gold_status INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE users ADD COLUMN webhook_url TEXT");
  } catch (e) {}
  try {
    // Ensure all drivers have at least 'offline' status (fix for migration NULLs)
    await db.exec("UPDATE users SET status = 'offline' WHERE role = 'driver' AND (status IS NULL OR status = '')");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE payments ADD COLUMN data_category TEXT DEFAULT 'real' CHECK(data_category IN ('real', 'test', 'simulated'))");
  } catch (e) {}

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
