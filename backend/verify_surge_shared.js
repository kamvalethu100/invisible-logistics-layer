const BASE_URL = 'http://localhost:3002/api';

async function test() {
  try {
    console.log('--- Verification Started ---');

    // 1. Register users
    console.log('Registering users...');
    
    async function register(name, role, category) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${name.toLowerCase().replace(' ', '_')}_${Date.now()}@test.com`,
          password: 'password123',
          name,
          role,
          data_category: category
        })
      });
      return res.json();
    }

    const businessReal = await register('Real Business', 'business', 'real');
    const tokenReal = businessReal.token;
    console.log('Real Business registered.');

    const driverReal = await register('Real Driver', 'driver', 'real');
    const tokenDriver = driverReal.token;
    console.log('Real Driver registered.');

    const businessSim = await register('Simulated Business', 'business', 'simulated');
    const tokenSim = businessSim.token;
    console.log('Simulated Business registered.');

    // 1.5 Connect Driver to make them "online" (requires socket.io-client or just mocking the DB status)
    // Actually the server uses onlineDrivers Map which is populated on WS connection.
    // Since I can't easily do WS here, I'll rely on the fact that I want to see if Real and Sim are DIFFERENT.
    
    // Let's create many simulated deliveries.
    console.log('Creating 10 simulated deliveries...');
    for (let i = 0; i < 10; i++) {
      await fetch(`${BASE_URL}/deliveries`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenSim}` 
        },
        body: JSON.stringify({
          pickup_address: '123 Sim St',
          pickup_lat: -26.2041,
          pickup_lng: 28.0473,
          dropoff_address: '456 Sim Ave',
          dropoff_lat: -26.2044,
          dropoff_lng: 28.0476,
          package_size: 'small',
          urgency: 'standard'
        })
      });
    }

    // Now create 1 Real delivery.
    console.log('Creating 1 Real delivery...');
    const realRes = await fetch(`${BASE_URL}/deliveries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenReal}` 
      },
      body: JSON.stringify({
        pickup_address: '123 Real St',
        pickup_lat: -26.2041,
        pickup_lng: 28.0473,
        dropoff_address: '456 Real Ave',
        dropoff_lat: -26.2044,
        dropoff_lng: 28.0476,
        package_size: 'small',
        urgency: 'standard'
      })
    });
    const realDelivery1 = await realRes.json();
    console.log('REAL Delivery 1 Price:', realDelivery1.price);
    if (realDelivery1.price < 6) {
      console.log('SUCCESS: Real delivery was NOT affected by simulated traffic surge.');
    } else {
      console.log('FAILURE: Real delivery WAS affected by simulated traffic surge.');
    }

    // Now check simulated price
    console.log('Checking a SIMULATED delivery price...');
    const simResCheck = await fetch(`${BASE_URL}/deliveries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenSim}` 
      },
      body: JSON.stringify({
        pickup_address: '123 Sim St',
        pickup_lat: -26.2041,
        pickup_lng: 28.0473,
        dropoff_address: '456 Sim Ave',
        dropoff_lat: -26.2044,
        dropoff_lng: 28.0476,
        package_size: 'small',
        urgency: 'standard'
      })
    });
    const simDeliveryCheck = await simResCheck.json();
    console.log('SIMULATED Delivery Price:', simDeliveryCheck.price);
    if (simDeliveryCheck.price > 10) {
      console.log('SUCCESS: Simulated delivery correctly triggered surge within its category.');
    } else {
      console.log('FAILURE: Simulated delivery did NOT trigger surge.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
