// Function to sanitize text for JSON safety
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove control characters (except newlines, tabs, carriage returns)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Fix common problematic characters
    .replace(/[\u2028\u2029]/g, '\n') // Line/paragraph separators
    // Remove or replace problematic Unicode ranges
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '') // Orphaned high surrogates
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '') // Orphaned low surrogates
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();
  
  console.log(`[${requestId}] Claude API Request Started`);
  
  if (req.method !== 'POST') {
    console.log(`[${requestId}] ERROR: Method not allowed - ${req.method}`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      console.log(`[${requestId}] ERROR: No prompt provided`);
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Sanitize the prompt to prevent JSON encoding issues
    const sanitizedPrompt = sanitizeText(prompt);
    
    if (!sanitizedPrompt) {
      console.log(`[${requestId}] ERROR: Prompt became empty after sanitization`);
      return res.status(400).json({ message: 'Prompt contains invalid characters' });
    }

    console.log(`[${requestId}] Original prompt length: ${prompt.length}, sanitized: ${sanitizedPrompt.length}`);
    console.log(`[${requestId}] Prompt preview: ${sanitizedPrompt.substring(0, 100)}...`);
    console.log(`[${requestId}] API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);

    const requestBody = {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: sanitizedPrompt,
        },
      ],
    };

    // Log the request body for debugging (but not in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${requestId}] Request body:`, JSON.stringify(requestBody, null, 2));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] Claude API Response: ${response.status} (${responseTime}ms)`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] Claude API Error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        originalPromptLength: prompt.length,
        sanitizedPromptLength: sanitizedPrompt.length,
        responseTime
      });
      
      return res.status(response.status).json({ 
        message: 'Claude API error', 
        error: errorData,
        requestId 
      });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log(`[${requestId}] SUCCESS: Response length: ${content.length} characters (${responseTime}ms)`);

    res.status(200).json({ response: content });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] FATAL ERROR:`, {
      message: error.message,
      stack: error.stack,
      responseTime,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      requestId 
    });
  }
}
