import { useRef, useState } from 'react';
import {
  Camera, Upload, X, Sparkles, Loader2, Download,
  RefreshCw, ChevronLeft, Palette, Check, ImageIcon,
} from 'lucide-react';
import { useCamera, fileToDataUrl, extractDominantColor } from '../lib/camera';

type Step = 'bottle' | 'hand' | 'prompt' | 'generating' | 'result';

const SUGGESTIONS = [
  'Acabamento brilhante',
  'Francesinha clássica',
  'Glitter discreto',
  'Acabamento matte/fosco',
  'Nail art em uma unha',
];

export default function NailTryOn({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('bottle');
  const [bottlePhoto, setBottlePhoto] = useState('');
  const [handPhoto, setHandPhoto] = useState('');
  const [color, setColor] = useState('#E11D74');
  const [prompt, setPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'bottle' | 'hand'>('bottle');
  const [generatedImage, setGeneratedImage] = useState('');
  const [error, setError] = useState('');

  const camera = useCamera();
  const bottleFileRef = useRef<HTMLInputElement>(null);
  const handFileRef = useRef<HTMLInputElement>(null);

  const onBottleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    setBottlePhoto(url);
    setColor(await extractDominantColor(url));
  };

  const onHandFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setHandPhoto(await fileToDataUrl(f));
  };

  const openCamera = async (target: 'bottle' | 'hand') => {
    setCameraTarget(target);
    setShowCamera(true);
    await camera.start('environment');
  };

  const snap = async () => {
    const photo = camera.capture();
    if (!photo) return;
    if (cameraTarget === 'bottle') {
      setBottlePhoto(photo);
      setColor(await extractDominantColor(photo));
    } else {
      setHandPhoto(photo);
    }
    camera.stop();
    setShowCamera(false);
  };

  const generate = async () => {
    if (!bottlePhoto || !handPhoto) return;
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/nail-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handImage: handPhoto, bottleImage: bottlePhoto, color, prompt }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Falha na geração');
      setGeneratedImage(data.image);
      setStep('result');
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
      a.download = `provador-unhas-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImage, '_blank');
    }
  };

  const reset = () => {
    setStep('bottle');
    setBottlePhoto('');
    setHandPhoto('');
    setPrompt('');
    setGeneratedImage('');
    setError('');
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Provador de Esmalte</p>
            <p className="text-[11px] text-slate-400">Mãos & Pés · IA</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      {step !== 'generating' && step !== 'result' && (
        <div className="flex items-center gap-2 mb-6">
          {(['bottle', 'hand', 'prompt'] as Step[]).map((s, i) => {
            const idx = ['bottle', 'hand', 'prompt'].indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-pink-600 text-white' :
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
        <div className="relative rounded-2xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '4/3' }}>
          <video ref={camera.setVideoEl} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button onClick={snap} className="w-14 h-14 bg-white rounded-full border-4 border-pink-500 shadow-xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-pink-600" />
            </button>
            <button onClick={() => { camera.stop(); setShowCamera(false); }} className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — esmalte */}
      {step === 'bottle' && !showCamera && (
        <div className="anim-fade-up">
          <p className="font-bold text-slate-800 text-lg mb-1">💅 Foto do esmalte</p>
          <p className="text-slate-500 text-sm mb-4">A IA detecta a cor automaticamente.</p>

          {bottlePhoto ? (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <img src={bottlePhoto} alt="Esmalte" className="w-32 h-32 object-cover rounded-xl mx-auto border-4 border-white shadow mb-3" />
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ background: color }} />
                <p className="text-sm font-medium text-slate-700">Cor: <span className="font-bold">{color.toUpperCase()}</span></p>
              </div>
              <button onClick={() => setBottlePhoto('')} className="text-xs text-pink-500 hover:text-pink-700 mx-auto block">Trocar foto</button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-pink-200 rounded-2xl p-6 text-center mb-4 bg-white/50">
              <Palette className="w-10 h-10 text-pink-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">Fotografe o vidro de esmalte</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => openCamera('bottle')} className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <Camera className="w-4 h-4" /> Câmera
                </button>
                <button onClick={() => bottleFileRef.current?.click()} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
              <input ref={bottleFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onBottleFile} />
            </div>
          )}

          <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-4 shadow-sm">
            <label className="text-xs text-slate-500 flex-1">Ajustar cor manualmente:</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
          </div>

          {bottlePhoto && (
            <button onClick={() => setStep('hand')} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3.5 rounded-xl">
              Continuar → Foto da mão/pé
            </button>
          )}
          {camera.error && <p className="text-xs text-red-500 text-center mt-2">{camera.error}</p>}
        </div>
      )}

      {/* STEP 2 — mão */}
      {step === 'hand' && !showCamera && (
        <div className="anim-fade-up">
          <button onClick={() => setStep('bottle')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <p className="font-bold text-slate-800 text-lg mb-1">📸 Foto da mão ou pé</p>
          <p className="text-slate-500 text-sm mb-4">Boa iluminação e unhas bem visíveis.</p>

          {handPhoto ? (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <img src={handPhoto} alt="Mão" className="w-full max-h-64 object-contain rounded-xl mx-auto" />
              <button onClick={() => setHandPhoto('')} className="text-xs text-pink-500 hover:text-pink-700 mx-auto block mt-3">Trocar foto</button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-pink-200 rounded-2xl p-6 text-center mb-4 bg-white/50">
              <ImageIcon className="w-10 h-10 text-pink-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">Mão ou pé com unhas visíveis</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => openCamera('hand')} className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <Camera className="w-4 h-4" /> Câmera
                </button>
                <button onClick={() => handFileRef.current?.click()} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
              <input ref={handFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onHandFile} />
            </div>
          )}

          {handPhoto && (
            <button onClick={() => setStep('prompt')} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3.5 rounded-xl">
              Continuar → Detalhes
            </button>
          )}
        </div>
      )}

      {/* STEP 3 — prompt */}
      {step === 'prompt' && (
        <div className="anim-fade-up">
          <button onClick={() => setStep('hand')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <p className="font-bold text-slate-800 text-lg mb-1">✍️ Detalhes (opcional)</p>
          <p className="text-slate-500 text-sm mb-4">Acabamento, design, preferências.</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2 text-center shadow-sm">
              <img src={bottlePhoto} alt="Esmalte" className="w-full h-20 object-cover rounded-lg mb-1" />
              <p className="text-[10px] text-slate-500">Esmalte · <span className="font-bold" style={{ color }}>{color}</span></p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm">
              <img src={handPhoto} alt="Mão" className="w-full h-20 object-cover rounded-lg mb-1" />
              <p className="text-[10px] text-slate-500">Mão/pé</p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: acabamento brilhante, francesinha, glitter discreto..."
            rows={3}
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-pink-400 resize-none mb-3"
          />

          <div className="flex flex-wrap gap-1.5 mb-4">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setPrompt((p) => (p ? `${p}, ${s}` : s))} className="text-[11px] bg-white hover:bg-pink-50 hover:text-pink-700 text-slate-600 px-3 py-1.5 rounded-full shadow-sm">
                + {s}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3"><p className="text-xs text-red-600">{error}</p></div>}

          <button onClick={generate} className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 shadow-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" /> Gerar imagem com IA
          </button>
        </div>
      )}

      {/* STEP 4 — gerando */}
      {step === 'generating' && (
        <div className="text-center py-16 anim-fade-up">
          <Loader2 className="w-16 h-16 text-pink-600 animate-spin mx-auto mb-4" />
          <p className="font-bold text-slate-900 text-lg mb-1">Gerando sua imagem…</p>
          <p className="text-slate-500 text-sm">A IA está aplicando o esmalte. Aguarde 15-30s.</p>
        </div>
      )}

      {/* STEP 5 — resultado */}
      {step === 'result' && generatedImage && (
        <div className="anim-fade-up">
          <p className="font-bold text-slate-800 text-lg mb-3">✨ Resultado</p>
          <div className="rounded-3xl overflow-hidden border-4 border-pink-100 shadow-xl bg-white mb-4">
            <img src={generatedImage} alt="Resultado" className="w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={downloadImage} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm">
              <Download className="w-4 h-4" /> Baixar
            </button>
            <button onClick={reset} className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl text-sm">
              <RefreshCw className="w-4 h-4" /> Nova simulação
            </button>
          </div>
          <button onClick={onBack} className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2">Voltar ao início</button>
        </div>
      )}
    </div>
  );
}
