const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // current_outcome_stats for our question
  {
    name: "current_outcome_stats for question",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        id
        question_id
      }
    }`
  },
  // Get price fields
  {
    name: "current_outcome_stats price fields",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        id
        question_id
        price
        probability
        pool_size
      }
    }`
  },
  // Add more fields
  {
    name: "current_outcome_stats more",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        id
        question_id
        price
        probability
        pool_size
        volume
        market_cap
      }
    }`
  },
  // Get all fields from outcome_metadata
  {
    name: "outcome_metadata",
    query: `query {
      outcome_metadata(limit: 10) {
        id
      }
    }`
  },
  // outcome_metadata for question
  {
    name: "outcome_metadata for question",
    query: `query {
      outcome_metadata(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
      }
    }`
  },
  // outcome_metadata fields
  {
    name: "outcome_metadata fields",
    query: `query {
      outcome_metadata(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        title
        description
      }
    }`
  },
  // Get question_extend
  {
    name: "question_extend",
    query: `query {
      question_extend(where: {question_id: {_eq: "${questionId}"}}) {
        question_id
        icon_url
        image_url
      }
    }`
  },
  // Get question_category
  {
    name: "question_category",
    query: `query {
      question(where: {question_id: {_eq: "${questionId}"}}) {
        question_id
        title
        question_categories {
          category_id
          category {
            id
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
