import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Hand, Scissors, Camera, Share2, TrendingUp,
  Check, ArrowRight, Instagram, Zap, Heart, Clock, Star,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const goSignup = () => navigate('/login');

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-900">Provador Beauty</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2">
              Entrar
            </button>
            <button onClick={goSignup} className="text-sm font-bold text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 px-4 py-2 rounded-xl transition-all">
              Criar conta grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 text-center max-w-3xl mx-auto anim-fade-up">
        <div className="inline-flex items-center gap-1.5 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <Zap className="w-3.5 h-3.5" /> IA que vende por você
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
          Seu cliente vê o resultado<br />
          <span className="bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">antes de fazer</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto">
          Provador virtual com inteligência artificial para o seu salão. O cliente experimenta
          <strong className="text-slate-700"> cores de esmalte</strong> e
          <strong className="text-slate-700"> cortes de cabelo</strong> pelo celular — e agenda com você.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button onClick={goSignup} className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2">
            Começar grátis <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/login')} className="w-full sm:w-auto text-slate-600 font-semibold px-6 py-3.5">
            Já tenho conta
          </button>
        </div>
        <p className="text-xs text-slate-400">14 dias grátis · 10 simulações/mês no plano gratuito · sem cartão</p>
      </section>

      {/* Números */}
      <section className="px-5 pb-12 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: '+30%', l: 'mais conversão' },
            { n: '−40%', l: 'menos cancelamento' },
            { n: '2 min', l: 'pra configurar' },
          ].map((s) => (
            <div key={s.l} className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-slate-900">{s.n}</p>
              <p className="text-xs text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="px-5 py-12 bg-gradient-to-b from-white to-fuchsia-50/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Como funciona</h2>
          <p className="text-slate-500 text-center mb-8">3 passos — sem instalar nada</p>
          <div className="space-y-4">
            {[
              { icon: <Sparkles className="w-6 h-6" />, t: 'Crie sua conta e seu link', d: 'Escolha o endereço do seu salão: provador.app/seu-salao' },
              { icon: <Share2 className="w-6 h-6" />, t: 'Divulgue pros clientes', d: 'Compartilhe o link no Instagram, WhatsApp e na bio.' },
              { icon: <Heart className="w-6 h-6" />, t: 'Cliente experimenta e agenda', d: 'Ele vê como vai ficar, ama, e marca com você.' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{i + 1}. {s.t}</p>
                  <p className="text-sm text-slate-500">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que experimentar */}
      <section className="px-5 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-slate-900 text-center mb-8">O que seus clientes experimentam</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-6 border border-pink-100">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
              <Hand className="w-7 h-7 text-pink-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Unhas — Mãos & Pés</p>
            <p className="text-slate-500 text-sm">Cliente fotografa o esmalte + a mão. A IA aplica a cor real nas unhas dele.</p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 border border-violet-100">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
              <Scissors className="w-7 h-7 text-violet-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg mb-1">Cabelo — Cortes & Cores</p>
            <p className="text-slate-500 text-sm">Foto do rosto + escolha do corte. A IA aplica mantendo 100% o rosto da pessoa.</p>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="px-5 py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">Por que usar no seu salão</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, t: 'Vende mais', d: 'Cliente decidido fecha mais rápido.' },
              { icon: <Clock className="w-5 h-5 text-blue-600" />, t: 'Menos cancelamento', d: 'Ele já sabe o que quer antes de chegar.' },
              { icon: <Instagram className="w-5 h-5 text-pink-600" />, t: 'Marketing automático', d: 'Seu link vira atração no Instagram.' },
              { icon: <Zap className="w-5 h-5 text-amber-600" />, t: 'Zero complicação', d: 'Sem app, sem instalação. É só o link.' },
            ].map((b) => (
              <div key={b.t} className="flex items-start gap-3 bg-white rounded-2xl p-4">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{b.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{b.t}</p>
                  <p className="text-xs text-slate-500">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="px-5 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Planos simples</h2>
        <p className="text-slate-500 text-center mb-8">Comece grátis. Cresça quando quiser.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200">
            <p className="font-bold text-slate-900 text-lg">Grátis</p>
            <p className="text-3xl font-black text-slate-900 mt-2">R$ 0<span className="text-sm font-medium text-slate-400">/mês</span></p>
            <ul className="space-y-2 mt-5 mb-6">
              {['10 simulações por mês', 'Seu link personalizado', 'Unhas e cabelo', 'Histórico de simulações'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={goSignup} className="w-full border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-all">
              Começar grátis
            </button>
          </div>
          {/* Pro */}
          <div className="bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> POPULAR
            </div>
            <p className="font-bold text-lg">Pro</p>
            <p className="text-3xl font-black mt-2">R$ 39,90<span className="text-sm font-medium text-white/70">/mês</span></p>
            <ul className="space-y-2 mt-5 mb-6">
              {['Simulações ILIMITADAS', 'Seu link personalizado', 'Unhas e cabelo', 'Histórico completo', 'Prioridade na geração'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                  <Check className="w-4 h-4 text-white flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={goSignup} className="w-full bg-white text-fuchsia-700 font-bold py-3 rounded-xl hover:bg-white/90 transition-all">
              Assinar Pro
            </button>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-16 text-center bg-gradient-to-b from-fuchsia-50/40 to-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Pronto pra encantar seus clientes?</h2>
          <p className="text-slate-500 mb-7">Crie sua conta em 2 minutos e comece a usar hoje.</p>
          <button onClick={goSignup} className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-pink-500/25 inline-flex items-center gap-2">
            Criar conta grátis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-700 text-sm">Provador Beauty</span>
        </div>
        <p className="text-xs text-slate-400">Provador virtual com IA para salões de beleza · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
