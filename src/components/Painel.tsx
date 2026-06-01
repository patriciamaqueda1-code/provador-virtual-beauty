import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Hand, Scissors, LogOut, ChevronRight, Clock, Zap, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, type TryonSession } from '../lib/supabase';

export default function Painel() {
  const navigate = useNavigate();
  const { salon, signOut } = useAuth();
  const [sessions, setSessions] = useState<TryonSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon) return;
    supabase
      .from('tryon_sessions')
      .select('*')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        setSessions((data as TryonSession[]) ?? []);
        setLoading(false);
      });
  }, [salon]);

  const quotaLeft = salon ? Math.max(0, salon.quota_limit - salon.quota_used) : 0;
  const isPro = salon?.subscription_status === 'active';

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate max-w-[160px]">{salon?.name || 'Meu Salão'}</p>
              <p className="text-[11px] text-slate-400">{isPro ? 'Plano Pro' : 'Plano Grátis'}</p>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate('/login'); }} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {/* Cota */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${isPro ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            {isPro ? (
              <p className="text-sm font-semibold text-emerald-800">Simulações ilimitadas ✨</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-800">{quotaLeft} simulações restantes este mês</p>
                <p className="text-xs text-amber-600">Plano grátis: {salon?.quota_limit ?? 10}/mês</p>
              </>
            )}
          </div>
          {!isPro && (
            <button className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-lg">
              Assinar Pro
            </button>
          )}
        </div>

        {/* Cards do provador */}
        <div>
          <p className="font-bold text-slate-800 text-base mb-3">Novo provador</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/provador/nail')}
              className="group bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-pink-300 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-3">
                <Hand className="w-6 h-6 text-pink-600" />
              </div>
              <p className="font-bold text-slate-900 text-sm">Unhas</p>
              <p className="text-slate-500 text-xs mt-0.5">Mãos & pés · esmalte</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-pink-500 font-medium">
                Começar <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigate('/provador/hair')}
              className="group bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-violet-300 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3">
                <Scissors className="w-6 h-6 text-violet-600" />
              </div>
              <p className="font-bold text-slate-900 text-sm">Cabelo</p>
              <p className="text-slate-500 text-xs mt-0.5">Cortes & cores</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-violet-500 font-medium">
                Começar <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Histórico / Galeria */}
        <div>
          <p className="font-bold text-slate-800 text-base mb-3">Histórico de simulações</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma simulação ainda.</p>
              <p className="text-xs text-slate-400">Suas gerações aparecem aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sessions.map((s) => (
                <div key={s.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={s.result_image} alt={s.client_name || s.type} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[10px] text-white font-medium truncate">
                      {s.type === 'nail' ? '💅' : '✂️'} {s.client_name || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
