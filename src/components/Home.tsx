import { Sparkles, ChevronRight, Hand, Scissors } from 'lucide-react';
import type { Screen } from '../App';

export default function Home({ onPick }: { onPick: (s: Screen) => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="px-6 pt-12 pb-8 text-center max-w-lg mx-auto anim-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Provador Virtual de Salão
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Veja o resultado <span className="font-semibold text-pink-600">antes de fazer</span>.
          Experimente cores de esmalte e cortes de cabelo com inteligência artificial.
        </p>
      </header>

      {/* Cards */}
      <main className="flex-1 px-6 max-w-lg mx-auto w-full space-y-4">
        {/* Unhas */}
        <button
          onClick={() => onPick('nail')}
          className="group w-full text-left bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-pink-300 hover:shadow-lg transition-all anim-fade-up"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
              <Hand className="w-7 h-7 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg">Unhas — Mãos & Pés</p>
              <p className="text-slate-500 text-sm">
                Fotografe o esmalte + sua mão. A IA aplica a cor real nas unhas.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Cabelo */}
        <button
          onClick={() => onPick('hair')}
          className="group w-full text-left bg-white rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-violet-300 hover:shadow-lg transition-all anim-fade-up"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-7 h-7 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg">Cabelo — Cortes & Cores</p>
              <p className="text-slate-500 text-sm">
                Tire uma foto, escolha o corte e descreva. A IA mantém seu rosto 100%.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Como funciona */}
        <div className="bg-white/60 rounded-2xl p-5 mt-2">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Como funciona</p>
          <div className="space-y-2.5 text-sm text-slate-600">
            {[
              '📸 Tire ou envie as fotos pedidas',
              '🎨 Escolha a cor ou o corte desejado',
              '🤖 A IA gera o resultado em segundos',
              '💾 Baixe e mostre pro cliente',
            ].map((s) => (
              <div key={s} className="flex items-center gap-2">{s}</div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-slate-400">
        Powered by IA · Suas fotos não são armazenadas
      </footer>
    </div>
  );
}
