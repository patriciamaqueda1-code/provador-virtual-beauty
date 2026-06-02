/**
 * POST /api/save-session
 *
 * Salva uma simulação no histórico de um salão e consome 1 da cota.
 * Usado pela página pública (/:slug) onde o cliente NÃO está logado —
 * por isso roda no servidor com a service_role (bypassa RLS), de forma segura.
 *
 * Body: { salonId, type: 'nail'|'hair', resultImage, params?, clientName? }
 * Resp: { ok: true, consumed: boolean } | { ok: false, error }
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jneokgfjwxqojpagkrkw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function sbRpc(fn: string, args: object) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  return r.ok ? r.json() : null;
}

async function sbInsert(table: string, row: object) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!SERVICE_KEY) {
    // Sem service_role configurada: não bloqueia o cliente, só não salva.
    return res.status(200).json({ ok: true, consumed: false, note: 'SERVICE_ROLE não configurada' });
  }

  try {
    const { salonId, type, resultImage, params = {}, clientName = null } = req.body || {};
    if (!salonId || !type || !resultImage) {
      return res.status(400).json({ ok: false, error: 'salonId, type e resultImage são obrigatórios' });
    }

    // Consome cota (reset mensal automático dentro da função)
    const consumed = await sbRpc('consume_quota', { p_salon_id: salonId });

    // Salva a sessão no histórico
    await sbInsert('tryon_sessions', {
      salon_id: salonId,
      type,
      result_image: resultImage,
      params,
      client_name: clientName,
    });

    return res.status(200).json({ ok: true, consumed: consumed === true });
  } catch (err: any) {
    console.error('[save-session]', err?.message);
    // Nunca quebra o fluxo do cliente
    return res.status(200).json({ ok: true, consumed: false });
  }
}
