import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Plus, Wallet } from 'lucide-react';
import { Finance, brl, fmtDate } from '../../lib/api';
import type { FinancialTransaction } from '../../types';
import { Modal, Field } from './Servicos';

export default function Financeiro({ salonId }: { salonId: string }) {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<{ description: string; amount: string } | null>(null);

  const load = () => {
    const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0);
    return Finance.list(salonId, since.toISOString()).then((d) => { setItems(d); setLoading(false); });
  };
  useEffect(() => { load(); }, [salonId]);

  const income = items.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const addExpense = async () => {
    if (!adding?.description) return;
    await Finance.add({
      salon_id: salonId, type: 'expense', category: 'despesa',
      description: adding.description, amount: Number(adding.amount) || 0, status: 'paid',
    });
    setAdding(null);
    load();
  };

  if (loading) return <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto my-8" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} label="Entradas" value={brl(income)} box="bg-emerald-50 border-emerald-100" />
        <Stat icon={<TrendingDown className="w-4 h-4 text-red-500" />} label="Saídas" value={brl(expense)} box="bg-red-50 border-red-100" />
        <Stat icon={<Wallet className="w-4 h-4 text-slate-700" />} label="Saldo" value={brl(income - expense)} box="bg-slate-50 border-slate-200" />
      </div>

      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800 text-sm">Movimentações do mês</p>
        <button onClick={() => setAdding({ description: '', amount: '' })}
          className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Despesa
        </button>
      </div>

      {items.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Sem movimentações ainda.</p>}

      <div className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-800 truncate">{t.description || t.category}</p>
              <p className="text-[11px] text-slate-400">{fmtDate(t.occurred_at)}</p>
            </div>
            <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
              {t.type === 'income' ? '+' : '−'}{brl(Number(t.amount))}
            </span>
          </div>
        ))}
      </div>

      {adding && (
        <Modal title="Nova despesa" onClose={() => setAdding(null)} onSave={addExpense}>
          <Field label="Descrição" value={adding.description} onChange={(v) => setAdding({ ...adding, description: v })} />
          <Field label="Valor (R$)" type="number" value={adding.amount} onChange={(v) => setAdding({ ...adding, amount: v })} />
        </Modal>
      )}
    </div>
  );
}

function Stat({ icon, label, value, box }: { icon: React.ReactNode; label: string; value: string; box: string }) {
  return (
    <div className={`rounded-2xl p-3 border ${box}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] font-semibold text-slate-500">{label}</span></div>
      <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
