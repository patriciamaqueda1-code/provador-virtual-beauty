import { supabase } from './supabase';

/**
 * Salva uma simulação no histórico do salão e consome 1 da cota.
 * Falha silenciosa — nunca quebra o fluxo de geração de imagem.
 */
export async function saveSession(
  salonId: string,
  type: 'nail' | 'hair',
  resultImage: string,
  params: Record<string, unknown>,
  clientName?: string,
): Promise<void> {
  try {
    await supabase.rpc('consume_quota', { p_salon_id: salonId });
    await supabase.from('tryon_sessions').insert({
      salon_id: salonId,
      type,
      result_image: resultImage,
      params,
      client_name: clientName ?? null,
    });
  } catch (e) {
    console.warn('[saveSession] falhou (ignorado):', e);
  }
}
