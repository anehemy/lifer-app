import 'dotenv/config';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const endpoints = [
  '/v1/embeddings',
  '/embeddings',
  '/v1/embed',
  '/embed',
  '/api/embeddings',
  '/models/gemini-embedding-001:embedContent'
];

console.log('Testing Forge embedding endpoints...\n');

for (const endpoint of endpoints) {
  const url = `${FORGE_API_URL}${endpoint}`;
  console.log(`Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-004',
        input: 'test'
      })
    });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    if (response.status !== 404) {
      const text = await response.text();
      console.log(`  Response: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log('');
}
