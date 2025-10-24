const API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY || "AIzaSyDDnZ6E5bn9J4oI13d4hfGMFIAKjZ5S9-Y";

async function testGoogleTTS() {
  console.log("Testing Google Cloud TTS API...");
  console.log("API Key:", API_KEY ? API_KEY.substring(0, 10) + "..." : "NOT SET");
  
  const testText = "Welcome to your personalized meditation. Take a deep breath and relax.";
  
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: testText },
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
      console.error("❌ TTS API Error:");
      console.error(JSON.stringify(data.error, null, 2));
    } else if (data.audioContent) {
      console.log("✅ TTS Success!");
      console.log("Audio content length:", data.audioContent.length, "characters (base64)");
      console.log("Estimated audio size:", Math.round(data.audioContent.length * 0.75 / 1024), "KB");
    } else {
      console.log("⚠️ Unexpected response:", data);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testGoogleTTS();
