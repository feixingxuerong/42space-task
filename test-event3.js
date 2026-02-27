const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

const queries = [
  // Minimal fields to find valid field names
  {
    name: "question_by_pk minimal",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
      }
    }`
  },
  // Add description
  {
    name: "add description",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        description
      }
    }`
  },
  // Add created_at
  {
    name: "add created_at",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        created_at
      }
    }`
  },
  // Add end_date
  {
    name: "add end_date",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        end_date
      }
    }`
  },
  // Add volume
  {
    name: "add volume",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        volume
      }
    }`
  },
  // Try current_pool_size (from UI)
  {
    name: "add pool info",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        current_pool_size
        total_volume
      }
    }`
  },
  // Check outcomes structure
  {
    name: "check outcomes",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          index
        }
      }
    }`
  },
  // Get outcome prices
  {
    name: "outcome prices",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          current_price
          current_probability
        }
      }
    }`
  },
  // Get outcome full info
  {
    name: "outcome full",
    query: `query {
      question_by_pk(question_id: "${questionId}") {
        question_id
        title
        outcomes {
          id
          token_id
          index
          current_price
          current_probability
          current_pool_size
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
