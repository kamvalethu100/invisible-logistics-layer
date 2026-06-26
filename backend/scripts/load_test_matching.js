
import { findNearbyDrivers, onlineDrivers } from '../src/sockets.js';
import { v4 as uuidv4 } from 'uuid';

// Mock driver data
function populateDrivers(count) {
    console.log(`Populating ${count} drivers...`);
    for (let i = 0; i < count; i++) {
        const id = uuidv4();
        onlineDrivers.set(id, {
            socketId: `socket-${i}`,
            lat: -26.2041 + (Math.random() - 0.5) * 0.1, // Near Jo'burg
            lng: 28.0473 + (Math.random() - 0.5) * 0.1,
            status: 'online',
            data_category: 'real',
            country_code: 'ZA'
        });
    }
}

async function runLoadTest(concurrentRequests) {
    console.log(`Starting load test with ${concurrentRequests} concurrent matching requests...`);
    
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
        promises.push(new Promise((resolve) => {
            const reqStart = performance.now();
            const nearby = findNearbyDrivers(-26.2041, 28.0473, 5, null, 'real', 'ZA');
            const reqEnd = performance.now();
            resolve({
                latency: reqEnd - reqStart,
                found: nearby.length
            });
        }));
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    const avgLatency = results.reduce((acc, r) => acc + r.latency, 0) / concurrentRequests;
    const maxLatency = Math.max(...results.map(r => r.latency));
    const minLatency = Math.min(...results.map(r => r.latency));

    console.log('\n--- Load Test Results ---');
    console.log(`Total Drivers: ${onlineDrivers.size}`);
    console.log(`Concurrent Requests: ${concurrentRequests}`);
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Max Latency: ${maxLatency.toFixed(2)}ms`);
    console.log(`Min Latency: ${minLatency.toFixed(2)}ms`);
    console.log(`Requests/sec: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);
    console.log('-------------------------\n');
}

populateDrivers(1000);
runLoadTest(50).then(() => {
    // Test with even more load
    runLoadTest(200);
});
