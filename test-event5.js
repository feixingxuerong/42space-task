const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";

const queries = [
  // Check current_market_stats fields
  {
    name: "current_market_stats fields",
    query: `query {
      current_market_stats(limit: 2) {
        market_address
        question_id
      }
    }`
  },
  // Add total_volume
  {
    name: "add total_volume",
    query: `query {
      current_market_stats(limit: 2) {
        market_address
        total_volume
      }
    }`
  },
  // Add more stats fields
  {
    name: "add more stats",
    query: `query {
      current_market_stats(limit: 2) {
        market_address
        total_volume
        total_liquidity
        volume
        liquidity
      }
    }`
  },
  // Get outcome_token info
  {
    name: "outcome_token",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcome_tokens {
          id
          token_id
        }
      }
    }`
  },
  // Check outcome_token fields
  {
    name: "outcome_token details",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcome_tokens {
          id
          token_id
          outcome_id
        }
      }
    }`
  },
  // Try outcome table
  {
    name: "outcome table query",
    query: `query {
      outcome(limit: 6, where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        outcome_id
      }
    }`
  },
  // Get outcome by id
  {
    name: "outcome_by_pk",
    query: `query {
      outcome_by_pk(id: 747) {
        id
        question_id
        outcome_id
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
          try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
          } catch(e) {
            console.log(data.substring(0, 2000));
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    
    await new Promise(r => setTimeout(r, 150));
  }
}

runQueries().catch(console.error);
