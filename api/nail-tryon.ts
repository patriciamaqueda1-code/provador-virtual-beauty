/**
 * POST /api/nail-tryon — Provador Virtual de Esmalte
 *
 * Body: {
 *   handImage:   string  (data URL — foto da mão/pé da pessoa)
 *   bottleImage: string  (data URL — foto do vidro de esmalte)
 *   color?:      string  (hex detectado, ex: '#FF1493')
 *   prompt?:     string  (instruções adicionais)
 * }
 * Resp: { ok: true, image: string (data URL), provider: string }
 */
import { generateImage, toImagePart, handleCorsAndMethod, GEMINI_API_KEY } from './_lib/gemini';

export default async function handler(req: any, res: any) {
  if (handleCorsAndMethod(req, res)) return;

  try {
    const { handImage, bottleImage, color = '', prompt = '' } = req.body || {};

    if (!handImage || !bottleImage) {
      return res.status(400).json({
        ok: false,
        error: 'Envie a foto da mão/pé E a foto do vidro de esmalte.',
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error: 'IA não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente.',
      });
    }

    const colorHint = color ? `Cor aproximada detectada: ${color}. ` : '';
    const fullPrompt = `Você é um especialista profissional em manicure e pedicure.

Você recebeu DUAS imagens:
1. Foto da mão (ou pé) de uma pessoa — onde o esmalte será aplicado.
2. Foto de um vidro de esmalte — referência EXATA de cor e acabamento.

TAREFA: Gere UMA imagem fotorrealista da MESMA mão/pé da imagem 1, com o esmalte da imagem 2 aplicado em TODAS as unhas.

PRESERVE com 100% de fidelidade (NÃO altere):
- A mão/pé da pessoa: formato, dedos, anatomia, posição, tom de pele exato
- O fundo e o enquadramento da foto original
- A textura natural da pele, veias, dobras

APLIQUE APENAS:
- A cor EXATA do esmalte da imagem 2 nas unhas (observe a cor visualmente, não invente)
- O acabamento que aparece no vidro: cremoso, glitter, matte/fosco ou perolado
${colorHint}${prompt ? `\nPreferências do cliente: ${prompt}\n` : ''}
RESULTADO: close-up profissional de salão de beleza, iluminação natural, foco nas unhas com o esmalte aplicado de forma realista e impecável.`;

    const image = await generateImage(
      [toImagePart(handImage), toImagePart(bottleImage)],
      fullPrompt,
      0.35,
    );

    return res.status(200).json({ ok: true, image, provider: 'gemini-2.5-flash-image' });
  } catch (err: any) {
    console.error('[nail-tryon]', err?.message);
    return res.status(500).json({ ok: false, error: err?.message || 'Erro ao gerar imagem' });
  }
}
