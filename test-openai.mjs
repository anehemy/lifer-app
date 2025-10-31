#!/usr/bin/env node

/**
 * Test script to diagnose OpenAI API connection issues
 */

import 'dotenv/config';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

console.log('=== OpenAI API Test ===\n');
console.log('API Key (first 20 chars):', OPENAI_API_KEY?.substring(0, 20) + '...');
console.log('Base URL:', OPENAI_BASE_URL);
console.log('Full API URL:', `${OPENAI_BASE_URL}/chat/completions`);
console.log('\n--- Testing API Call ---\n');

const payload = {
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say hello!' }
  ],
  max_tokens: 50
};

console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('\n--- Sending Request ---\n');

try {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  console.log('Response status:', response.status, response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const data = await response.text();
  console.log('\nResponse body:');
  
  try {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(data);
  }

  if (!response.ok) {
    console.log('\n❌ API call failed!');
    process.exit(1);
  } else {
    console.log('\n✅ API call succeeded!');
    process.exit(0);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

