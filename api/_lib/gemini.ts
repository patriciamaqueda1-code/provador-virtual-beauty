/**
 * Helper compartilhado — geração de imagem via Gemini 2.5 Flash Image.
 *
 * Suporta múltiplas imagens de input + prompt textual. Usado pelos endpoints
 * /api/nail-tryon (2 fotos) e /api/hair-tryon (1-3 fotos).
 *
 * A chave fica SÓ no servidor (GEMINI_API_KEY, sem prefixo VITE_).
 */

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const HF_TOKEN = process.env.HF_TOKEN || '';

const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';

export interface ImagePart {
  mime: string;
  data: string; // base64 puro (sem prefixo data:)
}

/** Converte data URL ("data:image/jpeg;base64,...") em { mime, data }. */
export function toImagePart(dataUrl: string): ImagePart {
  const m = /^data:(image\/[^;]+);base64,(.+)$/.exec(dataUrl);
  if (m) return { mime: m[1], data: m[2] };
  return { mime: 'image/jpeg', data: dataUrl };
}

/**
 * Gera uma imagem a partir de N imagens de referência + um prompt.
 * Retorna a imagem como data URL pronta pra exibir em <img>.
 */
export async function generateImage(
  images: ImagePart[],
  prompt: string,
  temperature = 0.4,
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const parts: any[] = images.map((img) => ({
    inline_data: { mime_type: img.mime, data: img.data },
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    if (res.status === 429 || /quota|exceeded|rate/i.test(t)) {
      throw new Error('Limite de uso da IA atingido. Tente novamente em alguns minutos.');
    }
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const respParts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = respParts.find((p: any) => p.inlineData?.data || p.inline_data?.data);
  const imgData = imgPart?.inlineData?.data || imgPart?.inline_data?.data;
  const imgMime = imgPart?.inlineData?.mimeType || imgPart?.inline_data?.mime_type || 'image/png';

  if (!imgData) {
    const reason = data?.candidates?.[0]?.finishReason;
    if (reason === 'SAFETY') {
      throw new Error('Imagem bloqueada por filtros de segurança. Tente uma foto com melhor enquadramento e iluminação.');
    }
    const txt = respParts.find((p: any) => p.text)?.text;
    throw new Error(txt || 'A IA não conseguiu gerar a imagem. Tente fotos diferentes.');
  }

  return `data:${imgMime};base64,${imgData}`;
}

/** CORS + método. Retorna true se a request já foi respondida (OPTIONS/método inválido). */
export function handleCorsAndMethod(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Método não permitido' });
    return true;
  }
  return false;
}
