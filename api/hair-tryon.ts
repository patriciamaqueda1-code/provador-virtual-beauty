/**
 * POST /api/hair-tryon — Provador Virtual de Cabelo
 *
 * A profissional fotografa o rosto/cabelo da pessoa, escolhe um corte (nome
 * de estilo OU foto de referência) e escreve em texto o que deseja. A IA
 * aplica o novo corte preservando 100% da fisionomia/rosto da pessoa.
 *
 * Body: {
 *   personImages: string[]  (1-3 data URLs — fotos do rosto/cabelo da pessoa)
 *   styleImage?:  string     (data URL — foto de referência do corte, opcional)
 *   styleName?:   string     (nome do corte escolhido, ex: 'Bob curto')
 *   prompt?:      string     (texto livre: cor, franja, comprimento, etc.)
 * }
 * Resp: { ok: true, image: string (data URL), provider: string }
 */
import { generateImage, toImagePart, handleCorsAndMethod, GEMINI_API_KEY } from './_lib/gemini';

const FACE_LOCK = `REGRA ABSOLUTA — PRESERVAÇÃO TOTAL DO ROSTO (NUNCA viole):
A pessoa na foto deve permanecer EXATAMENTE a mesma. É proibido alterar:
✓ Identidade — é a MESMA pessoa, reconhecível
✓ Formato e estrutura óssea do rosto
✓ Tom de pele exato (não clarear, não escurecer)
✓ Cor, formato e tamanho dos olhos
✓ Nariz — forma e tamanho idênticos
✓ Boca e lábios — contorno e espessura idênticos
✓ Sobrancelhas — arco, espessura e cor
✓ Expressão facial e pose da cabeça
✓ Sardas, sinais, marcas e textura da pele
✓ Fundo e iluminação da foto original

PERMITIDO alterar APENAS o cabelo (corte, comprimento, textura, e cor SE pedido).`;

export default async function handler(req: any, res: any) {
  if (handleCorsAndMethod(req, res)) return;

  try {
    const {
      personImages = [],
      styleImage = '',
      styleName = '',
      prompt = '',
    } = req.body || {};

    const photos: string[] = Array.isArray(personImages)
      ? personImages.filter(Boolean)
      : (personImages ? [personImages] : []);

    if (photos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Envie ao menos uma foto do rosto/cabelo da pessoa.',
      });
    }

    if (!styleName && !styleImage && !prompt) {
      return res.status(400).json({
        ok: false,
        error: 'Escolha um corte, envie uma referência ou descreva o resultado desejado.',
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error: 'IA não configurada. Defina GEMINI_API_KEY nas variáveis de ambiente.',
      });
    }

    // Monta o array de imagens: fotos da pessoa primeiro, depois referência do corte
    const imageParts = photos.slice(0, 3).map(toImagePart);
    let styleBlock = '';

    if (styleImage) {
      imageParts.push(toImagePart(styleImage));
      styleBlock = `A ÚLTIMA imagem é a REFERÊNCIA do corte/penteado desejado. Aplique esse corte na pessoa das imagens anteriores. Use a referência apenas para o ESTILO do cabelo — ignore o rosto e a identidade da pessoa da referência.`;
    } else if (styleName) {
      styleBlock = `Corte/estilo desejado: "${styleName}".`;
    }

    const nPersona = styleImage ? photos.length : imageParts.length;
    const personaBlock = `As ${nPersona} primeira(s) imagem(ns) são da MESMA pessoa (cliente). Use-as como referência da identidade e do rosto a preservar.`;

    const fullPrompt = `Você é um cabeleireiro e editor de imagem profissional, especialista em simulação de cortes de cabelo (virtual hair try-on).

${personaBlock}
${styleBlock}

${FACE_LOCK}

MUDANÇA A APLICAR NO CABELO:
${styleName ? `- Corte: ${styleName}\n` : ''}${prompt ? `- Detalhes pedidos: ${prompt}\n` : ''}
RESULTADO ESPERADO: uma foto fotorrealista de alta qualidade da MESMA pessoa, com o novo cabelo aplicado de forma natural e profissional, como saída do estúdio de um salão de beleza. A pessoa deve ser claramente reconhecível como a mesma das fotos originais — apenas o cabelo mudou.`;

    const image = await generateImage(imageParts, fullPrompt, 0.3);

    return res.status(200).json({ ok: true, image, provider: 'gemini-2.5-flash-image' });
  } catch (err: any) {
    console.error('[hair-tryon]', err?.message);
    return res.status(500).json({ ok: false, error: err?.message || 'Erro ao gerar imagem' });
  }
}
