import { Handler } from '@netlify/functions';
import { InferenceClient } from '@huggingface/inference';

export const handler: Handler = async (event) => {
  // Configurer les headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const token = process.env.VITE_HF_TOKEN || process.env.HF_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Hugging Face API token is not configured' })
      };
    }

    // Le body contient le base64 de l'image
    const { imageBase64 } = JSON.parse(event.body || '{}');
    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'imageBase64 is required in body' })
      };
    }

    // Convertir base64 data url to blob/buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const client = new InferenceClient(token);
    
    const result = await client.imageClassification({
      data: buffer,
      model: "umm-maybe/AI-image-detector",
    });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error('Error in analyze-image function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
