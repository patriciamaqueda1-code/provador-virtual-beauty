import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, UserPlus, Star } from 'lucide-react';
import { Customers } from '../../lib/api';
import type { Customer } from '../../types';
import { Modal, Field } from './Servicos';

export default function Clientes({ salonId }: { salonId: string }) {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [q, setQ] = useState('');

  const load = () => Customers.list(salonId).then((d) => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, [salonId]);

  const save = async () => {
    if (!editing?.name || !editing?.phone) return;
    await Customers.upsert({
      id: editing.id,
      salon_id: salonId,
      name: editing.name,
      phone: editing.phone,
      email: editing.email ?? null,
      notes: editing.notes ?? null,
    });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    await Customers.remove(id);
    load();
  };

  const filtered = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  if (loading) return <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto my-8" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…"
          className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-400" />
        <button onClick={() => setEditing({})}
          className="flex items-center gap-1.5 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-2 rounded-lg whitespace-nowrap">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum cliente.</p>
        </div>
      )}

      {filtered.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{c.name}</p>
            <p className="text-xs text-slate-500">{c.phone}</p>
          </div>
          {c.loyalty_points > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="w-3 h-3" /> {c.loyalty_points}
            </span>
          )}
          <button onClick={() => setEditing(c)} className="p-2 text-slate-400 hover:text-fuchsia-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => remove(c.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}

      {editing && (
        <Modal title={editing.id ? 'Editar cliente' : 'Novo cliente'} onClose={() => setEditing(null)} onSave={save}>
          <Field label="Nome" value={editing.name ?? ''} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="WhatsApp" value={editing.phone ?? ''} onChange={(v) => setEditing({ ...editing, phone: v })} />
          <Field label="E-mail" value={editing.email ?? ''} onChange={(v) => setEditing({ ...editing, email: v })} />
          <Field label="Observações" value={editing.notes ?? ''} onChange={(v) => setEditing({ ...editing, notes: v })} />
        </Modal>
      )}
    </div>
  );
}
