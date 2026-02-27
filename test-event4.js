const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";

const queries = [
  // Get all outcomes with minimal fields
  {
    name: "outcomes minimal",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
        }
      }
    }`
  },
  // Try outcome title
  {
    name: "outcome title",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          title
          outcome_title
        }
      }
    }`
  },
  // Try other field names
  {
    name: "outcome other fields",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          slug
          label
        }
      }
    }`
  },
  // Get market by address
  {
    name: "market_by_pk full",
    query: `query {
      market_by_pk(address: "${eventAddress}") {
        address
        question_id
        created_at
        question {
          question_id
          title
        }
      }
    }`
  },
  // Try to find stats - check question has many fields
  {
    name: "explore question fields",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        description
        created_at
        ends_at
        end_timestamp
        resolved_at
        resolution_timestamp
        creator
        image_url
        icon_url
        category_id
        group_item_id
      }
    }`
  },
  // Check market stats fields
  {
    name: "market_by_pk stats",
    query: `query {
      market_by_pk(address: "${eventAddress}") {
        address
        question_id
        created_at
        volume
        total_volume
        liquidity
        total_liquidity
      }
    }`
  },
  // Try current_market_stats table
  {
    name: "current_market_stats by address",
    query: `query {
      current_market_stats(where: {market_address: {_eq: "${eventAddress}"}}) {
        market_address
        volume_24h
        total_volume
        liquidity
        spread
      }
    }`
  },
  // Try by question_id
  {
    name: "current_market_stats by question",
    query: `query {
      current_market_stats(where: {question_id: {_eq: "${questionId}"}}) {
        market_address
        question_id
        volume_24h
        total_volume
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
