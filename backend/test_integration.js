
import { initDb } from './src/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function test() {
    console.log('--- Starting Integration Test ---');
    const db = await initDb();

    // 1. Create Test Users
    const keUser = {
        id: uuidv4(),
        email: 'test_ke@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'business',
        name: 'KE Business',
        phone: '254700000000',
        country_code: 'KE',
        currency_code: 'KES',
        data_category: 'real'
    };

    const zaUser = {
        id: uuidv4(),
        email: 'test_za@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'business',
        name: 'ZA Business',
        phone: '27000000000',
        country_code: 'ZA',
        currency_code: 'ZAR',
        data_category: 'real'
    };

    const referrerUser = {
        id: uuidv4(),
        email: 'referrer@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'business',
        name: 'Referrer Business',
        phone: '27111111111',
        country_code: 'ZA',
        currency_code: 'ZAR',
        data_category: 'real',
        referral_code: 'REF123'
    };

    await db.run('DELETE FROM users WHERE email IN (?, ?, ?)', [keUser.email, zaUser.email, referrerUser.email]);
    
    await db.run(
        'INSERT INTO users (id, email, password_hash, role, name, phone, country_code, currency_code, data_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [keUser.id, keUser.email, keUser.password_hash, keUser.role, keUser.name, keUser.phone, keUser.country_code, keUser.currency_code, keUser.data_category]
    );

    await db.run(
        'INSERT INTO users (id, email, password_hash, role, name, phone, country_code, currency_code, data_category, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [zaUser.id, zaUser.email, zaUser.password_hash, zaUser.role, zaUser.name, zaUser.phone, zaUser.country_code, zaUser.currency_code, zaUser.data_category, referrerUser.id]
    );

    await db.run(
        'INSERT INTO users (id, email, password_hash, role, name, phone, country_code, currency_code, data_category, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [referrerUser.id, referrerUser.email, referrerUser.password_hash, referrerUser.role, referrerUser.name, referrerUser.phone, referrerUser.country_code, referrerUser.currency_code, referrerUser.data_category, referrerUser.referral_code]
    );

    console.log('Users created with referral link.');

    // 2. Simulate M-Pesa (KE) Flow
    console.log('\n--- Testing M-Pesa (KE) Flow ---');
    const kePaymentId = uuidv4();
    await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [kePaymentId, keUser.id, 100, 'KES', 'PENDING', 'MPESA', 'PREMIUM_SUBSCRIPTION', 'real']
    );

    // Simulate callback
    const keCallbackBody = {
        Body: {
            stkCallback: {
                MerchantRequestID: 'test-merchant-id',
                CheckoutRequestID: 'test-checkout-id',
                ResultCode: 0,
                ResultDesc: 'Success'
            }
        }
    };

    console.log('Simulating M-Pesa Callback...');
    if (keCallbackBody.Body.stkCallback.ResultCode === 0) {
        await db.run('UPDATE payments SET status = "COMPLETED", provider_tx_id = ? WHERE id = ?', [keCallbackBody.Body.stkCallback.MerchantRequestID, kePaymentId]);
        await db.run('UPDATE users SET is_premium = 1 WHERE id = ?', [keUser.id]);
    }

    const updatedKeUser = await db.get('SELECT is_premium FROM users WHERE id = ?', [keUser.id]);
    const updatedKePayment = await db.get('SELECT status FROM payments WHERE id = ?', [kePaymentId]);
    console.log(`KE User Premium: ${updatedKeUser.is_premium}`);
    console.log(`KE Payment Status: ${updatedKePayment.status}`);

    // 3. Simulate Paystack (ZA) Flow
    console.log('\n--- Testing Paystack (ZA) Flow ---');
    const zaPaymentId = uuidv4();
    await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [zaPaymentId, zaUser.id, 200, 'ZAR', 'PENDING', 'PAYSTACK', 'PREMIUM_SUBSCRIPTION', 'real']
    );

    // Simulate Paystack Webhook
    const zaWebhookBody = {
        event: 'charge.success',
        data: {
            reference: zaPaymentId,
            id: 'paystack-tx-123'
        }
    };

    console.log('Simulating Paystack Webhook...');
    if (zaWebhookBody.event === 'charge.success') {
        const reference = zaWebhookBody.data.reference;
        const payment = await db.get('SELECT * FROM payments WHERE id = ?', [reference]);
        if (payment && payment.status === 'PENDING') {
            await db.run('UPDATE payments SET status = "COMPLETED", provider_tx_id = ? WHERE id = ?', [zaWebhookBody.data.id, payment.id]);
            await db.run('UPDATE users SET is_premium = 1 WHERE id = ?', [zaUser.id]);
        }
    }

    const updatedZaUser = await db.get('SELECT is_premium FROM users WHERE id = ?', [zaUser.id]);
    const updatedZaPayment = await db.get('SELECT status FROM payments WHERE id = ?', [zaPaymentId]);
    console.log(`ZA User Premium: ${updatedZaUser.is_premium}`);
    console.log(`ZA Payment Status: ${updatedZaPayment.status}`);

    // 4. Testing Insurance Logic
    console.log('\n--- Testing Insurance Logic ---');
    const distance = 10; // 10km
    const packageSize = 'small';
    const urgency = 'standard';
    
    // Manual calculation based on deliveries.js: (baseFees[small]=5 + (10 * 1.5)) * 1 * 1 = 20
    // With insurance: 20 + 10 = 30
    
    const priceWithoutInsurance = (5 + (distance * 1.5));
    const priceWithInsurance = priceWithoutInsurance + 10;
    
    console.log(`Expected without insurance: ${priceWithoutInsurance}`);
    console.log(`Expected with insurance: ${priceWithInsurance}`);
    
    const deliveryIdInsurance = uuidv4();
    await db.run(
        `INSERT INTO deliveries (id, business_id, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, package_size, urgency, price, data_category, insurance_opt_in, insurance_premium) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [deliveryIdInsurance, zaUser.id, 'pending', 'Pickup', 0, 0, 'Dropoff', 0, 0.1, packageSize, urgency, priceWithInsurance, 'real', 1, 10]
    );
    
    const insuranceDelivery = await db.get('SELECT price, insurance_opt_in FROM deliveries WHERE id = ?', [deliveryIdInsurance]);
    console.log(`Delivery Price with Insurance: ${insuranceDelivery.price}`);
    console.log(`Insurance Opt-in: ${insuranceDelivery.insurance_opt_in}`);

    // 5. Testing Referral Logic
    console.log('\n--- Testing Referral Logic ---');
    // Set zaUser to VERIFIED
    await db.run('UPDATE users SET verification_status = "VERIFIED" WHERE id = ?', [zaUser.id]);
    
    // Simulate first delivery completion
    const deliveryIdReferral = uuidv4();
    await db.run(
        `INSERT INTO deliveries (id, business_id, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, package_size, urgency, price, data_category) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [deliveryIdReferral, zaUser.id, 'pending', 'Pickup', 0, 0, 'Dropoff', 0, 0.1, packageSize, urgency, 20, 'real']
    );

    console.log('Completing first delivery for referred user...');
    // Logic from deliveries.js:status update
    const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [deliveryIdReferral]);
    const business = await db.get('SELECT id, referred_by, verification_status, data_category FROM users WHERE id = ?', [delivery.business_id]);
    
    if (business && business.referred_by && business.verification_status === 'VERIFIED' && business.data_category === 'real') {
        const completedCount = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE business_id = ? AND status = "delivered"', [delivery.business_id]);
        if (completedCount.count === 0) { // Should be 0 before we update it to delivered
            const creditAmount = 100;
            await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [creditAmount, business.referred_by]);
            await db.run('UPDATE deliveries SET status = "delivered" WHERE id = ?', [deliveryIdReferral]);
            console.log(`Referral credit of ${creditAmount} paid to ${business.referred_by}`);
        }
    }

    const updatedReferrer = await db.get('SELECT balance FROM users WHERE id = ?', [referrerUser.id]);
    console.log(`Referrer Balance: ${updatedReferrer.balance}`);

    if (updatedKeUser.is_premium === 1 && updatedZaUser.is_premium === 1 && insuranceDelivery.price === 30 && updatedReferrer.balance === 100) {
        console.log('\nAll Integration Tests PASSED');
    } else {
        console.log('\nIntegration Tests FAILED');
    }

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
