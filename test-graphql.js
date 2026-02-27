const https = require('https');

const introspectionQuery = JSON.stringify({
  query: `{
    __schema {
      queryType { name }
      mutationType { name }
      types {
        name
        kind
        fields {
          name
          args {
            name
            type {
              name
              kind
            }
          }
          type {
            name
            kind
          }
        }
      }
    }
  }`
});

const options = {
  hostname: 'ft.42.space',
  port: 443,
  path: '/v1/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': introspectionQuery.length,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Origin': 'https://www.42.space',
    'Referer': 'https://www.42.space/'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Data:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(introspectionQuery);
req.end();
