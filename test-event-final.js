const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";

const queries = [
  // Get current_outcome_stats with all fields
  {
    name: "current_outcome_stats full",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        question_id
        token_id
        market_address
        marginal_price
        collateral
        total_volume
        buy_volume
        sell_volume
        traders
        updated_at
      }
    }`
  },
  // Get outcome_metadata
  {
    name: "outcome_metadata full",
    query: `query {
      outcome_metadata(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        token_id
        description
        image
        symbol
      }
    }`
  },
  // Get full event with all related data
  {
    name: "full event",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        description
        created_at
        question_categories {
          category_id
          category {
            name
          }
        }
        outcomes {
          id
          token_id
        }
      }
    }`
  },
  // Get current_market_stats full
  {
    name: "current_market_stats full",
    query: `query {
      current_market_stats(where: {market_address: {_eq: "${eventAddress}"}}) {
        market_address
        total_volume
        buy_volume
        sell_volume
        traders
        collateral
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
