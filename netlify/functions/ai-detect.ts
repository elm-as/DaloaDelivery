import type { Handler, HandlerEvent } from '@netlify/functions';

const HF_MODEL = 'umm-maybe/AI-image-detector';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const hfToken = process.env.VITE_HF_TOKEN || process.env.HF_TOKEN;
  if (!hfToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'HF_TOKEN not configured on server' }),
    };
  }

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided' }) };
  }

  try {
    // event.body is base64-encoded when isBase64Encoded is true
    const imageBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'binary');

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    // Handle model loading (cold start)
    if (response.status === 503) {
      const retryBody = await response.json();
      const waitTime = retryBody.estimated_time ? Math.min(retryBody.estimated_time * 1000, 20000) : 10000;
      
      await new Promise(r => setTimeout(r, waitTime));

      const retry = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      });

      if (!retry.ok) {
        return {
          statusCode: retry.status,
          body: JSON.stringify({ error: `HF API error after retry: ${retry.status}` }),
        };
      }

      const retryData = await retry.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retryData),
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `HF API error: ${response.status}`, details: errText }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error('[ai-detect] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};

export { handler };
