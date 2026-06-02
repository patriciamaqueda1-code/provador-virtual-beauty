import { useRef, useState } from 'react';
import {
  Camera, Upload, X, Sparkles, Loader2, Download,
  RefreshCw, ChevronLeft, Check, Scissors, ImagePlus,
} from 'lucide-react';
import { useCamera, fileToDataUrl } from '../lib/camera';

type Step = 'photo' | 'style' | 'prompt' | 'generating' | 'result';

interface Props {
  onBack: () => void;
  /** Chamado quando a imagem é gerada — o pai decide como salvar (painel vs público). */
  onResult?: (image: string, params: Record<string, unknown>) => void;
}

interface HairStyle { id: string; label: string; emoji: string; desc: string; }

const HAIR_STYLES: HairStyle[] = [
  { id: 'curto',     label: 'Curto',      emoji: '✂️', desc: 'Até o queixo' },
  { id: 'medio',     label: 'Médio',      emoji: '💇', desc: 'Até os ombros' },
  { id: 'longo',     label: 'Longo',      emoji: '🌊', desc: 'Abaixo dos ombros' },
  { id: 'bob',       label: 'Bob',        emoji: '💁', desc: 'Chanel moderno' },
  { id: 'pixie',     label: 'Pixie',      emoji: '🧚', desc: 'Bem curtinho' },
  { id: 'franja',    label: 'Com franja', emoji: '😎', desc: 'Franja na testa' },
  { id: 'ondulado',  label: 'Ondulado',   emoji: '〰️', desc: 'Ondas naturais' },
  { id: 'cacheado',  label: 'Cacheado',   emoji: '🌀', desc: 'Cachos definidos' },
  { id: 'liso',      label: 'Liso',       emoji: '➖', desc: 'Totalmente liso' },
  { id: 'repicado',  label: 'Repicado',   emoji: '⚡', desc: 'Camadas e textura' },
  { id: 'undercut',  label: 'Undercut',   emoji: '🔥', desc: 'Raspado nas laterais' },
  { id: 'coque',     label: 'Coque',      emoji: '🎀', desc: 'Preso elegante' },
];

const SUGGESTIONS = [
  'Loiro mel',
  'Castanho chocolate',
  'Ruivo acobreado',
  'Com luzes/mechas',
  'Mais volume',
  'Risca ao lado',
];

export default function HairTryOn({ onBack, onResult }: Props) {
  const [step, setStep] = useState<Step>('photo');
  const [photos, setPhotos] = useState<string[]>([]);
  const [styleId, setStyleId] = useState('');
  const [styleRef, setStyleRef] = useState('');       // foto de referência do corte (opcional)
  const [prompt, setPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [error, setError] = useState('');

  const camera = useCamera();
  const fileRef = useRef<HTMLInputElement>(null);
  const styleFileRef = useRef<HTMLInputElement>(null);

  const onPhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files.slice(0, 3 - photos.length)) {
      const url = await fileToDataUrl(f);
      setPhotos((p) => [...p, url].slice(0, 3));
    }
  };

  const onStyleRefFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStyleRef(await fileToDataUrl(f));
  };

  const openCamera = async () => {
    setShowCamera(true);
    await camera.start('user');
  };

  const snap = () => {
    const photo = camera.capture();
    if (photo && photos.length < 3) setPhotos((p) => [...p, photo]);
    camera.stop();
    setShowCamera(false);
  };

  const selectedStyle = HAIR_STYLES.find((s) => s.id === styleId);

  const generate = async () => {
    if (photos.length === 0) return;
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/hair-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImages: photos,
          styleImage: styleRef || undefined,
          styleName: selectedStyle ? `${selectedStyle.label} (${selectedStyle.desc})` : '',
          prompt,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Falha na geração');
      setGeneratedImage(data.image);
      setStep('result');
      onResult?.(data.image, { styleId, prompt });
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagem');
      setStep('prompt');
    }
  };

  const downloadImage = async () => {
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `provador-cabelo-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImage, '_blank');
    }
  };

  const reset = () => {
    setStep('photo');
    setPhotos([]);
    setStyleId('');
    setStyleRef('');
    setPrompt('');
    setGeneratedImage('');
    setError('');
  };

  const canGenerate = photos.length > 0 && (styleId || styleRef || prompt.trim());

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Provador de Cabelo</p>
            <p className="text-[11px] text-slate-400">Cortes & Cores · IA</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      {step !== 'generating' && step !== 'result' && (
        <div className="flex items-center gap-2 mb-6">
          {(['photo', 'style', 'prompt'] as Step[]).map((s, i) => {
            const idx = ['photo', 'style', 'prompt'].indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-violet-600 text-white' :
                  idx > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {idx > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < 2 && <div className="flex-1 h-0.5 bg-slate-200" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Camera overlay */}
      {showCamera && (
        <div className="relative rounded-2xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '3/4' }}>
          <video ref={camera.setVideoEl} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button onClick={snap} className="w-14 h-14 bg-white rounded-full border-4 border-violet-500 shadow-xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-violet-600" />
            </button>
            <button onClick={() => { camera.stop(); setShowCamera(false); }} className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — fotos da pessoa */}
      {step === 'photo' && !showCamera && (
        <div className="anim-fade-up">
          <p className="font-bold text-slate-800 text-lg mb-1">📸 Foto do rosto e cabelo</p>
          <p className="text-slate-500 text-sm mb-4">Tire até 3 fotos de ângulos diferentes — mais fotos = rosto mais fiel.</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-violet-200">
                <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => setPhotos((arr) => arr.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <div className="aspect-square rounded-xl border-2 border-dashed border-violet-200 flex flex-col items-center justify-center text-violet-300">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] mt-1">Foto {photos.length + 1}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={openCamera} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-3 rounded-xl">
              <Camera className="w-4 h-4" /> Câmera
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl">
              <Upload className="w-4 h-4" /> Upload
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoFiles} />

          {photos.length > 0 && (
            <button onClick={() => setStep('style')} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl">
              Continuar → Escolher corte
            </button>
          )}
          {camera.error && <p className="text-xs text-red-500 text-center mt-2">{camera.error}</p>}
        </div>
      )}

      {/* STEP 2 — escolher corte */}
      {step === 'style' && (
        <div className="anim-fade-up">
          <button onClick={() => setStep('photo')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <p className="font-bold text-slate-800 text-lg mb-1">💇 Escolha o corte</p>
          <p className="text-slate-500 text-sm mb-4">Selecione um estilo ou envie uma foto de referência.</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {HAIR_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleId(styleId === s.id ? '' : s.id)}
                className={`border-2 rounded-2xl p-2.5 text-center transition-all ${
                  styleId === s.id ? 'border-violet-500 bg-violet-50 shadow-md' : 'border-slate-200 bg-white hover:border-violet-200'
                }`}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className={`text-xs font-bold ${styleId === s.id ? 'text-violet-700' : 'text-slate-700'}`}>{s.label}</p>
                <p className="text-[9px] text-slate-400 leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Referência por foto */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 mb-2">Ou envie uma foto do corte desejado (opcional)</p>
            {styleRef ? (
              <div className="flex items-center gap-3">
                <img src={styleRef} alt="Referência" className="w-16 h-16 object-cover rounded-xl" />
                <button onClick={() => setStyleRef('')} className="text-xs text-pink-500 hover:text-pink-700">Remover</button>
              </div>
            ) : (
              <button onClick={() => styleFileRef.current?.click()} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
                <Upload className="w-4 h-4" /> Enviar referência
              </button>
            )}
            <input ref={styleFileRef} type="file" accept="image/*" className="hidden" onChange={onStyleRefFile} />
          </div>

          <button
            onClick={() => setStep('prompt')}
            disabled={!styleId && !styleRef}
            className={`w-full font-semibold py-3.5 rounded-xl ${
              !styleId && !styleRef ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
            }`}
          >
            Continuar → Descrever
          </button>
        </div>
      )}

      {/* STEP 3 — descrição */}
      {step === 'prompt' && (
        <div className="anim-fade-up">
          <button onClick={() => setStep('style')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <p className="font-bold text-slate-800 text-lg mb-1">✍️ Como você quer ficar?</p>
          <p className="text-slate-500 text-sm mb-4">Descreva cor, comprimento, franja, volume — o que imaginar.</p>

          {/* Resumo */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <img key={i} src={p} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-slate-200" />
            ))}
            {selectedStyle && (
              <div className="bg-violet-50 rounded-lg px-3 py-2 flex-shrink-0 text-center">
                <div className="text-lg">{selectedStyle.emoji}</div>
                <p className="text-[10px] font-bold text-violet-700">{selectedStyle.label}</p>
              </div>
            )}
            {styleRef && <img src={styleRef} alt="ref" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border-2 border-violet-300" />}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: loiro mel com mechas, franja lateral, mais volume no topo, pontas onduladas..."
            rows={4}
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-violet-400 resize-none mb-3"
          />

          <div className="flex flex-wrap gap-1.5 mb-4">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setPrompt((p) => (p ? `${p}, ${s}` : s))} className="text-[11px] bg-white hover:bg-violet-50 hover:text-violet-700 text-slate-600 px-3 py-1.5 rounded-full shadow-sm">
                + {s}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3"><p className="text-xs text-red-600">{error}</p></div>}

          <button
            onClick={generate}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 ${
              !canGenerate ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg'
            }`}
          >
            <Sparkles className="w-5 h-5" /> Gerar novo visual
          </button>
        </div>
      )}

      {/* STEP 4 — gerando */}
      {step === 'generating' && (
        <div className="text-center py-16 anim-fade-up">
          <Loader2 className="w-16 h-16 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="font-bold text-slate-900 text-lg mb-1">Criando seu novo visual…</p>
          <p className="text-slate-500 text-sm">A IA está aplicando o corte e preservando seu rosto. 20-40s.</p>
        </div>
      )}

      {/* STEP 5 — resultado */}
      {step === 'result' && generatedImage && (
        <div className="anim-fade-up">
          <p className="font-bold text-slate-800 text-lg mb-3">✨ Seu novo visual</p>

          {/* Antes / Depois */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200">
              <div className="bg-slate-700 text-white text-center py-1 text-[10px] font-bold tracking-widest">ANTES</div>
              <img src={photos[0]} alt="Antes" className="w-full aspect-square object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden border-2 border-violet-300">
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-center py-1 text-[10px] font-bold tracking-widest">DEPOIS</div>
              <img src={generatedImage} alt="Depois" className="w-full aspect-square object-cover" />
            </div>
          </div>

          {/* Resultado grande */}
          <div className="rounded-3xl overflow-hidden border-4 border-violet-100 shadow-xl bg-white mb-4">
            <img src={generatedImage} alt="Resultado" className="w-full object-cover" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={downloadImage} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm">
              <Download className="w-4 h-4" /> Baixar
            </button>
            <button onClick={reset} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl text-sm">
              <RefreshCw className="w-4 h-4" /> Novo visual
            </button>
          </div>
          <button onClick={onBack} className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2">Voltar ao início</button>
        </div>
      )}
    </div>
  );
}
