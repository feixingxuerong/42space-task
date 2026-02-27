const https = require('https');

// Test queries - using only basic fields
const testQueries = [
  // Query 1: Get home market list - basic fields
  JSON.stringify({
    query: `query {
      home_market_list(limit: 3) {
        question_id
        title
      }
    }`
  }),
  // Query 2: Get categories
  JSON.stringify({
    query: `query {
      category(limit: 5) {
        id
        name
      }
    }`
  }),
  // Query 3: Get current market stats - basic
  JSON.stringify({
    query: `query {
      current_market_stats(limit: 3) {
        market_address
        liquidity
      }
    }`
  }),
  // Query 4: Get question status
  JSON.stringify({
    query: `query {
      question_status(limit: 3) {
        question_id
        title
        status
      }
    }`
  }),
  // Query 5: Get leaderboard
  JSON.stringify({
    query: `query {
      current_user_stats_ranked(limit: 5, order_by: {rank: asc}) {
        user_address
        rank
        volume
      }
    }`
  }),
  // Query 6: Get outcomes for a market
  JSON.stringify({
    query: `query {
      outcomes(limit: 5, where: {question_id: {_eq: "0x0000000000000000000000000000000000000000"}}) {
        question_id
        token_id
      }
    }`
  }),
  // Query 7: Get user positions (needs address)
  JSON.stringify({
    query: `query {
      user_positions(limit: 3, where: {user_address: {_eq: "0x0000000000000000000000000000000000000000"}}) {
        user_address
        market_address
        current_quantity
      }
    }`
  })
];

const options = {
  hostname: 'ft.42.space',
  port: 443,
  path: '/v1/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Origin': 'https://www.42.space',
    'Referer': 'https://www.42.space/'
  }
};

async function runQueries() {
  for (let i = 0; i < testQueries.length; i++) {
    options.headers['Content-Length'] = testQueries[i].length;
    
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`\n=== Query ${i + 1} ===`);
          console.log('Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2).substring(0, 3000));
          } catch(e) {
            console.log('Response:', data.substring(0, 1000));
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.write(testQueries[i]);
      req.end();
    });
    
    await new Promise(r => setTimeout(r, 300));
  }
}

runQueries().catch(console.error);
