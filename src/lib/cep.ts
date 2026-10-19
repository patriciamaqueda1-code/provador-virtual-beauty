import type { Address } from '../types';

/** Busca endereço pelo CEP via ViaCEP (gratuito, sem chave). */
export async function lookupCep(cepRaw: string): Promise<Partial<Address> | null> {
  const cep = cepRaw.replace(/\D/g, '');
  if (cep.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) return null;
    return {
      cep,
      street: d.logradouro || '',
      district: d.bairro || '',
      city: d.localidade || '',
      state: d.uf || '',
    };
  } catch {
    return null;
  }
}

export function maskCep(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskDoc(v: string, type: 'pf' | 'pj'): string {
  const d = v.replace(/\D/g, '');
  if (type === 'pf') {
    return d.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
