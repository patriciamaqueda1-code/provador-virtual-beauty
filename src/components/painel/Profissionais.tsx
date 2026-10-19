import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, Users } from 'lucide-react';
import { Professionals } from '../../lib/api';
import type { Professional } from '../../types';
import { Modal, Field } from './Servicos';

const DEFAULT_HOURS: Professional['work_hours'] = {
  '1': [['09:00', '18:00']], '2': [['09:00', '18:00']], '3': [['09:00', '18:00']],
  '4': [['09:00', '18:00']], '5': [['09:00', '18:00']], '6': [['09:00', '13:00']],
};

export default function Profissionais({ salonId }: { salonId: string }) {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Professional> | null>(null);

  const load = () => Professionals.list(salonId).then((d) => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, [salonId]);

  const save = async () => {
    if (!editing?.name) return;
    await Professionals.upsert({
      id: editing.id,
      salon_id: salonId,
      name: editing.name,
      role_title: editing.role_title ?? null,
      phone: editing.phone ?? null,
      work_hours: editing.work_hours ?? DEFAULT_HOURS,
      is_active: editing.is_active ?? true,
    });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este profissional?')) return;
    await Professionals.remove(id);
    load();
  };

  if (loading) return <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto my-8" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800">Profissionais ({items.length})</p>
        <button onClick={() => setEditing({ work_hours: DEFAULT_HOURS })}
          className="flex items-center gap-1.5 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum profissional cadastrado.</p>
        </div>
      )}

      {items.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 flex items-center justify-center text-fuchsia-700 font-bold text-sm">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
            <p className="text-xs text-slate-500">{p.role_title || 'Profissional'}{p.is_active ? '' : ' · inativo'}</p>
          </div>
          <button onClick={() => setEditing(p)} className="p-2 text-slate-400 hover:text-fuchsia-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => remove(p.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}

      {editing && (
        <Modal title={editing.id ? 'Editar profissional' : 'Novo profissional'} onClose={() => setEditing(null)} onSave={save}>
          <Field label="Nome" value={editing.name ?? ''} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="Função (ex: Manicure)" value={editing.role_title ?? ''} onChange={(v) => setEditing({ ...editing, role_title: v })} />
          <Field label="WhatsApp" value={editing.phone ?? ''} onChange={(v) => setEditing({ ...editing, phone: v })} />
          <p className="text-[11px] text-slate-400">Horário padrão: Seg–Sex 09–18h, Sáb 09–13h. (Edição detalhada em breve.)</p>
        </Modal>
      )}
    </div>
  );
}
