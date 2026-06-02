import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Hand, Scissors, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NailTryOn from './NailTryOn';
import HairTryOn from './HairTryOn';

interface PublicSalonData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  quota_available: boolean;
}

type View = 'home' | 'nail' | 'hair';

export default function PublicSalon() {
  const { slug } = useParams<{ slug: string }>();
  const [salon, setSalon] = useState<PublicSalonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    supabase
      .rpc('get_public_salon', { p_slug: slug })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        setSalon((row as PublicSalonData) ?? null);
        setLoading(false);
      });
  }, [slug]);

  // Salva a simulação no salão (server-side, via service_role)
  const saveResult = (type: 'nail' | 'hair') => (image: string, params: Record<string, unknown>) => {
    if (!salon) return;
    fetch('/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salonId: salon.id, type, resultImage: image, params }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-fuchsia-600 animate-spin" />
      </div>
    );
  }

  // Salão não encontrado
  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Salão não encontrado</h1>
          <p className="text-slate-500 text-sm">O link <span className="font-mono text-fuchsia-600">/{slug}</span> não existe ou foi alterado.</p>
        </div>
      </div>
    );
  }

  // Provador aberto
  if (view === 'nail') return <NailTryOn onBack={() => setView('home')} onResult={saveResult('nail')} />;
  if (view === 'hair') return <HairTryOn onBack={() => setView('home')} onResult={saveResult('hair')} />;

  // Home pública do salão
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 pt-12 pb-8 text-center max-w-lg mx-auto anim-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <p className="text-xs font-bold text-fuchsia-600 uppercase tracking-wide mb-1">Provador Virtual</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{salon.name}</h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Experimente <span className="font-semibold text-pink-600">cores de esmalte</span> e
          <span className="font-semibold text-violet-600"> cortes de cabelo</span> com IA, antes de fazer.
        </p>
      </header>

      <main className="flex-1 px-6 max-w-lg mx-auto w-full space-y-4">
        {!salon.quota_available && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">Este salão atingiu o limite de simulações do mês.</p>
            <p className="text-xs text-amber-600 mt-0.5">Volte em breve ou fale com o salão.</p>
          </div>
        )}

        <button
          onClick={() => setView('nail')}
          disabled={!salon.quota_available}
          className="group w-full text-left bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-pink-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
              <Hand className="w-7 h-7 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg">Unhas — Mãos & Pés</p>
              <p className="text-slate-500 text-sm">Fotografe o esmalte + sua mão. A IA aplica a cor real.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => setView('hair')}
          disabled={!salon.quota_available}
          className="group w-full text-left bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-violet-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-7 h-7 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg">Cabelo — Cortes & Cores</p>
              <p className="text-slate-500 text-sm">Tire uma foto, escolha o corte e descreva. A IA mantém seu rosto.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-slate-400">
        {salon.name} · Powered by Provador Virtual Beauty · Suas fotos não são armazenadas
      </footer>
    </div>
  );
}
