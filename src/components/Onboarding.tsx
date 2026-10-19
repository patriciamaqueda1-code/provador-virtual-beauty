import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Building2, User as UserIcon, MapPin, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { lookupCep, maskCep, maskDoc } from '../lib/cep';
import type { Address } from '../types';

export default function Onboarding() {
  const navigate = useNavigate();
  const { salon, refreshSalon } = useAuth();

  const [type, setType] = useState<'pf' | 'pj'>(salon?.person_type ?? 'pf');
  const [name, setName] = useState(salon?.name ?? '');
  const [document, setDocument] = useState(salon?.document ?? '');
  const [razao, setRazao] = useState(salon?.razao_social ?? '');
  const [ie, setIe] = useState(salon?.inscricao_estadual ?? '');
  const [birthdate, setBirthdate] = useState(salon?.birthdate ?? '');
  const [whatsapp, setWhatsapp] = useState(salon?.phone ?? '');
  const [addr, setAddr] = useState<Address>(salon?.address ?? {});
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCep = async (raw: string) => {
    const masked = maskCep(raw);
    setAddr((a) => ({ ...a, cep: masked }));
    if (masked.replace(/\D/g, '').length === 8) {
      setCepLoading(true);
      const found = await lookupCep(masked);
      setCepLoading(false);
      if (found) setAddr((a) => ({ ...a, ...found, cep: masked }));
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    setSaving(true);
    setError('');
    const { error } = await supabase
      .from('salons')
      .update({
        name,
        person_type: type,
        document,
        razao_social: type === 'pj' ? razao : null,
        inscricao_estadual: type === 'pj' ? ie : null,
        birthdate: birthdate || null,
        phone: whatsapp,
        address: addr,
        onboarded: true,
      })
      .eq('id', salon.id);
    if (error) { setError(error.message); setSaving(false); return; }
    await refreshSalon();
    navigate('/painel');
  };

  return (
    <div className="min-h-screen px-5 py-8 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Complete seu cadastro</h1>
          <p className="text-slate-500 text-sm">Faltam só alguns dados pra liberar tudo.</p>
        </div>

        <form onSubmit={save} className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
          {/* PF / PJ */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('pf')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${type === 'pf' ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500'}`}>
              <UserIcon className="w-4 h-4" /> Pessoa Física
            </button>
            <button type="button" onClick={() => setType('pj')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${type === 'pj' ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500'}`}>
              <Building2 className="w-4 h-4" /> Pessoa Jurídica
            </button>
          </div>

          <Input label={type === 'pj' ? 'Nome fantasia' : 'Seu nome / do salão'} value={name} onChange={setName} required />

          {type === 'pj' && (
            <>
              <Input label="Razão social" value={razao} onChange={setRazao} />
              <Input label="Inscrição estadual" value={ie} onChange={setIe} />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={type === 'pf' ? 'CPF' : 'CNPJ'}
              value={document}
              onChange={(v) => setDocument(maskDoc(v, type))}
              required
            />
            {type === 'pf'
              ? <Input label="Nascimento" type="date" value={birthdate} onChange={setBirthdate} />
              : <Input label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />}
          </div>
          {type === 'pf' && <Input label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />}

          {/* Endereço */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-3"><MapPin className="w-4 h-4" /> Endereço</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Input label="CEP" value={addr.cep ?? ''} onChange={onCep} />
                {cepLoading && <Loader2 className="w-4 h-4 text-fuchsia-500 animate-spin absolute right-3 top-9" />}
              </div>
              <Input label="Número" value={addr.number ?? ''} onChange={(v) => setAddr((a) => ({ ...a, number: v }))} />
            </div>
            <div className="mt-3"><Input label="Rua" value={addr.street ?? ''} onChange={(v) => setAddr((a) => ({ ...a, street: v }))} /></div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Input label="Bairro" value={addr.district ?? ''} onChange={(v) => setAddr((a) => ({ ...a, district: v }))} />
              <Input label="Complemento" value={addr.complement ?? ''} onChange={(v) => setAddr((a) => ({ ...a, complement: v }))} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="col-span-2"><Input label="Cidade" value={addr.city ?? ''} onChange={(v) => setAddr((a) => ({ ...a, city: v }))} /></div>
              <Input label="UF" value={addr.state ?? ''} onChange={(v) => setAddr((a) => ({ ...a, state: v }))} />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Salvar e continuar</>}
          </button>
          <button type="button" onClick={() => navigate('/painel')} className="w-full text-slate-400 text-xs font-semibold py-1">
            Pular por enquanto
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-fuchsia-400 transition-all"
      />
    </label>
  );
}
