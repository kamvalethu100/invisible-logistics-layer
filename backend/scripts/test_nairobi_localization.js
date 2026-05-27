
const BASE_URL = 'http://localhost:3002/api';


async function test() {
  console.log('--- Starting Nairobi Localization Test ---');

  try {
    // 1. Register a Nairobi Business
    console.log('\n1. Registering Nairobi Business...');
    const bizRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `biz_nairobi_${Date.now()}@test.com`,
        password: 'password123',
        role: 'business',
        name: 'Nairobi Shop',
        phone: '0712345678',
        country_code: 'KE',
        currency_code: 'KES',
        region: 'nairobi',
        data_category: 'test'
      })
    });
    const bizData = await bizRes.json();
    if (!bizRes.ok) throw new Error(JSON.stringify(bizData));
    const bizToken = bizData.token;
    console.log('Success! Registered Nairobi Business:', bizData.user.email);

    // 2. Submit Kenyan KYB Verification
    console.log('\n2. Submitting Kenyan KYB Verification...');
    const kybRes = await fetch(`${BASE_URL}/verification/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}` 
      },
      body: JSON.stringify({
        cr12_registration_number: 'PVT-12345',
        kra_pin_business: 'A001234567B',
        single_business_permit_url: 'http://docs.test/permit.pdf',
        director_id_number: '12345678'
      })
    });
    const kybData = await kybRes.json();
    if (!kybRes.ok) throw new Error(JSON.stringify(kybData));
    console.log('Success! Verification status:', kybData.status);

    // 3. Initiate M-Pesa Payment
    console.log('\n3. Initiating M-Pesa Payment...');
    const payRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}` 
      },
      body: JSON.stringify({
        amount: 500,
        type: 'TOPUP',
        phone_number: '0712345678'
      })
    });
    const payData = await payRes.json();
    if (!payRes.ok) throw new Error(JSON.stringify(payData));
    console.log('Success! Payment provider:', payData.provider);
    console.log('Message:', payData.message);

    // 4. Create Delivery in Nairobi
    console.log('\n4. Creating Delivery in Nairobi...');
    const deliveryRes = await fetch(`${BASE_URL}/deliveries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}` 
      },
      body: JSON.stringify({
        pickup_address: 'Westlands, Nairobi',
        pickup_lat: -1.2633,
        pickup_lng: 36.8021,
        dropoff_address: 'Kilimani, Nairobi',
        dropoff_lat: -1.2921,
        dropoff_lng: 36.7846,
        package_size: 'small',
        urgency: 'standard'
      })
    });
    const deliveryData = await deliveryRes.json();
    if (!deliveryRes.ok) throw new Error(JSON.stringify(deliveryData));
    console.log('Success! Delivery ID:', deliveryData.id);
    console.log('Price:', deliveryData.price, deliveryData.currency_code);
    console.log('Region:', deliveryData.region);

    // 5. Check Stats (Filtered by Nairobi)
    console.log('\n5. Checking Stats...');
    const statsRes = await fetch(`${BASE_URL}/deliveries/stats`, {
      headers: { Authorization: `Bearer ${bizToken}` }
    });
    const statsData = await statsRes.json();
    if (!statsRes.ok) throw new Error(JSON.stringify(statsData));
    console.log('Stats Region:', statsData.region);
    console.log('Total Requests:', statsData.total_requests);

    // 6. Create a Lead in Nairobi
    console.log('\n6. Creating Nairobi Lead...');
    const leadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}` 
      },
      body: JSON.stringify({
        name: 'Nairobi Restaurant Chain',
        type: 'sme',
        notes: 'Interested in bulk deliveries'
      })
    });
    const leadData = await leadRes.json();
    if (!leadRes.ok) throw new Error(JSON.stringify(leadData));
    console.log('Success! Lead ID:', leadData.id);
    console.log('Lead Region:', leadData.region);

    console.log('\n--- Nairobi Localization Test Passed! ---');
  } catch (error) {
    console.error('\n--- Test Failed! ---');
    console.error(error.message);
  }
}

test();
