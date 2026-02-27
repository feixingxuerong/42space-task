const https = require('https');

// Key identifiers
const eventAddress = "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd";
const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // Get question by question_id
  {
    name: "question_by_pk full",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        description
        created_at
        status
        end_date
      }
    }`
  },
  // Try to get outcomes through question
  {
    name: "question outcomes",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          title
          price
        }
      }
    }`
  },
  // Get all fields of question - test various names
  {
    name: "question fields test",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        description
        created_at
        status
        end_date
        resolution_date
        volume
        liquidity
        fees
        creator
        image_url
      }
    }`
  },
  // Try market table
  {
    name: "market table",
    query: `query {
      market(limit: 5) {
        address
        question_id
        created_at
      }
    }`
  },
  // Try question table
  {
    name: "question table",
    query: `query {
      question(limit: 5, where: {question_id: {_eq: "${questionId}"}}) {
        question_id
        title
        description
        status
      }
    }`
  },
  // Get fee info
  {
    name: "question fees",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        fees
        trading_fee
        protocol_fee
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
