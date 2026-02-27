const https = require('https');

// Query to get detailed info about a specific market
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";

const queries = [
  // Test question_by_pk with the event address
  {
    name: "question_by_pk",
    query: `query {
      question_by_pk(question_id: "${eventAddress}") {
        question_id
        title
        description
        created_at
        category
        status
        volume
        liquidity
        end_date
      }
    }`
  },
  // Test market_by_pk
  {
    name: "market_by_pk", 
    query: `query {
      market_by_pk(address: "${eventAddress}") {
        address
        question_id
        created_at
      }
    }`
  },
  // Try to get outcomes for this question
  {
    name: "question_by_pk outcomes",
    query: `query {
      question_by_pk(question_id: "${eventAddress}") {
        question_id
        title
        outcomes {
          outcome_id
          title
          price
          probability
        }
      }
    }`
  },
  // Try market_stats
  {
    name: "market_stats",
    query: `query {
      market_stats(limit: 10) {
        market_address
        volume
        liquidity
      }
    }`
  },
  // Try question_stats
  {
    name: "question_stats",
    query: `query {
      question_stats(limit: 10, where: {question_id: {_eq: "${eventAddress}"}}) {
        question_id
        volume
        liquidity
      }
    }`
  }
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
  for (const q of queries) {
    const body = JSON.stringify({ query: q.query });
    options.headers['Content-Length'] = body.length;
    
    console.log(`\n=== ${q.name} ===`);
    
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log('Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
          } catch(e) {
            console.log('Parse error:', e.message);
            console.log(data.substring(0, 2000));
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    
    await new Promise(r => setTimeout(r, 200));
  }
}

runQueries().catch(console.error);
