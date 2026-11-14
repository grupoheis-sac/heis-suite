// packages/ui/src/components/SubscriptionStatusBanner.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CreditCard, CheckCircle2 } from 'lucide-react';

export default function SubscriptionStatusBanner({
  empresa,
  user,
  initialPlan = 'PRO',
  initialStatus = 'TRIAL',
  initialDaysLeft = 14,
  onOpenCheckoutModal,
}) {
  const isSuperAdmin = user?.rol === 'superadmin' || user?.role === 'superadmin';

  // Calcular valores iniciales combinando props y objeto empresa si está disponible
  const calcInitial = () => {
    let plan = empresa?.plan_codigo || empresa?.plan || initialPlan;
    let status = empresa?.estado_suscripcion || initialStatus;
    let daysLeft = initialDaysLeft;

    if (empresa?.fecha_vencimiento || empresa?.suscripcion_vence_en) {
      const fechaStr = empresa.suscripcion_vence_en || empresa.fecha_vencimiento;
      const targetDate = new Date(fechaStr);
      if (!isNaN(targetDate.getTime())) {
        const hoy = new Date();
        const diffMs = targetDate.getTime() - hoy.getTime();
        daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    return {
      plan,
      status,
      daysLeft,
      lastInvoice: null,
    };
  };

  const [subState, setSubState] = useState(calcInitial);

  useEffect(() => {
    setSubState((prev) => {
      const init = calcInitial();
      return {
        ...prev,
        plan: init.plan,
        status: prev.lastInvoice ? prev.status : init.status,
        daysLeft: prev.lastInvoice ? prev.daysLeft : init.daysLeft,
      };
    });
  }, [empresa?.fecha_vencimiento, empresa?.suscripcion_vence_en, empresa?.estado_suscripcion, empresa?.plan_codigo]);

  useEffect(() => {
    const handleSubUpdated = (e) => {
      if (!e.detail) return;
      const vence = new Date(e.detail.suscripcion_vence_en || Date.now() + 30 * 86400000);
      const dias = Math.max(1, Math.ceil((vence.getTime() - Date.now()) / 86400000));
      setSubState({
        plan: e.detail.plan_codigo || 'PRO',
        status: e.detail.estado_suscripcion || 'ACTIVA',
        daysLeft: dias,
        lastInvoice: e.detail.factura_heis || null,
      });
    };

    window.addEventListener('heis:subscription-updated', handleSubUpdated);
    return () => window.removeEventListener('heis:subscription-updated', handleSubUpdated);
  }, []);

  // SuperAdmin sin empresa no ve banner
  if (isSuperAdmin && !empresa) {
    return null;
  }

  // Si la suscripción está ACTIVA y tiene más de 7 días restantes, solo muestra confirmación breve si acaba de pagar
  if (subState.status === 'ACTIVA' && subState.daysLeft > 7 && !subState.lastInvoice) {
    return null;
  }

  const esVencido = subState.daysLeft <= 0 || subState.status === 'SUSPENDIDA' || subState.status === 'PAST_DUE';
  const esRecienRenovado = subState.status === 'ACTIVA' && Boolean(subState.lastInvoice);

  const handleOpenModal = () => {
    if (typeof onOpenCheckoutModal === 'function') {
      onOpenCheckoutModal();
    } else {
      window.dispatchEvent(new CustomEvent('heis:open-checkout'));
    }
  };

  return (
    <div
      className={`px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b transition-all ${
        esRecienRenovado
          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
          : esVencido
          ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {esRecienRenovado ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : esVencido ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        )}

        <span>
          {esRecienRenovado ? (
            <>
              Suscripción <strong>Plan {subState.plan} ACTIVA</strong> ({subState.daysLeft} días). Factura SUNAT emitida:{' '}
              <strong className="font-mono">{subState.lastInvoice}</strong>
            </>
          ) : esVencido ? (
            <>
              Tu periodo de prueba o suscripción del <strong>Plan {subState.plan}</strong> ha vencido. Activa tu plan para habilitar ventas y emisión SUNAT.
            </>
          ) : (
            <>
              Estás en modo <strong>{subState.status}</strong> del{' '}
              <strong>Plan {subState.plan}</strong>: te quedan{' '}
              <strong>{subState.daysLeft} días</strong> disponibles.
            </>
          )}
        </span>
      </div>

      {!esRecienRenovado && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          {esVencido ? 'Reactivar Ahora' : 'Mejorar / Renovar Plan'}
        </button>
      )}
    </div>
  );
}
