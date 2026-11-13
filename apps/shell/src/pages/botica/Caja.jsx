import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from './api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  AlertCircle,
  PlusCircle,
  Smartphone,
  Banknote,
  Clock,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Printer,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from './utils/impresionTermica';
import ModalCierreCajaExito from './components/ModalCierreCajaExito';
import ModalCerrarCaja from './components/ModalCerrarCaja';

const MOTIVOS_FRECUENTES_EGRESO = [
  'Compra de rollos térmicos / bolsas',
  'Pago de delivery / envíos',
  'Artículos de limpieza y aseo',
  'Refrigerio / almuerzo de turno',
  'Compra menor a botica colega',
  'Retiro a caja fuerte / banco',
  'Pago de servicios (luz/agua/net)'
];

const MOTIVOS_FRECUENTES_INGRESO = [
  'Ingreso de sencillo / cambio monedas',
  'Aporte extraordinario de caja',
  'Devolución de cambio por compra menor',
  'Cobro por servicio fotocopia/recarga'
];

export default function Caja() {
  const settings = useSettingsStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dataCaja, setDataCaja] = useState({
    cajaAbierta: false,
    caja: null,
    resumen: null
  });
  const [loading, setLoading] = useState(true);
  const [ultimoCierre, setUltimoCierre] = useState(null);

  // Modales
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierreExitoso, setModalCierreExitoso] = useState(false);
  const [cierreResultData, setCierreResultData] = useState(null);

  // Forms
  const [montoApertura, setMontoApertura] = useState('0.00');
  const [movimiento, setMovimiento] = useState({
    tipo: 'Egreso',
    monto: '',
    concepto: ''
  });
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
  const [imprimirAlGuardar, setImprimirAlGuardar] = useState(true);

  const cargarCaja = async () => {
    try {
      setLoading(true);
      const res = await api.get('/caja/actual');
      const data = res?.data || res;
      if (data?.success) {
        setDataCaja(data);
      }
    } catch (err) {
      console.error('Error al cargar caja:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarUltimoCierre = async () => {
    try {
      const res = await api.get('/caja/ultimo-cierre');
      const info = res?.caja || res?.data?.caja;
      if (info) {
        setUltimoCierre(info);
      }
    } catch (err) {
      console.warn('Error al cargar último cierre:', err);
    }
  };

  useEffect(() => {
    cargarCaja();
    cargarUltimoCierre();
    const handleCajaChanged = () => {
      cargarCaja();
      cargarUltimoCierre();
    };
    window.addEventListener('caja-status-changed', handleCajaChanged);
    return () => window.removeEventListener('caja-status-changed', handleCajaChanged);
  }, []);

  // Apertura o cierre automático según URL (ej. ?tab=caja&accion=cerrar)
  useEffect(() => {
    const accion = searchParams.get('accion');
    if (accion === 'cerrar' && dataCaja?.cajaAbierta) {
      setModalCerrar(true);
    } else if (accion === 'abrir' && !dataCaja?.cajaAbierta && !loading) {
      setModalAbrir(true);
    }
  }, [searchParams, dataCaja?.cajaAbierta, loading]);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoApertura === '' ? 0 : montoApertura);
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingrese un monto inicial válido (mínimo S/ 0.00)');
      return;
    }

    try {
      const res = await api.post('/caja/abrir', {
        monto_inicial: monto
      });
      if (res?.success || res?.data?.success) {
        toast.success('Caja chica de botica abierta exitosamente');
        setModalAbrir(false);
        setMontoApertura('0.00');
        await cargarCaja();
        window.dispatchEvent(new CustomEvent('caja-status-changed', { detail: { open: true } }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err?.message || 'Error al abrir caja');
    }
  };

  const imprimirVoucherMovimiento = (mov, cajaTurno, usuarioNombre) => {
    if (!mov || !mov.monto || parseFloat(mov.monto) <= 0) {
      toast.error('Ingrese un monto válido para generar el comprobante');
      return;
    }
    const ventana = window.open('', '_blank', 'width=420,height=600');
    if (!ventana) {
      toast.error('Permite las ventanas emergentes para imprimir el comprobante térmico');
      return;
    }
    const fecha = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const esEgreso = mov.tipo === 'Egreso';
    const monto = parseFloat(mov.monto || 0).toFixed(2);
    const cajero = usuarioNombre || cajaTurno?.usuario?.nombre || 'Cajero Responsable';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Voucher de ${mov.tipo} - Caja #${cajaTurno?.id || ''}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace; width: 72mm; margin: 0 auto; padding: 12px; color: #000; font-size: 11px; text-align: center; }
          .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 13px; font-weight: 900; margin: 0; letter-spacing: 0.5px; }
          .subtitle { font-size: 11px; font-weight: 800; margin: 3px 0 0; color: ${esEgreso ? '#991b1b' : '#065f46'}; }
          .data-box { text-align: left; margin-bottom: 10px; font-size: 11px; line-height: 1.5; }
          .amount-box { border: 2px solid #000; border-radius: 6px; padding: 10px; margin: 12px 0; background: #fff; }
          .amount-val { font-size: 24px; font-weight: 900; margin: 4px 0; font-family: monospace; }
          .firmas { margin-top: 36px; display: flex; justify-content: space-between; font-size: 10px; }
          .firma-col { width: 46%; border-top: 1px dashed #000; padding-top: 6px; text-align: center; line-height: 1.3; }
          .footer { font-size: 9px; border-top: 1px dashed #000; padding-top: 8px; margin-top: 18px; color: #555; line-height: 1.3; }
          @media print {
            body { width: 100%; margin: 0; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">BOTICA FARMACÉUTICA</p>
          <p class="subtitle">COMPROBANTE DE ${esEgreso ? 'EGRESO / SALIDA DE CAJA' : 'INGRESO EXTRAORDINARIO'}</p>
          <p style="font-size: 9.5px; margin: 2px 0 0; color: #555;">Emisión: ${fecha}</p>
        </div>

        <div class="data-box">
          <div><strong>Turno Caja:</strong> #${cajaTurno?.id || '—'}</div>
          <div><strong>Cajero:</strong> ${cajero}</div>
          <div><strong>Operación:</strong> ${mov.tipo}</div>
          <div><strong>Motivo:</strong> ${mov.concepto || 'Sin descripción'}</div>
        </div>

        <div class="amount-box">
          <div style="font-size:10px; font-weight:bold; letter-spacing:0.5px;">MONTO DE LA OPERACIÓN</div>
          <div class="amount-val">S/ ${monto}</div>
          <div style="font-size:10px; color:#555;">(Efectivo en Mostrador)</div>
        </div>

        <div class="firmas">
          <div class="firma-col">
            <strong>Entregué Conforme</strong><br>
            <span style="font-size:9px; color:#666;">Firma Cajero</span>
          </div>
          <div class="firma-col">
            <strong>Recibí Conforme</strong><br>
            <span style="font-size:9px; color:#666;">Firma / DNI</span>
          </div>
        </div>

        <div class="footer">
          <p>Comprobante físico de control interno de caja chica.<br>
          Adjuntar al sobre de turno para el arqueo final.</p>
        </div>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 450);
  };

  const enviarWhatsAppMovimiento = (mov, cajaTurno) => {
    if (!mov || !mov.monto || parseFloat(mov.monto) <= 0) {
      toast.error('Ingrese un monto válido para enviar el reporte');
      return;
    }
    const esEgreso = mov.tipo === 'Egreso';
    const fecha = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const mensaje = encodeURIComponent(
      `🔔 *REPORTE DE MOVIMIENTO DE CAJA*\n\n` +
      `• *Tipo:* ${esEgreso ? '🔻 EGRESO / SALIDA' : '🔺 INGRESO EXTRAORDINARIO'}\n` +
      `• *Monto:* *S/ ${parseFloat(mov.monto || 0).toFixed(2)}*\n` +
      `• *Motivo:* ${mov.concepto || 'Sin descripción'}\n` +
      `• *Turno de Caja:* #${cajaTurno?.id || '—'}\n` +
      `• *Fecha y Hora:* ${fecha}\n\n` +
      `_Reporte de control interno de caja chica farmacéutica._`
    );
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();
    if (!movimiento.monto || parseFloat(movimiento.monto) <= 0 || !movimiento.concepto.trim()) {
      toast.error('Complete todos los campos del movimiento');
      return;
    }

    try {
      setGuardandoMovimiento(true);
      const res = await api.post('/caja/movimiento', {
        id_caja: dataCaja.caja.id,
        tipo: movimiento.tipo,
        monto: parseFloat(movimiento.monto),
        concepto: movimiento.concepto,
        motivo: movimiento.concepto
      });
      if (res?.success || res?.data?.success) {
        toast.success('Movimiento registrado en caja');
        const movRegistrado = { ...movimiento };
        setModalMovimiento(false);
        setMovimiento({ tipo: 'Egreso', monto: '', concepto: '' });
        await cargarCaja();
        window.dispatchEvent(new CustomEvent('caja-status-changed'));

        if (imprimirAlGuardar) {
          imprimirVoucherMovimiento(movRegistrado, dataCaja.caja);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err?.message || 'Error al registrar movimiento');
    } finally {
      setGuardandoMovimiento(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 text-sm gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Cargando estado de la caja de turno...</span>
      </div>
    );
  }

  const { cajaAbierta, caja, resumen } = dataCaja;

  return (
    <div className="space-y-6">
      {/* ─── 1. ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sora">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Wallet className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Operaciones de Caja Chica
              </h2>
              <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-sora border shrink-0 ${
                cajaAbierta
                  ? 'bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border-[#A6F6D8] dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
              }`}>
                <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                {cajaAbierta ? `Turno #${caja?.id || ''} Abierto` : 'Caja Cerrada'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Arqueo de turnos farmacéuticos, registro de gastos operativos y cuadre de efectivo en mostrador.
            </p>
          </div>
        </div>

        {cajaAbierta ? (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/caja-finanzas?tab=turnos')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sora"
              title="Ver todas las cajas y arqueos anteriores"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Historial Turnos</span>
            </button>
            <button
              onClick={() => setModalMovimiento(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer font-sora"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#00B884]" />
              <span>Ingreso / Egreso</span>
            </button>
            <button
              onClick={() => setModalCerrar(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shadow-rose-900/20 active:scale-[0.98] cursor-pointer font-sora"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cerrar Turno</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/caja-finanzas?tab=turnos')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sora"
              title="Ver todas las cajas y arqueos anteriores"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Historial de Cajas</span>
            </button>
            <button
              onClick={() => setModalAbrir(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 active:scale-[0.98] cursor-pointer font-sora"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Aperturar Turno</span>
            </button>
          </div>
        )}
      </div>

      {!cajaAbierta ? (
        /* Caja Cerrada State */
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-[26px] soft-card-shadow border border-slate-100 p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">La caja se encuentra cerrada</h2>
            <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
              Para iniciar las ventas del día en mostrador y registrar operaciones farmacéuticas, aperture un turno con el saldo inicial de sencillo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setModalAbrir(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 active:scale-95 cursor-pointer"
              >
                Aperturar Caja Ahora
              </button>
              <button
                type="button"
                onClick={() => navigate('/caja-finanzas?tab=turnos')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Ver Historial de Turnos
              </button>
            </div>
          </div>

          {/* Tarjeta del Último Turno Cerrado para consulta o reimpresión */}
          {ultimoCierre && (
            <div className="bg-white rounded-[24px] soft-card-shadow border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                        Último Turno Cerrado (Turno #{ultimoCierre.id})
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        Historial
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cerrado el{' '}
                      {new Date(ultimoCierre.fecha_cierre || ultimoCierre.created_at).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {ultimoCierre.usuario?.nombre ? ` • Cajero: ${ultimoCierre.usuario.nombre}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCierreResultData(ultimoCierre);
                      setModalCierreExitoso(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver Resumen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      imprimirTicketCierreCaja(ultimoCierre, { formato: '80mm', settings, autoPrint: true });
                      toast.success('Enviando ticket a impresora térmica...', { icon: '🖨️' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-200/80 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Reimprimir Ticket</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fondo Inicial</span>
                  <span className="font-mono font-bold text-slate-700">
                    S/ {parseFloat(ultimoCierre.monto_inicial || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Esperado</span>
                  <span className="font-mono font-bold text-slate-700">
                    S/ {parseFloat(ultimoCierre.monto_final_esperado || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Efectivo Real</span>
                  <span className="font-mono font-bold text-emerald-700">
                    S/ {parseFloat(ultimoCierre.monto_final_real || ultimoCierre.monto_final || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Diferencia</span>
                  <span
                    className={`font-mono font-bold ${
                      parseFloat(ultimoCierre.diferencia || 0) === 0
                        ? 'text-emerald-600'
                        : parseFloat(ultimoCierre.diferencia || 0) > 0
                        ? 'text-blue-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {parseFloat(ultimoCierre.diferencia || 0) > 0 ? '+' : ''}
                    S/ {parseFloat(ultimoCierre.diferencia || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Caja Abierta Dashboard */
        <div className="space-y-6">
          {/* Tarjetas de Arqueo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monto Inicial */}
            <div className="bg-white rounded-[24px] soft-card-shadow border border-slate-100 p-5 card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Monto Inicial
                </span>
                <span className="p-2 rounded-xl bg-slate-50 text-slate-500">
                  <Banknote className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 font-mono mt-2">
                S/ {resumen.monto_inicial.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Sencillo de apertura</p>
            </div>

            {/* Ventas Efectivo */}
            <div className="bg-white rounded-[24px] soft-card-shadow border border-[#D1F4E3] p-5 card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#00855E] uppercase tracking-wider flex items-center gap-1.5 font-sora">
                  <ArrowUpRight className="w-4 h-4 text-[#00B884]" /> Ventas Efectivo
                </span>
                <span className="p-2 rounded-xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8]">
                  <TrendingUp className="w-4 h-4 text-[#00B884]" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#00855E] font-sora mt-2">
                S/ {resumen.ventas_efectivo.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Cobrado en mostrador</p>
            </div>

            {/* Ventas Digitales */}
            <div className="bg-white rounded-[24px] soft-card-shadow border border-[#D1F4E3] p-5 card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-sora">
                  <Smartphone className="w-4 h-4" /> Yape / Plin / Pos
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Smartphone className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-blue-600 font-sora mt-2">
                S/ {resumen.ventas_digitales.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">No entra al cajón físico</p>
            </div>

            {/* Saldo Esperado en Efectivo */}
            <div className="bg-gradient-to-br from-[#00B884] to-[#009E70] rounded-[24px] p-5 text-white shadow-lg shadow-[#00B884]/25 card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider font-sora">
                  Total Físico en Cajón
                </span>
                <span className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-sm">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white font-sora mt-2 tracking-tight">
                S/ {resumen.saldo_esperado_efectivo.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-100 mt-1 font-medium">Saldo esperado al arqueo</p>
            </div>
          </div>

          {/* Sub Totales y Movimientos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resumen Detallado */}
            <div className="bg-white rounded-[24px] soft-card-shadow border border-[#D1F4E3] p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 font-sora">
                <Receipt className="w-4 h-4 text-[#00B884]" />
                Desglose Operativo del Turno
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span className="font-sora">Monto Inicial:</span>
                  <span className="font-sora font-bold text-slate-800">S/ {resumen.monto_inicial.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sora">(+) Ventas Efectivo:</span>
                  <span className="font-sora font-bold text-[#00855E]">S/ {resumen.ventas_efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sora">(+) Abonos Cuentas por Cobrar:</span>
                  <span className="font-sora font-bold text-slate-800">S/ {resumen.abonos_efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sora">(+) Ingresos Extra:</span>
                  <span className="font-sora font-bold text-[#00855E]">S/ {resumen.ingresos_extra.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sora">(-) Egresos / Gastos Menores:</span>
                  <span className="font-sora font-bold text-rose-500">S/ {resumen.egresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-3 border-t border-slate-100 font-sora">
                  <span>Saldo Físico Estimado:</span>
                  <span className="font-mono text-emerald-600 text-base">S/ {resumen.saldo_esperado_efectivo.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Cuadre automático activo con validación de arqueo.
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de Movimientos de Caja */}
            <div className="lg:col-span-2 bg-white rounded-[24px] soft-card-shadow border border-slate-100 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Movimientos Extraordinarios del Turno
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[300px]">
                {caja.movimientos && caja.movimientos.length > 0 ? (
                  <div className="space-y-2">
                    {caja.movimientos.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`p-2 rounded-xl ${
                              m.tipo === 'Ingreso'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {m.tipo === 'Ingreso' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{m.concepto || m.motivo}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {new Date(m.created_at).toLocaleTimeString('es-PE')}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold text-sm ${
                            m.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.tipo === 'Ingreso' ? '+' : '-'} S/{' '}
                          {parseFloat(m.monto).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 py-12">
                    No se han registrado ingresos o egresos manuales en este turno.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura */}
      {modalAbrir && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAbrir(false);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer font-sora"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <form
            onSubmit={handleAbrirCaja}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] soft-card-shadow border border-slate-100 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl font-sora animate-in zoom-in-95 duration-150 cursor-default my-auto text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <Unlock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Aperturar Turno de Botica
                </h2>
                <p className="text-xs text-slate-400">
                  Control de apertura y sencillo inicial
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ingrese el monto en efectivo disponible en el cajón físico (sencillo / cambio para vuelto).
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Monto Inicial (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-emerald-600 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>
            {/* Botones de montos sugeridos */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {['0.00', '50.00', '100.00', '200.00'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMontoApertura(val)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    montoApertura === val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  S/ {parseFloat(val).toFixed(0)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAbrir(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              >
                Abrir Caja
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Modal Movimiento de Caja (Tema Claro Farmacéutico) */}
      {modalMovimiento && (() => {
        const saldoDisponibleEfectivo = dataCaja?.resumen?.saldo_esperado_efectivo || 0;
        const montoNum = parseFloat(movimiento.monto || 0);
        const esEgreso = movimiento.tipo === 'Egreso';
        const superaEfectivo = esEgreso && montoNum > saldoDisponibleEfectivo;

        return typeof document !== 'undefined' ? createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalMovimiento(false);
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer font-sora"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 relative my-auto cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden font-sora"
            >
              {/* Cabecera Fija */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                    esEgreso
                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  }`}>
                    {esEgreso ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      Movimiento de Caja Chica
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      Turno #{dataCaja?.caja?.id || '—'} • Registro de ingresos extraordinarios y gastos menores
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Formulario con cuerpo scrolleable y pie fijo */}
              <form onSubmit={handleRegistrarMovimiento} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                  {/* Tarjeta de Saldo Disponible en Cajón Físico */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] uppercase font-extrabold text-emerald-800 dark:text-emerald-400 block tracking-wider">
                        Efectivo Disponible en Cajón
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                          S/ {saldoDisponibleEfectivo.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          (Fondo inicial + Ventas en efectivo)
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Alerta Preventiva de Sobregiro en Efectivo */}
                  {superaEfectivo && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[11px]">
                        <p className="font-extrabold text-amber-800 dark:text-amber-300">Precaución por Saldo en Caja:</p>
                        <p>
                          El egreso de <strong>S/ {montoNum.toFixed(2)}</strong> supera el efectivo físico disponible (<strong>S/ {saldoDisponibleEfectivo.toFixed(2)}</strong>). Esto generará un saldo negativo en el arqueo del turno.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Selector de Tipo de Operación */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Tipo de Operación
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setMovimiento({ ...movimiento, tipo: 'Egreso' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          esEgreso
                            ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs border border-rose-200/80 dark:border-rose-800 font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <ArrowDownRight className={`w-3.5 h-3.5 ${esEgreso ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span>Egreso / Gasto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMovimiento({ ...movimiento, tipo: 'Ingreso' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          !esEgreso
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-200/80 dark:border-emerald-800 font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <ArrowUpRight className={`w-3.5 h-3.5 ${!esEgreso ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Ingreso Extra</span>
                      </button>
                    </div>
                  </div>

                  {/* Monto de la Operación con Atajos Rápidos */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                        Monto de la Operación (S/)
                      </label>
                      <button
                        type="button"
                        onClick={() => setMovimiento({ ...movimiento, monto: '' })}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                      >
                        Limpiar Monto
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={movimiento.monto}
                        onChange={(e) => setMovimiento({ ...movimiento, monto: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-950 shadow-2xs transition-all"
                      />
                    </div>

                    {/* Atajos de Suma de Efectivo Rápido */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-0.5">Sumar:</span>
                      {[5, 10, 20, 50, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const actual = parseFloat(movimiento.monto) || 0;
                            setMovimiento({ ...movimiento, monto: (actual + val).toFixed(2) });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          +S/ {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motivo / Concepto con Chips Frecuentes */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Motivo / Concepto
                    </label>
                    <input
                      type="text"
                      required
                      value={movimiento.concepto}
                      onChange={(e) => setMovimiento({ ...movimiento, concepto: e.target.value })}
                      placeholder={esEgreso ? "Ej. Compra de rollos térmicos o bolsas" : "Ej. Ingreso de sencillo para cambio"}
                      className="w-full px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-950 shadow-2xs transition-all"
                    />

                    {/* Chips Rápidos de 1 Toque */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(esEgreso ? MOTIVOS_FRECUENTES_EGRESO : MOTIVOS_FRECUENTES_INGRESO).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMovimiento({ ...movimiento, concepto: m })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                            movimiento.concepto === m
                              ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkbox de Impresión Automática */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={imprimirAlGuardar}
                        onChange={(e) => setImprimirAlGuardar(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                      />
                      <span>Imprimir comprobante térmico (72mm) automáticamente al registrar</span>
                    </label>
                  </div>
                </div>

                {/* Pie Fijo con Botones de Comunicación, Impresión y Acción */}
                <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Voucher Térmico */}
                    <button
                      type="button"
                      onClick={() => imprimirVoucherMovimiento(movimiento, dataCaja?.caja)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                      title="Imprimir ticket de comprobante de movimiento para firmar"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Voucher</span>
                    </button>

                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => enviarWhatsAppMovimiento(movimiento, dataCaja?.caja)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                      title="Enviar reporte del movimiento al WhatsApp del administrador"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalMovimiento(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoMovimiento}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                        esEgreso
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                          : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25'
                      }`}
                    >
                      {guardandoMovimiento ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{esEgreso ? 'Registrar Egreso' : 'Registrar Ingreso'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        ) : null;
      })()}

      {/* Modal Cierre Compartido con Arqueo en Vivo */}
      <ModalCerrarCaja
        isOpen={modalCerrar}
        onClose={() => setModalCerrar(false)}
        caja={dataCaja?.caja}
        resumen={dataCaja?.resumen}
        onSuccess={(info) => {
          setCierreResultData(info);
          setModalCierreExitoso(true);
          cargarCaja();
          cargarUltimoCierre();
        }}
      />

      {/* Modal Cierre Exitoso con Impresión Térmica */}
      <ModalCierreCajaExito
        isOpen={modalCierreExitoso}
        onClose={() => setModalCierreExitoso(false)}
        cajaData={cierreResultData}
      />
    </div>
  );
}
