const axios = require('axios');

async function benchmark() {
    const baseUrl = 'http://localhost:3001/api/quiz';
    const iterations = 5;

    console.log('Starting benchmark...');

    try {
        // Measure /groups
        let start = Date.now();
        for (let i = 0; i < iterations; i++) {
            await axios.get(`${baseUrl}/groups`);
        }
        console.log(`Average /groups: ${(Date.now() - start) / iterations}ms`);

        // Measure /structure
        start = Date.now();
        for (let i = 0; i < iterations; i++) {
            await axios.get(`${baseUrl}/structure`);
        }
        console.log(`Average /structure: ${(Date.now() - start) / iterations}ms`);

        // Measure /progress (needs session, might fail without cookie)
        // We will skip /progress for now or mock it if we can, but since we can't easily mock session here without login...
        // Let's just check the public ones first.
    } catch (err) {
        console.error('Benchmark error:', err.message);
    }
}

benchmark();
