import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3002/api';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN; // Need a valid token

if (!JWT_TOKEN) {
    console.error('TEST_JWT_TOKEN environment variable is required');
    process.exit(1);
}

async function createDelivery() {
    const start = performance.now();
    try {
        const response = await fetch(`${BASE_URL}/deliveries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
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
        const data = await response.json();
        const end = performance.now();
        return {
            status: response.status,
            latency: end - start,
            data
        };
    } catch (error) {
        return {
            error: error.message,
            latency: performance.now() - start
        };
    }
}

async function runTest(concurrent) {
    console.log(`Running endpoint load test with ${concurrent} concurrent requests...`);
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
        promises.push(createDelivery());
    }
    const results = await Promise.all(promises);
    
    const successes = results.filter(r => r.status === 200 || r.status === 201);
    const errors = results.filter(r => r.error || (r.status !== 200 && r.status !== 201));
    
    const avgLatency = results.reduce((acc, r) => acc + r.latency, 0) / concurrent;
    
    console.log('\n--- Endpoint Test Results ---');
    console.log(`Successes: ${successes.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
    if (errors.length > 0) {
        console.log('Sample Error:', JSON.stringify(errors[0]));
    }
    console.log('-----------------------------\n');
}

runTest(50);
