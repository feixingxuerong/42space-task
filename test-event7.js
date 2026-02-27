const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";

const queries = [
  // Check outcome for our question
  {
    name: "outcome for our question",
    query: `query {
      outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
      }
    }`
  },
  // Try more outcome fields
  {
    name: "outcome more fields",
    query: `query {
      outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        description
        metadata
        extra
      }
    }`
  },
  // outcome_by_pk without args
  {
    name: "outcome_by_pk no args",
    query: `query {
      outcome_by_pk {
        id
        question_id
      }
    }`
  },
  // Get current_market_stats with total_volume only
  {
    name: "current_market_stats total_volume",
    query: `query {
      current_market_stats(where: {market_address: {_eq: "${eventAddress}"}}) {
        market_address
        total_volume
      }
    }`
  },
  // Try more fields in current_market_stats
  {
    name: "current_market_stats more",
    query: `query {
      current_market_stats(where: {market_address: {_eq: "${eventAddress}"}}) {
        market_address
        total_volume
        total_liquidity
        trade_count
        investor_count
      }
    }`
  },
  // Try token-related queries
  {
    name: "token table",
    query: `query {
      token(limit: 10) {
        id
        address
        question_id
      }
    }`
  },
  // Get token for our question
  {
    name: "token for question",
    query: `query {
      token(where: {question_id: {_eq: "${questionId}"}}) {
        id
        address
        question_id
      }
    }`
  },
  // Check outcome's token relationship
  {
    name: "outcome with token",
    query: `query {
      outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        token {
          id
          address
        }
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
