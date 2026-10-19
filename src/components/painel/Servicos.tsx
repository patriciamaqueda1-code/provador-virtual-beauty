import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, Scissors, X } from 'lucide-react';
import { Services, brl } from '../../lib/api';
import type { Service } from '../../types';

export default function Servicos({ salonId }: { salonId: string }) {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const load = () => Services.list(salonId).then((d) => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, [salonId]);

  const save = async () => {
    if (!editing?.name) return;
    await Services.upsert({
      id: editing.id,
      salon_id: salonId,
      name: editing.name,
      description: editing.description ?? null,
      duration_minutes: Number(editing.duration_minutes) || 30,
      price: Number(editing.price) || 0,
      is_active: editing.is_active ?? true,
    });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    await Services.remove(id);
    load();
  };

  if (loading) return <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto my-8" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800">Serviços ({items.length})</p>
        <button onClick={() => setEditing({ duration_minutes: 30, price: 0 })}
          className="flex items-center gap-1.5 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
        </div>
      )}

      {items.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
            <p className="text-xs text-slate-500">{s.duration_minutes} min · {brl(s.price)}</p>
          </div>
          <button onClick={() => setEditing(s)} className="p-2 text-slate-400 hover:text-fuchsia-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => remove(s.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}

      {editing && (
        <Modal title={editing.id ? 'Editar serviço' : 'Novo serviço'} onClose={() => setEditing(null)} onSave={save}>
          <Field label="Nome" value={editing.name ?? ''} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="Descrição" value={editing.description ?? ''} onChange={(v) => setEditing({ ...editing, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)" type="number" value={String(editing.duration_minutes ?? 30)} onChange={(v) => setEditing({ ...editing, duration_minutes: Number(v) })} />
            <Field label="Preço (R$)" type="number" value={String(editing.price ?? 0)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Modal({ title, children, onClose, onSave }: {
  title: string; children: React.ReactNode; onClose: () => void; onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-900">{title}</p>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
        <button onClick={onSave} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-xl">Salvar</button>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 mb-1 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-fuchsia-400" />
    </label>
  );
}
