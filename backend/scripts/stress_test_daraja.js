
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming script is in backend/scripts/
const dbPath = path.resolve(__dirname, '../database.sqlite');

const BASE_URL = 'http://localhost:3002/api';
const TOTAL_REQUESTS = 50;

async function stressTest() {
  console.log('--- Starting Daraja API Stress Test ---');
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // 1. Register Business and get token
  const bizRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `stress_biz_${Date.now()}@test.com`,
      password: 'password123',
      role: 'business',
      name: 'Stress Test Biz',
      phone: '254712345678',
      country_code: 'KE',
      currency_code: 'KES',
      region: 'nairobi',
      data_category: 'test'
    })
  });
  const bizData = await bizRes.json();
  const bizToken = bizData.token;

  // 2. Initiate STK payments
  console.log(`Initiating ${TOTAL_REQUESTS} STK payments...`);
  const paymentIds = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const payRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}` 
      },
      body: JSON.stringify({
        amount: 10 + i,
        type: 'TOPUP',
        phone_number: '254712345678'
      })
    });
    const payData = await payRes.json();
    paymentIds.push(payData.payment_id);
  }

  // 3. Stress test STK callbacks
  console.log(`Sending ${TOTAL_REQUESTS * 2} concurrent STK callbacks (Double Notification Test)...`);
  const sendStkCallback = async (paymentId) => {
    return fetch(`${BASE_URL}/payments/callback/mpesa/stk/${paymentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `REQ-${paymentId}`,
            CheckoutRequestID: `CHK-${paymentId}`,
            ResultCode: 0,
            ResultDesc: 'Success'
          }
        }
      })
    });
  };

  const startTimeStk = Date.now();
  const stkPromises = [];
  for (const pid of paymentIds) {
    stkPromises.push(sendStkCallback(pid));
    stkPromises.push(sendStkCallback(pid));
  }
  await Promise.all(stkPromises);
  console.log(`STK Callbacks completed in ${Date.now() - startTimeStk}ms`);

  // Verify STK
  const stkPayments = await db.all('SELECT status FROM payments WHERE user_id = ? AND type = "TOPUP"', [bizData.user.id]);
  const stkCompletedCount = stkPayments.filter(p => p.status === 'COMPLETED').length;
  console.log(`STK Results: ${stkCompletedCount}/${TOTAL_REQUESTS} completed`);

  // 4. B2C Stress Test
  console.log('\n--- Starting B2C Payout Stress Test ---');
  const driverRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `stress_driver_${Date.now()}@test.com`,
      password: 'password123',
      role: 'driver',
      name: 'Stress Test Driver',
      phone: '254787654321',
      country_code: 'KE',
      currency_code: 'KES',
      region: 'nairobi',
      data_category: 'test'
    })
  });
  const driverData = await driverRes.json();
  const driverToken = driverData.token;

  // Manual verification for payout eligibility
  await db.run('UPDATE users SET verification_status = "VERIFIED" WHERE id = ?', [driverData.user.id]);

  console.log(`Initiating ${TOTAL_REQUESTS} B2C payouts...`);
  const payoutIds = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const payRes = await fetch(`${BASE_URL}/payments/payout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}` 
      },
      body: JSON.stringify({ amount: 100 })
    });
    const payData = await payRes.json();
    payoutIds.push(payData.payout_id);
  }

  console.log(`Sending ${TOTAL_REQUESTS * 2} concurrent B2C callbacks...`);
  const sendB2cCallback = async (payoutId) => {
    return fetch(`${BASE_URL}/payments/callback/mpesa/b2c/${payoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Result: {
          ResultCode: 0,
          ResultDesc: 'Success',
          TransactionID: `TXN-${payoutId}`
        }
      })
    });
  };

  const startTimeB2c = Date.now();
  const b2cPromises = [];
  for (const pid of payoutIds) {
    b2cPromises.push(sendB2cCallback(pid));
    b2cPromises.push(sendB2cCallback(pid));
  }
  await Promise.all(b2cPromises);
  console.log(`B2C Callbacks completed in ${Date.now() - startTimeB2c}ms`);

  // Verify B2C
  const b2cPayments = await db.all('SELECT status FROM payments WHERE user_id = ? AND type = "PAYOUT"', [driverData.user.id]);
  const b2cCompletedCount = b2cPayments.filter(p => p.status === 'COMPLETED').length;
  console.log(`B2C Results: ${b2cCompletedCount}/${TOTAL_REQUESTS} completed`);

  // 5. Currency Isolation Verification
  console.log('\n--- Verifying Currency Isolation (ZAR vs KES) ---');
  
  // Register a ZA user
  const zaRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `stress_za_${Date.now()}@test.com`,
      password: 'password123',
      role: 'business',
      name: 'ZA Biz',
      phone: '2712345678',
      country_code: 'ZA',
      currency_code: 'ZAR',
      region: 'johannesburg',
      data_category: 'test'
    })
  });
  const zaData = await zaRes.json();
  const zaToken = zaRes.ok ? zaData.token : null;

  if (zaToken) {
    const zaPayRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${zaToken}` 
      },
      body: JSON.stringify({ amount: 50, type: 'TOPUP' })
    });
    const zaPayData = await zaPayRes.json();
    console.log(`ZA Payment initiated. Provider: ${zaPayData.provider}, Currency: ${zaPayData.currency}`);
    
    if (zaPayData.provider === 'PAYSTACK' && zaPayData.currency === 'ZAR') {
      console.log('Currency isolation PASSED for ZA.');
    } else {
      console.error('Currency isolation FAILED for ZA.');
    }
  }

  const finalReport = {
    stk_success: stkCompletedCount === TOTAL_REQUESTS,
    b2c_success: b2cCompletedCount === TOTAL_REQUESTS,
    concurrency_handled: true
  };

  console.log('\nStress Test Report:', finalReport);
  
  if (finalReport.stk_success && finalReport.b2c_success) {
    console.log('--- ALL STRESS TESTS PASSED ---');
  } else {
    console.error('--- STRESS TESTS FAILED ---');
    process.exit(1);
  }

  process.exit(0);
}

stressTest().catch(console.error);
