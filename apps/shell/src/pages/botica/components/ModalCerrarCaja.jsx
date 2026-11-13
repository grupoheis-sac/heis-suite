import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  X,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Eye,
  EyeOff,
  Calculator,
  Banknote,
  Coins,
  ShieldCheck,
  Receipt,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  DollarSign
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

// Denominaciones oficiales del Sol Peruano
const DENOMINACIONES_BILLETES = [
  { valor: 200, label: 'S/ 200' },
  { valor: 100, label: 'S/ 100' },
  { valor: 50, label: 'S/ 50' },
  { valor: 20, label: 'S/ 20' },
  { valor: 10, label: 'S/ 10' }
];

const DENOMINACIONES_MONEDAS = [
  { valor: 5, label: 'S/ 5.00' },
  { valor: 2, label: 'S/ 2.00' },
  { valor: 1, label: 'S/ 1.00' },
  { valor: 0.50, label: 'S/ 0.50' },
  { valor: 0.20, label: 'S/ 0.20' },
  { valor: 0.10, label: 'S/ 0.10' }
];

// Chips de justificación rápida para descuadres
const MOTIVOS_DESCUADRE = [
  'Diferencia por redondeo acumulado en ventas',
  'Error de vuelto en mostrador de atención',
  'Billete o moneda deteriorada/falsa retenida',
  'Gasto menor de urgencia de botica no registrado',
  'Voucher de tarjeta pendiente de conciliación',
  'Sencillo adicional aportado no reportado a tiempo'
];

export default function ModalCerrarCaja({
  isOpen,
  onClose,
  caja,
  resumen,
  onSuccess,
  onNavigateCajas
}) {
  // Pestaña activa: 'directo' o 'calculadora'
  const [tabActiva, setTabActiva] = useState('directo');

  // Modo Arqueo Ciego (Oculta el saldo esperado hasta revelar)
  const [modoCiego, setModoCiego] = useState(false);
  const [saldoRevelado, setSaldoRevelado] = useState(false);

  // Monto contado y notas
  const [montoCierre, setMontoCierre] = useState('');
  const [notaCierre, setNotaCierre] = useState('');
  const [receptorTurno, setReceptorTurno] = useState('');

  // Fondo que se retiene en cajón para el siguiente turno (Base de sencillo)
  const [dejarFondoSiguiente, setDejarFondoSiguiente] = useState(false);
  const [montoFondoSiguiente, setMontoFondoSiguiente] = useState('');

  // Checklist de cierre operativo farmacéutico
  const [checkPos, setCheckPos] = useState(false);
  const [checkComprobantes, setCheckComprobantes] = useState(false);
  const [checkRecetas, setCheckRecetas] = useState(false);

  // Conteo de billetes y monedas (Calculadora)
  const [conteoBilletes, setConteoBilletes] = useState({});
  const [conteoMonedas, setConteoMonedas] = useState({});
  const [desgloseTexto, setDesgloseTexto] = useState('');

  const [enviando, setEnviando] = useState(false);

  // Valores financieros del turno
  const saldoEsperado = parseFloat(resumen?.saldo_esperado_efectivo ?? 0);
  const montoInicial = parseFloat(resumen?.monto_inicial ?? caja?.monto_inicial ?? 0);
  const ventasEfectivo = parseFloat(resumen?.ventas_efectivo ?? 0);
  const ventasDigitales = parseFloat(resumen?.ventas_digitales ?? 0);
  const ingresosExtra = parseFloat(resumen?.ingresos_extra ?? 0);
  const egresos = parseFloat(resumen?.egresos ?? 0);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setTabActiva('directo');
      setModoCiego(false);
      setSaldoRevelado(false);
      setMontoCierre('');
      setNotaCierre('');
      setReceptorTurno('');
      setDejarFondoSiguiente(false);
      setMontoFondoSiguiente(montoInicial > 0 ? montoInicial.toFixed(2) : '100.00');
      setCheckPos(false);
      setCheckComprobantes(false);
      setCheckRecetas(false);
      setConteoBilletes({});
      setConteoMonedas({});
      setDesgloseTexto('');
      setEnviando(false);
    }
  }, [isOpen, montoInicial]);

  // Cálculos de la calculadora de denominaciones
  const subtotalBilletes = useMemo(() => {
    return DENOMINACIONES_BILLETES.reduce((acc, curr) => {
      const cant = parseInt(conteoBilletes[curr.valor] || 0, 10);
      return acc + (isNaN(cant) ? 0 : cant * curr.valor);
    }, 0);
  }, [conteoBilletes]);

  const subtotalMonedas = useMemo(() => {
    return DENOMINACIONES_MONEDAS.reduce((acc, curr) => {
      const cant = parseInt(conteoMonedas[curr.valor] || 0, 10);
      return acc + (isNaN(cant) ? 0 : cant * curr.valor);
    }, 0);
  }, [conteoMonedas]);

  const totalCalculadora = useMemo(() => {
    return parseFloat((subtotalBilletes + subtotalMonedas).toFixed(2));
  }, [subtotalBilletes, subtotalMonedas]);

  if (!isOpen || !caja) return null;

  const montoContadoNum = parseFloat(montoCierre);
  const tieneMontoValido = !isNaN(montoContadoNum) && montoContadoNum >= 0 && montoCierre.trim() !== '';
  const diferencia = tieneMontoValido ? parseFloat((montoContadoNum - saldoEsperado).toFixed(2)) : null;

  // Cálculo de fondo retenido vs sobre a entregar
  const fondoRetenidoNum = dejarFondoSiguiente && !isNaN(parseFloat(montoFondoSiguiente))
    ? Math.min(montoContadoNum || 0, Math.max(0, parseFloat(montoFondoSiguiente)))
    : 0;
  const sobreEntregarNum = tieneMontoValido ? Math.max(0, montoContadoNum - fondoRetenidoNum) : 0;

  // Manejo de cambio en calculadora de billetes/monedas
  const handleCambioConteo = (tipo, valor, cantidadStr) => {
    const cantLimpia = cantidadStr.replace(/[^0-9]/g, '');
    if (tipo === 'billete') {
      setConteoBilletes((prev) => ({ ...prev, [valor]: cantLimpia }));
    } else {
      setConteoMonedas((prev) => ({ ...prev, [valor]: cantLimpia }));
    }
  };

  // Transferir conteo de calculadora al monto de cierre
  const handleAplicarCalculadora = () => {
    if (totalCalculadora <= 0) {
      toast.error('Ingrese al menos un billete o moneda contada.');
      return;
    }

    setMontoCierre(totalCalculadora.toFixed(2));

    // Generar resumen legible del desglose para auditoría
    const detalles = [];
    DENOMINACIONES_BILLETES.forEach((b) => {
      const cant = parseInt(conteoBilletes[b.valor] || 0, 10);
      if (cant > 0) detalles.push(`${cant}x${b.label}`);
    });
    DENOMINACIONES_MONEDAS.forEach((m) => {
      const cant = parseInt(conteoMonedas[m.valor] || 0, 10);
      if (cant > 0) detalles.push(`${cant}x${m.label}`);
    });

    const texto = `Desglose Físico: ${detalles.join(', ')} (Billetes: S/ ${subtotalBilletes.toFixed(2)} | Monedas: S/ ${subtotalMonedas.toFixed(2)})`;
    setDesgloseTexto(texto);

    setTabActiva('directo');
    toast.success(`Monto S/ ${totalCalculadora.toFixed(2)} transferido al arqueo.`);
  };

  // Limpiar calculadora
  const handleLimpiarCalculadora = () => {
    setConteoBilletes({});
    setConteoMonedas({});
    setDesgloseTexto('');
  };

  // Enviar cierre
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tieneMontoValido) {
      toast.error('Ingrese el monto físico contado en el cajón.');
      return;
    }

    // Armar composite notes con todos los metadatos de auditoría
    const notasPartes = [];

    if (receptorTurno.trim()) {
      notasPartes.push(`Entregado a: ${receptorTurno.trim()}`);
    }

    if (dejarFondoSiguiente && fondoRetenidoNum > 0) {
      notasPartes.push(
        `Fondo Base para Siguiente Turno: S/ ${fondoRetenidoNum.toFixed(2)} | Retiro/Sobre a Gerencia: S/ ${sobreEntregarNum.toFixed(2)}`
      );
    }

    if (desgloseTexto) {
      notasPartes.push(desgloseTexto);
    }

    if (checkPos || checkComprobantes || checkRecetas) {
      const checks = [];
      if (checkPos) checks.push('POS Cerrado');
      if (checkComprobantes) checks.push('Comprobantes Grapados');
      if (checkRecetas) checks.push('Recetas Archivadas');
      notasPartes.push(`Checklist BPA: [${checks.join(', ')}]`);
    }

    if (notaCierre.trim()) {
      notasPartes.push(notaCierre.trim());
    }

    const observacionesFinales = notasPartes.join(' • ');

    setEnviando(true);
    try {
      const res = await api.post(`/caja/${caja.id}/cerrar`, {
        monto_final_real: montoContadoNum,
        observaciones: observacionesFinales
      });

      const data = res?.data || res;
      if (data?.success || res?.success) {
        const info = data?.caja || res?.caja || {};
        toast.success('¡Turno de caja cerrado exitosamente!');
        sessionStorage.setItem('botica_caja_abierta', 'false');
        window.dispatchEvent(
          new CustomEvent('caja-status-changed', { detail: { open: false } })
        );
        onClose();
        if (onSuccess) {
          onSuccess(info);
        }
      } else {
        toast.error(data?.message || 'Error al cerrar caja.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err?.message ||
          'Error al procesar el cierre de caja'
      );
    } finally {
      setEnviando(false);
    }
  };

  const ocultarSaldoSistema = modoCiego && !saldoRevelado;

  const modalJSX = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer font-sora"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto text-slate-800 cursor-default font-sora"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Cerrar Turno y Arqueo de Caja
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Turno #{caja.id}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                Cuadre de efectivo físico, conteo de billetes y relevo de turno farmacéutico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Modo Arqueo Ciego */}
            <button
              type="button"
              onClick={() => {
                const nuevo = !modoCiego;
                setModoCiego(nuevo);
                setSaldoRevelado(false);
                if (nuevo) {
                  toast('Modo Arqueo Ciego activado: el saldo del sistema está oculto.', {
                    icon: '🔒',
                    duration: 3000
                  });
                } else {
                  toast('Modo normal activado.', { icon: '👁️', duration: 2000 });
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                modoCiego
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="El arqueo ciego evita sesgos al contar el dinero físico sin ver primero el monto esperado del sistema"
            >
              {modoCiego ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{modoCiego ? 'Arqueo Ciego' : 'Normal'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen Financiero del Turno */}
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Efectivo esperado en cajón:</span>
            </span>

            {ocultarSaldoSistema ? (
              <div className="flex items-center gap-2">
                <span className="text-base font-black font-mono text-slate-400 tracking-wider">
                  S/ ••••••
                </span>
                <button
                  type="button"
                  onClick={() => setSaldoRevelado(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold border border-amber-300 transition-colors cursor-pointer"
                >
                  Revelar
                </button>
              </div>
            ) : (
              <span className="text-lg font-black font-mono text-emerald-700">
                S/ {saldoEsperado.toFixed(2)}
              </span>
            )}
          </div>

          {!ocultarSaldoSistema && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Monto Inicial
                </span>
                <span className="font-mono font-bold text-slate-700">
                  S/ {montoInicial.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Ventas Efectivo
                </span>
                <span className="font-mono font-bold text-slate-700">
                  S/ {ventasEfectivo.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Ventas Digitales
                </span>
                <span className="font-mono font-bold text-teal-700">
                  S/ {ventasDigitales.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Caja Chica Extra
                </span>
                <span className="font-mono font-bold text-slate-700">
                  +{ingresosExtra.toFixed(2)} / -{egresos.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Botón rápido para rellenar con cuadre exacto (Solo disponible si no está en modo ciego estricto) */}
          {!ocultarSaldoSistema && (
            <button
              type="button"
              onClick={() => {
                setMontoCierre(saldoEsperado.toFixed(2));
                toast.success('Monto exacto del sistema aplicado.');
              }}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Usar Cuadre Exacto del Sistema (S/ {saldoEsperado.toFixed(2)})</span>
            </button>
          )}
        </div>

        {/* Selector de Pestañas: Entrada Directa vs Calculadora de Billetes y Monedas */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setTabActiva('directo')}
            className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabActiva === 'directo'
                ? 'bg-white text-slate-800 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Entrada Directa</span>
            {tieneMontoValido && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9.5px] font-mono">
                S/ {montoContadoNum.toFixed(2)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('calculadora')}
            className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabActiva === 'calculadora'
                ? 'bg-white text-slate-800 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4 text-teal-600" />
            <span>Calculadora de Billetes & Monedas</span>
            {totalCalculadora > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[9.5px] font-mono font-bold">
                S/ {totalCalculadora.toFixed(2)}
              </span>
            )}
          </button>
        </div>

        {/* ─── VISTA 1: ENTRADA DIRECTA ─── */}
        {tabActiva === 'directo' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Efectivo Físico Contado en Cajón (S/) *
                </label>
                {desgloseTexto && (
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                    Calculado por denominaciones
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  autoFocus
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-base font-black font-mono text-slate-900 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
                />
              </div>

              {/* Botón rápido para abrir calculadora si prefiere desglosar */}
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>¿Deseas contar billete por billete?</span>
                <button
                  type="button"
                  onClick={() => setTabActiva('calculadora')}
                  className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Coins className="w-3 h-3" />
                  <span>Abrir desglose de denominaciones</span>
                </button>
              </div>

              {/* Cálculo de diferencia en vivo */}
              {tieneMontoValido && !ocultarSaldoSistema && diferencia !== null && (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-100 ${
                    diferencia === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : diferencia > 0
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {diferencia === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : diferencia > 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {diferencia === 0
                        ? 'Cuadre Perfecto (Sin diferencias)'
                        : diferencia > 0
                        ? 'Sobrante en Caja (Efectivo de más)'
                        : 'Faltante en Caja (Descuadre negativo)'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {diferencia === 0
                      ? 'S/ 0.00'
                      : `${diferencia > 0 ? '+' : ''}S/ ${diferencia.toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Chips Rápidos de Justificación si hay Descuadre */}
            {tieneMontoValido && !ocultarSaldoSistema && diferencia !== 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5 animate-in fade-in">
                <span className="text-[10.5px] font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Justificación rápida de descuadre (1-Toque):</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {MOTIVOS_DESCUADRE.map((motivo) => (
                    <button
                      key={motivo}
                      type="button"
                      onClick={() => {
                        setNotaCierre((prev) =>
                          prev ? `${prev} • ${motivo}` : motivo
                        );
                        toast.success('Motivo agregado a notas.');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer text-left"
                    >
                      + {motivo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sección: Fondo para Siguiente Turno (Base de Caja) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dejarFondoSiguiente}
                    onChange={(e) => setDejarFondoSiguiente(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Retener fondo de sencillo para el siguiente turno (Base de caja)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {dejarFondoSiguiente ? 'Activo' : 'Opcional'}
                </span>
              </label>

              {dejarFondoSiguiente && (
                <div className="pt-2 border-t border-slate-200/70 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                      Monto a dejar en cajón:
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montoFondoSiguiente}
                        onChange={(e) => setMontoFondoSiguiente(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none focus:border-teal-500"
                        placeholder="100.00"
                      />
                    </div>
                  </div>

                  {/* Chips rápidos de fondo */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-semibold">Sugerencias:</span>
                    {[50, 100, 150, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMontoFondoSiguiente(val.toFixed(2))}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>

                  {tieneMontoValido && (
                    <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px]">
                      <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                        <span className="text-teal-700 block text-[9.5px] uppercase font-bold">
                          Se queda en cajón
                        </span>
                        <span className="font-mono font-black text-teal-900 text-xs">
                          S/ {fondoRetenidoNum.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                        <span className="text-blue-700 block text-[9.5px] uppercase font-bold">
                          Efectivo en sobre / banco
                        </span>
                        <span className="font-mono font-black text-blue-900 text-xs">
                          S/ {sobreEntregarNum.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Receptor del Turno & Notas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Turno entregado a (Opcional):
                </label>
                <input
                  type="text"
                  value={receptorTurno}
                  onChange={(e) => setReceptorTurno(e.target.value)}
                  placeholder="Ej. Vanessa (Turno Tarde)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Observaciones / Notas de Cierre:
                </label>
                <input
                  type="text"
                  value={notaCierre}
                  onChange={(e) => setNotaCierre(e.target.value)}
                  placeholder="Detalles adicionales del arqueo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Checklist Operativo de Cierre Farmacéutico */}
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                Checklist Operativo de Cierre de Botica (BPA):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10.5px]">
                <label className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checkPos}
                    onChange={(e) => setCheckPos(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-teal-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-semibold truncate">
                    Lote POS Cerrado
                  </span>
                </label>
                <label className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checkComprobantes}
                    onChange={(e) => setCheckComprobantes(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-teal-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-semibold truncate">
                    Tickets Grapados
                  </span>
                </label>
                <label className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checkRecetas}
                    onChange={(e) => setCheckRecetas(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-teal-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-semibold truncate">
                    Recetas Archivadas
                  </span>
                </label>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || !tieneMontoValido}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{enviando ? 'Cerrando Turno...' : 'Confirmar Cierre de Caja'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ─── VISTA 2: CALCULADORA DE BILLETES Y MONEDAS ─── */}
        {tabActiva === 'calculadora' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Columna Billetes */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="font-black text-slate-800 flex items-center gap-1">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Billetes Peruanos</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    S/ {subtotalBilletes.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {DENOMINACIONES_BILLETES.map((b) => {
                    const cant = parseInt(conteoBilletes[b.valor] || 0, 10);
                    const sub = (isNaN(cant) ? 0 : cant) * b.valor;
                    return (
                      <div key={b.valor} className="flex items-center gap-2">
                        <span className="w-16 font-mono font-bold text-slate-700 text-right text-[11.5px]">
                          {b.label}
                        </span>
                        <span className="text-slate-400 text-xs">×</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={conteoBilletes[b.valor] || ''}
                          onChange={(e) =>
                            handleCambioConteo('billete', b.valor, e.target.value)
                          }
                          placeholder="0"
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-xs text-slate-800 outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-400 text-xs">=</span>
                        <span className="flex-1 font-mono font-black text-slate-800 text-right text-[11.5px]">
                          S/ {sub.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Monedas */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="font-black text-slate-800 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-teal-600" />
                    <span>Monedas en Cajón</span>
                  </span>
                  <span className="font-mono font-bold text-teal-700 text-xs">
                    S/ {subtotalMonedas.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {DENOMINACIONES_MONEDAS.map((m) => {
                    const cant = parseInt(conteoMonedas[m.valor] || 0, 10);
                    const sub = (isNaN(cant) ? 0 : cant) * m.valor;
                    return (
                      <div key={m.valor} className="flex items-center gap-2">
                        <span className="w-16 font-mono font-bold text-slate-700 text-right text-[11.5px]">
                          {m.label}
                        </span>
                        <span className="text-slate-400 text-xs">×</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={conteoMonedas[m.valor] || ''}
                          onChange={(e) =>
                            handleCambioConteo('moneda', m.valor, e.target.value)
                          }
                          placeholder="0"
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-xs text-slate-800 outline-none focus:border-teal-500"
                        />
                        <span className="text-slate-400 text-xs">=</span>
                        <span className="flex-1 font-mono font-black text-slate-800 text-right text-[11.5px]">
                          S/ {sub.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Barra de Totales de la Calculadora */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total Físico Contado (Billetes + Monedas)
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  Billetes: S/ {subtotalBilletes.toFixed(2)} • Monedas: S/ {subtotalMonedas.toFixed(2)}
                </span>
              </div>
              <span className="text-xl font-black font-mono text-teal-900">
                S/ {totalCalculadora.toFixed(2)}
              </span>
            </div>

            {/* Botones de la Calculadora */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLimpiarCalculadora}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>

              <button
                type="button"
                onClick={handleAplicarCalculadora}
                disabled={totalCalculadora <= 0}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Transferir al Arqueo Físico (S/ {totalCalculadora.toFixed(2)})</span>
              </button>
            </div>
          </div>
        )}

        {/* Acceso a Cajas Completo */}
        {onNavigateCajas && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateCajas();
              }}
              className="text-[11.5px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver historial y reportes en Gestión de Cajas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
