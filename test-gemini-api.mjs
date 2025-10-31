const GEMINI_API_KEY = 'AIzaSyCBUBk56vaQD2w8c2AP4d6fyPPMwWfdxUQ';

console.log('Testing Gemini API Embedding...\n');

const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

console.log('Endpoint:', url.replace(GEMINI_API_KEY, 'API_KEY'));

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: {
        parts: [{
          text: 'What is the meaning of life?'
        }]
      }
    })
  });
  
  console.log('Status:', response.status, response.statusText);
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Success!');
    console.log('Embedding dimension:', data.embedding?.values?.length || 'N/A');
    console.log('First 5 values:', data.embedding?.values?.slice(0, 5));
  } else {
    console.log('❌ Error:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}
