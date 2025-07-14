export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    console.log('Making TTS call to ElevenLabs...');
    console.log('API Key exists:', !!process.env.ELEVENLABS_API_KEY);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/RhfuhuYldx2ApeAGj3zH`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    console.log('TTS Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS Error:', errorText);
      throw new Error(`TTS request failed with status ${response.status}: ${errorText}`);
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for sending to client
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('TTS Response received successfully');
    res.status(200).json({ 
      audio: base64Audio,
      contentType: 'audio/mpeg'
    });
    
  } catch (error) {
    console.error('Error calling ElevenLabs TTS:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      hasApiKey: !!process.env.ELEVENLABS_API_KEY 
    });
  }
}
