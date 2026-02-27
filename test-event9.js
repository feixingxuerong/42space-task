const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // outcome_stats for our question
  {
    name: "outcome_stats for question",
    query: `query {
      outcome_stats(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
      }
    }`
  },
  // outcome_stats fields
  {
    name: "outcome_stats fields",
    query: `query {
      outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        id
        question_id
        outcome_id
        price
        probability
        pool_size
        volume
      }
    }`
  },
  // Try more fields
  {
    name: "outcome_stats more fields",
    query: `query {
      outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        id
        question_id
        outcome_id
        current_price
        current_probability
        current_pool_size
        market_cap
      }
    }`
  },
  // Check other tables
  {
    name: "all tables query",
    query: `query {
      __schema {
        queryType {
          fields {
            name
          }
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
            console.log(JSON.stringify(json, null, 2).substring(0, 8000));
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
    
    await new Promise(r => setTimeout(r, 200));
  }
}

runQueries().catch(console.error);
