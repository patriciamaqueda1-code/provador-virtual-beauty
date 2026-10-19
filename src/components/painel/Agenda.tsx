import { useEffect, useState } from 'react';
import { Loader2, CalendarDays, LogIn, LogOut, X, Check } from 'lucide-react';
import { Appointments, brl, fmtTime, fmtDate } from '../../lib/api';
import type { Appointment, AppointmentStatus } from '../../types';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', checked_in: 'Em atendimento',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Faltou',
};
const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'bg-slate-100 text-slate-600', confirmed: 'bg-blue-50 text-blue-700',
  checked_in: 'bg-amber-50 text-amber-700', completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600', no_show: 'bg-red-50 text-red-600',
};

export default function Agenda({ salonId }: { salonId: string }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    const since = new Date(); since.setHours(0, 0, 0, 0);
    return Appointments.listBySalon(salonId, since.toISOString()).then((d) => {
      setItems(d.filter((a) => a.status !== 'cancelled'));
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [salonId]);

  const act = async (fn: Promise<unknown>, id: string) => {
    setBusy(id);
    const { error } = (await fn) as { error?: { message: string } };
    if (error) alert(error.message);
    setBusy(null);
    load();
  };

  const checkIn = (a: Appointment) => act(Appointments.checkIn(a.id), a.id);
  const checkOut = (a: Appointment) => {
    const v = prompt('Valor cobrado (R$):', String(a.price || 0));
    if (v === null) return;
    act(Appointments.checkOut(a.id, Number(v) || a.price), a.id);
  };
  const cancel = (a: Appointment) => {
    if (!confirm('Cancelar este agendamento?')) return;
    act(Appointments.cancel(a.id), a.id);
  };

  if (loading) return <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto my-8" />;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nenhum agendamento futuro.</p>
        <p className="text-xs text-slate-400">Eles aparecem aqui quando um cliente marca pelo seu link.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((a) => (
        <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{a.customer?.name ?? 'Cliente'}</p>
              <p className="text-xs text-slate-500">{a.service?.name ?? 'Serviço'} · {a.professional?.name ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtDate(a.scheduled_at)} às {fmtTime(a.scheduled_at)} · {brl(a.price)}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLE[a.status]}`}>
              {STATUS_LABEL[a.status]}
            </span>
          </div>

          {a.status !== 'completed' && (
            <div className="flex gap-2 mt-3">
              {(a.status === 'confirmed' || a.status === 'pending') && (
                <button disabled={busy === a.id} onClick={() => checkIn(a)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white py-2 rounded-lg disabled:opacity-50">
                  <LogIn className="w-4 h-4" /> Check-in
                </button>
              )}
              {a.status === 'checked_in' && (
                <button disabled={busy === a.id} onClick={() => checkOut(a)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg disabled:opacity-50">
                  <LogOut className="w-4 h-4" /> Check-out
                </button>
              )}
              <button disabled={busy === a.id} onClick={() => cancel(a)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg disabled:opacity-50">
                {busy === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          )}
          {a.status === 'completed' && (
            <p className="flex items-center gap-1 text-xs text-emerald-600 mt-2"><Check className="w-3.5 h-3.5" /> Finalizado</p>
          )}
        </div>
      ))}
    </div>
  );
}
