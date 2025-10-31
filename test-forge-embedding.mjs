import 'dotenv/config';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

console.log('Testing Forge Embedding API');
console.log('Base URL:', FORGE_API_URL);
console.log('API Key (first 20):', FORGE_API_KEY?.substring(0, 20) + '...');

const embeddingUrl = `${FORGE_API_URL}/v1/embeddings`;
console.log('Embedding URL:', embeddingUrl);

try {
  const response = await fetch(embeddingUrl, {
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
  
  console.log('Status:', response.status, response.statusText);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
} catch (error) {
  console.error('Error:', error.message);
}
