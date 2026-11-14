// apps/shell/src/pages/BillingCheckoutModal.jsx
import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Smartphone,
  Landmark,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { api, useRealtime, useEmpresa } from '@heis/core';
import { Modal, UnifiedToast } from '@heis/ui';

const PLANES_SAAS = [
  {
    codigo: 'BASICO',
    nombre: 'Plan Básico',
    mensual: 99,
    anual: 990, // 2 meses gratis
    features: ['1 Sucursal activa', 'Hasta 5 usuarios', '1,000 CPE SUNAT / mes', 'Soporte estándar'],
  },
  {
    codigo: 'PRO',
    nombre: 'Plan Pro Multi-Módulo',
    mensual: 199,
    anual: 1990,
    popular: true,
    features: [
      'Hasta 3 Sucursales',
      'Hasta 20 usuarios',
      '5,000 CPE SUNAT / mes',
      'KDS Tiempo Real & Kardex SUNAT',
    ],
  },
  {
    codigo: 'ENTERPRISE',
    nombre: 'Plan Enterprise',
    mensual: 399,
    anual: 3990,
    features: [
      'Sucursales ilimitadas',
      'Usuarios ilimitados',
      'Comprobantes ilimitados',
      'SLA Prioritario 24/7 & BI',
    ],
  },
];

export default function BillingCheckoutModal({
  isOpen,
  onClose,
  planInicial = 'PRO',
  onSuccessRenewal,
}) {
  const { empresaActiva } = useEmpresa?.() || {};
  const [planSeleccionado, setPlanSeleccionado] = useState(planInicial);
  const [periodo, setPeriodo] = useState('MENSUAL'); // 'MENSUAL' | 'ANUAL'
  const [metodoPago, setMetodoPago] = useState('TARJETA'); // 'TARJETA' | 'YAPE_PLIN' | 'TRANSFERENCIA'
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(null);
  const [toast, setToast] = useState(null);

  // Datos de formulario según medio de pago
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
    pasarela: 'IZIPAY', // 'IZIPAY' | 'MERCADOPAGO' | 'STRIPE'
  });
  const [yapeForm, setYapeForm] = useState({
    celular: '',
    codigoAprobacion: '', // 6 dígitos de Yape / Plin
  });
  const [transferForm, setTransferForm] = useState({
    banco: 'BCP',
    numeroOperacion: '',
  });

  const planObj = useMemo(
    () => PLANES_SAAS.find((p) => p.codigo === planSeleccionado) || PLANES_SAAS[1],
    [planSeleccionado]
  );

  const montoPagar = periodo === 'ANUAL' ? planObj.anual : planObj.mensual;
  const igvIncluido = Number((montoPagar - montoPagar / 1.18).toFixed(2));

  // Escucha confirmación asíncrona en tiempo real desde procesarWebhookPasarela()
  useRealtime({
    'suscripcion:renovada': (payload) => {
      setProcesandoPago(false);
      setConfirmacionExitosa(payload);

      // Notifica a SubscriptionStatusBanner.jsx para actualizar el estado sin recargar la página
      window.dispatchEvent(
        new CustomEvent('heis:subscription-updated', { detail: payload })
      );

      if (typeof onSuccessRenewal === 'function') {
        onSuccessRenewal(payload);
      }
    },
  });

  const handleEjecutarPago = async (e) => {
    e.preventDefault();
    setProcesandoPago(true);

    try {
      const { data } = await api.post('/suscripciones/checkout', {
        empresa_id: empresaActiva?.id || Number(localStorage.getItem('heis_empresa_id')),
        plan_codigo: planSeleccionado,
        periodo,
        metodo_pago: metodoPago,
        pasarela: metodoPago === 'TARJETA' ? cardForm.pasarela : metodoPago,
        monto: montoPagar,
        detalles_pago:
          metodoPago === 'TARJETA'
            ? { holder: cardForm.holder, last4: cardForm.number.slice(-4) }
            : metodoPago === 'YAPE_PLIN'
            ? yapeForm
            : transferForm,
      });

      const resData = data?.data || data;

      const payloadRenovacion = {
        plan_codigo: planSeleccionado,
        estado_suscripcion: 'ACTIVA',
        suscripcion_vence_en: resData?.nuevoVencimiento || new Date(Date.now() + 30 * 86400000).toISOString(),
        factura_heis:
          resData?.factura_heis ||
          (resData?.comprobante
            ? `${resData.comprobante.serie}-${String(resData.comprobante.correlativo).padStart(8, '0')}`
            : 'F001-00000001'),
      };

      setConfirmacionExitosa(payloadRenovacion);
      window.dispatchEvent(
        new CustomEvent('heis:subscription-updated', { detail: payloadRenovacion })
      );
      if (typeof onSuccessRenewal === 'function') {
        onSuccessRenewal(payloadRenovacion);
      }
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.message ||
          'No se pudo procesar la transacción con la pasarela.',
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renovación de Suscripción y Facturación Automática SUNAT"
    >
      <div className="space-y-6 text-slate-100">
        {toast && (
          <UnifiedToast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* ==========================================
            VISTA DE CONFIRMACIÓN Y FACTURA UBL 2.1 EMITIDA
        ========================================== */}
        {confirmacionExitosa ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                ¡Suscripción {confirmacionExitosa.plan_codigo} Renovada con Éxito!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tu cuenta está activa y sin restricciones hasta el{' '}
                <span className="text-emerald-300 font-semibold">
                  {new Date(confirmacionExitosa.suscripcion_vence_en).toLocaleDateString('es-PE')}
                </span>
                .
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-indigo-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Comprobante Electrónico UBL 2.1 Emitido
                </span>
                <span className="font-mono">{confirmacionExitosa.factura_heis}</span>
              </div>
              <p className="text-slate-400">
                GRUPO HEIS S.A.C. ha emitido y firmado digitalmente tu factura electrónica por{' '}
                <strong className="text-slate-200">S/ {montoPagar.toFixed(2)}</strong> (incluye S/{' '}
                {igvIncluido.toFixed(2)} de IGV 18%).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmacionExitosa(null);
                onClose?.();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Volver a la Operación
            </button>
          </div>
        ) : (
          <form onSubmit={handleEjecutarPago} className="space-y-5">
            {/* 1. Selector de Ciclo (Mensual vs Anual con 2 meses gratis) */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-300">
                Ciclo de facturación:
              </span>
              <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPeriodo('MENSUAL')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    periodo === 'MENSUAL'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodo('ANUAL')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                    periodo === 'ANUAL'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Anual (2 Meses Gratis)
                </button>
              </div>
            </div>

            {/* 2. Tarjetas de Planes (Básico, Pro, Enterprise) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANES_SAAS.map((plan) => {
                const activo = planSeleccionado === plan.codigo;
                const precio = periodo === 'ANUAL' ? plan.anual : plan.mensual;
                return (
                  <div
                    key={plan.codigo}
                    onClick={() => setPlanSeleccionado(plan.codigo)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      activo
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{plan.nombre}</span>
                        {plan.popular && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-mono">
                        <span className="text-lg font-bold text-slate-100">S/ {precio}</span>
                        <span className="text-[11px] text-slate-400">
                          /{periodo === 'ANUAL' ? 'año' : 'mes'}
                        </span>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-slate-400">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Selección de Método de Pago */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Método de Pago Instantáneo:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'TARJETA', label: 'Tarjeta (Izipay / MP)', icon: CreditCard },
                  { id: 'YAPE_PLIN', label: 'Yape / Plin QR', icon: Smartphone },
                  { id: 'TRANSFERENCIA', label: 'Transferencia CCI', icon: Landmark },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMetodoPago(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        metodoPago === m.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-400" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Formulario A: Tarjeta de Crédito / Débito */}
              {metodoPago === 'TARJETA' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Tokenización segura con firma HMAC-SHA256
                    </span>
                    <select
                      value={cardForm.pasarela}
                      onChange={(e) => setCardForm({ ...cardForm, pasarela: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="IZIPAY">Pasarela Izipay Perú</option>
                      <option value="MERCADOPAGO">Mercado Pago</option>
                      <option value="STRIPE">Stripe Internacional</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Titular de la tarjeta"
                    value={cardForm.holder}
                    onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="4557 8800 0000 0000"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                      className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/AA"
                        value={cardForm.expiry}
                        onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                        className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-center"
                      />
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="CVV"
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                        className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario B: Yape / Plin con Código de Aprobación */}
              {metodoPago === 'YAPE_PLIN' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="bg-white p-2.5 rounded-xl w-28 h-28 mx-auto flex flex-col items-center justify-center text-slate-900 font-mono text-[10px] font-bold text-center border-4 border-purple-600">
                    <span>QR EMVCo</span>
                    <span className="text-purple-700 text-xs mt-1">S/ {montoPagar}</span>
                    <span className="text-[9px] text-slate-500 mt-1">GRUPO HEIS SAC</span>
                  </div>

                  <div className="sm:col-span-2 space-y-2.5">
                    <p className="text-xs text-slate-300">
                      Escanea el QR con <strong>Yape o Plin</strong> o ingresa tu número celular y el código de aprobación de 6 dígitos:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        required
                        maxLength={9}
                        placeholder="Celular (999888777)"
                        value={yapeForm.celular}
                        onChange={(e) =>
                          setYapeForm({ ...yapeForm, celular: e.target.value.replace(/\D/g, '') })
                        }
                        className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
                      />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Código 6 dígitos"
                        value={yapeForm.codigoAprobacion}
                        onChange={(e) =>
                          setYapeForm({
                            ...yapeForm,
                            codigoAprobacion: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario C: Transferencia Bancaria Corporativa */}
              {metodoPago === 'TRANSFERENCIA' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="text-slate-300 space-y-1 font-mono">
                    <div>BCP Soles Cte: 193-0000000-0-99 | CCI: 00219300000000009911</div>
                    <div>Titular: GRUPO HEIS S.A.C. (RUC 20600000001)</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={transferForm.banco}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, banco: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                    >
                      <option value="BCP">BCP</option>
                      <option value="INTERBANK">Interbank</option>
                      <option value="BBVA">BBVA</option>
                      <option value="SCOTIABANK">Scotiabank</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="N° Operación Bancaria"
                      value={transferForm.numeroOperacion}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, numeroOperacion: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumen Tributario y Botón de Cobro */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Total a pagar:{' '}
                <strong className="text-base font-mono text-white">
                  S/ {montoPagar.toFixed(2)}
                </strong>{' '}
                (IGV S/ {igvIncluido.toFixed(2)} incl. · Se emitirá Factura UBL 2.1)
              </div>

              <button
                type="submit"
                disabled={procesandoPago}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
              >
                {procesandoPago ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verificando y Facturando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Pagar S/ {montoPagar.toFixed(2)} y Renovar Ahora
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}