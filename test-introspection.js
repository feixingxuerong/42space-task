const https = require('https');

const questionId = "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74";

// Get fields for current_outcome_stats
const query1 = `
query {
  __type(name: "current_outcome_stats") {
    fields {
      name
      type {
        name
      }
    }
  }
}
`;

// Get fields for outcome_metadata
const query2 = `
query {
  __type(name: "outcome_metadata") {
    fields {
      name
      type {
        name
      }
    }
  }
}
`;

// Get fields for question_extend
const query3 = `
query {
  __type(name: "question_extend") {
    fields {
      name
      type {
        name
      }
    }
  }
}
`;

const queries = [
  { name: "current_outcome_stats fields", query: query1 },
  { name: "outcome_metadata fields", query: query2 },
  { name: "question_extend fields", query: query3 }
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
