import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, X } from 'lucide-react';

export default function SubscriptionStatusBanner({ empresa, user }) {
  const [dismissed, setDismissed] = useState(false);
  const [estadoInfo, setEstadoInfo] = useState(null);

  useEffect(() => {
    if (!empresa || !empresa.fecha_vencimiento || user?.rol === 'superadmin') {
      setEstadoInfo(null);
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = String(empresa.fecha_vencimiento).split('-').map(Number);
    const fechaVenc = new Date(y, (m || 1) - 1, d || 1);
    fechaVenc.setHours(0, 0, 0, 0);

    const diasRestantes = Math.round((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes >= 0 && diasRestantes <= 5) {
      setEstadoInfo({
        tipo: 'POR_VENCER',
        dias: diasRestantes,
        fecha: empresa.fecha_vencimiento,
      });
    } else if (diasRestantes < 0 && Math.abs(diasRestantes) <= 3) {
      const diasGracia = Math.max(0, 3 - Math.abs(diasRestantes));
      setEstadoInfo({
        tipo: 'EN_GRACIA',
        diasGracia,
        fecha: empresa.fecha_vencimiento,
      });
    } else {
      setEstadoInfo(null);
    }
  }, [empresa, user?.rol]);

  if (!estadoInfo || dismissed) return null;

  const esGracia = estadoInfo.tipo === 'EN_GRACIA';

  return (
    <div
      className={`mx-3 mt-2 px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
        esGracia
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-200'
          : 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {esGracia ? (
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
        )}
        <p className="font-semibold truncate">
          {esGracia ? (
            <>
              <strong className="font-black uppercase">Período de Gracia Activo:</strong> Su membresía HEIS Suite venció el{' '}
              <span className="font-mono font-bold">{estadoInfo.fecha}</span>. Restan{' '}
              <span className="font-black underline">{estadoInfo.diasGracia} día(s)</span> antes de la suspensión automática del servicio.
            </>
          ) : (
            <>
              <strong className="font-black uppercase">Aviso de Renovación:</strong> Su suscripción empresarial vence{' '}
              {estadoInfo.dias === 0 ? 'el día de hoy' : `en ${estadoInfo.dias} día(s)`} ({estadoInfo.fecha}).
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('heis:open-soporte'))}
          className={`px-3 py-1 rounded-xl font-black text-[11px] cursor-pointer transition-all ${
            esGracia
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
          }`}
        >
          Renovar Ahora
        </button>
        {!esGracia && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
            title="Ocultar aviso por hoy"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
