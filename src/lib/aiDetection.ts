/**
 * AI Image Detection Service
 * 
 * In PRODUCTION: calls the Netlify Function /.netlify/functions/ai-detect
 *   which proxies to HuggingFace Inference API server-side (no CORS issues).
 * 
 * In DEV: calls HuggingFace directly (may fail due to CORS/DNS).
 *   Falls back gracefully if unavailable.
 * 
 * Model: umm-maybe/AI-image-detector
 * Detects: GAN, Stable Diffusion, Midjourney, DALL-E generated images
 */

export interface AIDetectionResult {
  probability: number; // 0-100, probability the image is AI-generated
  is_ai: boolean;      // true if probability >= 50
  details: string;     // Human-readable explanation
  raw_scores?: { label: string; score: number }[];
}

export interface AIVerificationReport {
  ai_flagged: boolean;
  ai_verification_results: Record<string, AIDetectionResult>;
}

/**
 * Determine the correct endpoint based on environment
 */
function getEndpoint(): string {
  // Use absolute URL in dev to hit Netlify CLI on port 8888, or relative in PROD
  if (import.meta.env.DEV) {
    return 'http://localhost:8888/.netlify/functions/analyze-image';
  }
  return '/.netlify/functions/analyze-image';
}

/**
 * Analyze a single image file for AI generation
 */
async function analyzeImage(file: File): Promise<AIDetectionResult> {
  try {
    const endpoint = getEndpoint();

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });
    } catch (err) {
      // If Netlify function fails (e.g. not running Netlify CLI locally), try HF directly in DEV
      if (import.meta.env.DEV) {
        const hfToken = import.meta.env.VITE_HF_TOKEN;
        if (!hfToken) {
           console.error('[AI Detection] Fetch error & no token for fallback:', err);
           return fallbackResult('Erreur réseau. Fonction serverless indisponible et pas de token HF local.');
        }
        
        // Need to convert to array buffer for direct HF call
        const arrayBuffer = await file.arrayBuffer();
        try {
          response = await fetch(
            'https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${hfToken}`,
                'Content-Type': 'application/octet-stream',
              },
              body: arrayBuffer,
            }
          );
        } catch (hfErr) {
           console.error('[AI Detection] Fallback fetch error:', hfErr);
           return fallbackResult('Erreur réseau. Impossible de contacter le serveur HF.');
        }
      } else {
        console.error('[AI Detection] Fetch error:', err);
        return fallbackResult('Erreur réseau. Impossible de contacter le serveur de détection.');
      }
    }

    if (!response.ok) {
      if (response.status === 503) {
        console.warn('[AI Detection] Model loading, waiting 15s…');
        await new Promise(r => setTimeout(r, 15_000));
        const retry = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        if (!retry.ok) {
          return fallbackResult(`API IA temporairement indisponible (${retry.status}).`);
        }
        const retryData = await retry.json();
        return parseHFResponse(retryData);
      }
      return fallbackResult(`Erreur API IA (${response.status}).`);
    }

    const data = await response.json();
    return parseHFResponse(data);
  } catch (err) {
    console.error('[AI Detection] Error analyzing image:', err);
    return fallbackResult("Analyse IA indisponible. L'image sera examinée manuellement.");
  }
}

/**
 * Return a non-blocking fallback result when AI detection is unavailable
 */
function fallbackResult(details: string): AIDetectionResult {
  return {
    probability: -1,
    is_ai: false,
    details,
    raw_scores: [],
  };
}

/**
 * Parse the HuggingFace classification response
 * Expected: [{ label: "artificial", score: 0.98 }, { label: "human", score: 0.02 }]
 */
function parseHFResponse(data: { label: string; score: number }[]): AIDetectionResult {
  if (!Array.isArray(data) || data.length === 0) {
    return fallbackResult("Réponse de l'API de détection invalide.");
  }

  const artificialEntry = data.find(
    d => d.label.toLowerCase() === 'artificial' || d.label.toLowerCase() === 'ai'
  );
  const humanEntry = data.find(
    d => d.label.toLowerCase() === 'human' || d.label.toLowerCase() === 'real'
  );

  const aiScore = artificialEntry?.score ?? (1 - (humanEntry?.score ?? 0.5));
  const probability = Math.round(aiScore * 100);

  let details: string;
  if (probability >= 80) {
    details = `Forte probabilité de contenu généré par IA (${probability}%). Motifs synthétiques détectés.`;
  } else if (probability >= 50) {
    details = `Probabilité modérée de contenu IA (${probability}%). Examen humain recommandé.`;
  } else if (probability >= 20) {
    details = `Faible probabilité de contenu IA (${probability}%). Image probablement authentique.`;
  } else {
    details = `Image authentique (${probability}% de probabilité IA). Aucune anomalie détectée.`;
  }

  return {
    probability,
    is_ai: probability >= 50,
    details,
    raw_scores: data,
  };
}

/**
 * Run AI detection on all three verification photos.
 */
export async function runAIDetection(files: {
  cni: File;
  selfie: File;
  portrait: File;
}): Promise<AIVerificationReport> {
  // Run all three analyses in parallel
  const [cniResult, selfieResult, portraitResult] = await Promise.all([
    analyzeImage(files.cni),
    analyzeImage(files.selfie),
    analyzeImage(files.portrait),
  ]);

  const ai_flagged = cniResult.is_ai || selfieResult.is_ai || portraitResult.is_ai;

  return {
    ai_flagged,
    ai_verification_results: {
      cni: cniResult,
      selfie: selfieResult,
      portrait: portraitResult,
    },
  };
}
