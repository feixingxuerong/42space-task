const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // current_outcome_stats without id
  {
    name: "current_outcome_stats no id",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        question_id
      }
    }`
  },
  // Try to get all fields
  {
    name: "current_outcome_stats all",
    query: `query {
      current_outcome_stats(where: {question_id: {_eq: "${questionId}"}}, limit: 10) {
        question_id
        outcome_id
        price
        probability
        pool_size
      }
    }`
  },
  // outcome_metadata without title
  {
    name: "outcome_metadata no title",
    query: `query {
      outcome_metadata(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
      }
    }`
  },
  // Get outcome_metadata more fields
  {
    name: "outcome_metadata more",
    query: `query {
      outcome_metadata(where: {question_id: {_eq: "${questionId}"}}) {
        id
        question_id
        slug
        label
        name
        description
      }
    }`
  },
  // Try outcome_by_pk with question_id
  {
    name: "outcome_by_pk with question_id",
    query: `query {
      outcome_by_pk(question_id: "${questionId}", outcome_index: 0) {
        id
        question_id
        token_id
      }
    }`
  },
  // question_extend fields
  {
    name: "question_extend fields",
    query: `query {
      question_extend(where: {question_id: {_eq: "${questionId}"}}) {
        question_id
      }
    }`
  },
  // Add question_extend fields
  {
    name: "question_extend add",
    query: `query {
      question_extend(where: {question_id: {_eq: "${questionId}"}}) {
        question_id
        image_url
        description
      }
    }`
  },
  // Full question query
  {
    name: "full question",
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
        question_extend {
          image_url
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
