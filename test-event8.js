const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // Try outcome token_id relationship
  {
    name: "outcome token_id",
    query: `query {
      outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        token_id
      }
    }`
  },
  // Try market_question_stats
  {
    name: "market_question_stats",
    query: `query {
      market_question_stats(where: {question_id: {_eq: "${questionId}"}}) {
        question_id
        volume
      }
    }`
  },
  // Try market_outcome_stats
  {
    name: "market_outcome_stats",
    query: `query {
      market_outcome_stats(where: {question_id: {_eq: "${questionId}"}}) {
        outcome_id
        question_id
        price
      }
    }`
  },
  // Try to find price info
  {
    name: "outcome price lookup",
    query: `query {
      outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        token_id
        prices {
          current
        }
      }
    }`
  },
  // Try outcome_stats table
  {
    name: "outcome_stats table",
    query: `query {
      outcome_stats(limit: 10) {
        id
        question_id
      }
    }`
  },
  // Try market_outcome
  {
    name: "market_outcome",
    query: `query {
      market_outcome(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
      }
    }`
  },
  // Try to get more fields through relationship
  {
    name: "question with outcome prices",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          prices {
            current
            open
          }
        }
      }
    }`
  },
  // Check if there's price info in token table
  {
    name: "token_info",
    query: `query {
      token_info(limit: 10) {
        id
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
