// Test Google Cloud TTS API
const API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY;

async function testTTS() {
  console.log("Testing Google Cloud TTS...");
  console.log("API Key present:", !!API_KEY);
  
  if (!API_KEY) {
    console.error("No API key found!");
    return;
  }
  
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: "Hello, this is a test of the meditation voice." },
          voice: {
            languageCode: "en-US",
            name: "en-US-Neural2-F",
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.80,
            pitch: 0,
          },
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error("TTS Error:", JSON.stringify(data.error, null, 2));
    } else {
      console.log("TTS Success! Audio content length:", data.audioContent?.length || 0);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

testTTS();
