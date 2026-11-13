import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import { useSettingsStore } from '@heis/core';
import {
  ShieldAlert,
  AlertTriangle,
  Trash2,
  FileText,
  Printer,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  FileCheck,
  PackageX,
  ArrowRight,
  Pill,
  Sparkles,
  RefreshCw,
  UserCheck,
  DollarSign,
  TrendingDown,
  Filter
} from 'lucide-react';
import DropdownPill from './components/DropdownPill';
import DatePickerPill from './components/DatePickerPill';

const FILTRO_MOTIVO_OPCIONES = [
  { value: 'todos', label: 'Todos los Motivos', subtitle: 'Ver todas las actas registradas' },
  { value: 'Vencimiento', label: 'Vencimiento de Lote', subtitle: 'Lote caducado según norma DIGEMID' },
  { value: 'Deterioro_Fisico', label: 'Deterioro Físico', subtitle: 'Empaque o sello en mal estado' },
  { value: 'Rotura_Accidental', label: 'Rotura Accidental', subtitle: 'Quiebre o daño en manipulación' },
  { value: 'Alerta_Sanitaria_DIGEMID', label: 'Alerta Sanitaria DIGEMID', subtitle: 'Inmovilización por orden reguladora' },
  { value: 'Canje_Rechazado_Proveedor', label: 'Canje Rechazado Proveedor', subtitle: 'Droguería no acepta reemplazo' }
];

const MOTIVO_SANITARIO_OPCIONES = [
  { value: 'Vencimiento', label: 'Vencimiento de Lote', subtitle: 'Lote caducado según norma DIGEMID' },
  { value: 'Deterioro_Fisico', label: 'Deterioro Físico', subtitle: 'Empaque o sello en mal estado' },
  { value: 'Rotura_Accidental', label: 'Rotura Accidental', subtitle: 'Quiebre o daño en manipulación' },
  { value: 'Alerta_Sanitaria_DIGEMID', label: 'Alerta Sanitaria DIGEMID', subtitle: 'Inmovilización por orden reguladora' },
  { value: 'Canje_Rechazado_Proveedor', label: 'Canje Rechazado por Proveedor', subtitle: 'Droguería no acepta reemplazo' }
];

const DESTINO_FINAL_OPCIONES = [
  { value: 'En_Custodia_Cuarentena', label: 'Área de Cuarentena (Custodia)', subtitle: 'Almacén de productos no conformes' },
  { value: 'Destruccion_Desmedro', label: 'Destrucción / Desmedro', subtitle: 'Eliminación final autorizada' },
  { value: 'Devolucion_Drogueria', label: 'Devolución a Droguería', subtitle: 'Retorno formal al proveedor' }
];

export default function BajasCuarentena() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [actas, setActas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ totalActas: 0, costoTotalPerdida: '0.00' });
  const [filtroMotivo, setFiltroMotivo] = useState('todos');

  // Modal para ver detalle de un acta existente
  const [actaSeleccionada, setActaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Modal para crear nueva acta de baja
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario de nueva baja
  const [formulario, setFormulario] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_motivo: 'Vencimiento',
    destino_final: 'En_Custodia_Cuarentena',
    observaciones: '',
    items: [] // { id_medicamento, id_lote, nombre, lote_codigo, vencimiento, cantidad_cajas, cantidad_fraccion, costo_unitario }
  });

  // Buscador de medicamentos para agregar a la baja
  const [busquedaMed, setBusquedaMed] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Cargar actas
  const cargarActas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroMotivo !== 'todos') params.tipo_motivo = filtroMotivo;

      const res = await api.get('/bajas', { params });
      if (res && res.success) {
        setActas(res.actas || []);
        if (res.estadisticas) setEstadisticas(res.estadisticas);
      }
    } catch (err) {
      toast.error('Error al cargar actas de baja y cuarentena.');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const processedPreloadRef = useRef(null);

  const cerrarModalNuevo = () => {
    setModalNuevoAbierto(false);
    processedPreloadRef.current = null;
  };

  // Recibir lote preseleccionado desde el semáforo FEFO de Lotes (sin emitir toasts prematuros)
  useEffect(() => {
    if (location.state?.preloadedLote) {
      const itemLote = location.state.preloadedLote;
      if (processedPreloadRef.current === itemLote.id_lote) return;
      processedPreloadRef.current = itemLote.id_lote;

      setFormulario((prev) => {
        const yaExiste = prev.items.some((it) => it.id_lote === itemLote.id_lote);
        if (yaExiste) return prev;
        return {
          ...prev,
          items: [...prev.items, itemLote]
        };
      });
      setModalNuevoAbierto(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, location.search]);

  useEffect(() => {
    cargarActas();
  }, [filtroMotivo]);

  // Búsqueda de medicamentos con debounce para agregar al acta
  useEffect(() => {
    if (!busquedaMed.trim() || busquedaMed.length < 2) {
      setResultadosBusqueda([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        const res = await api.get('/medicamentos', { params: { busqueda: busquedaMed, limit: 10 } });
        const list = res?.medicamentos || res?.data || [];
        if (Array.isArray(list)) {
          setResultadosBusqueda(list);
        }
      } catch (e) {
        // Ignorar
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaMed]);

  // Agregar medicamento al carrito de baja
  const agregarItemBaja = (med) => {
    // Si ya existe, no duplicar
    if (formulario.items.some((it) => it.id_medicamento === med.id)) {
      toast.error('Este producto ya está agregado en la lista de baja.');
      return;
    }

    // Tomar primer lote disponible si existe
    const lote = med.lotes && med.lotes.length > 0 ? med.lotes[0] : null;

    const nuevoItem = {
      id_medicamento: med.id,
      nombre_comercial: med.nombre_comercial,
      concentracion: med.concentracion,
      laboratorio: med.laboratorio || 'N/A',
      unidades_por_caja: med.unidades_por_caja || 1,
      id_lote: lote?.id || null,
      lote_codigo: lote?.numero_lote || 'SIN_LOTE',
      vencimiento: lote?.fecha_vencimiento || '-',
      stock_max_cajas: lote ? parseFloat(lote.stock_cajas || 0) : parseFloat(med.stock_cajas || 0),
      cantidad_cajas: 1,
      cantidad_fraccion: 0,
      costo_unitario: parseFloat(med.precio_compra || 0)
    };

    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, nuevoItem]
    }));
    setBusquedaMed('');
    setResultadosBusqueda([]);
  };

  // Calcular la pérdida total en soles del formulario actual
  const calcularTotalPerdidaFormulario = () => {
    return (formulario.items || []).reduce((acc, it) => {
      const cantCajas = parseFloat(it.cantidad_cajas || 0);
      const cantFracc = parseInt(it.cantidad_fraccion || 0);
      const costoUnit = parseFloat(it.costo_unitario || 0);
      const uxc = it.unidades_por_caja > 1 ? it.unidades_por_caja : 1;
      const sub = (cantCajas * costoUnit) + (cantFracc * (costoUnit / uxc));
      return acc + sub;
    }, 0);
  };

  // Actualizar cantidad de un item en el acta
  const actualizarCantidadItem = (index, campo, valor) => {
    setFormulario((prev) => {
      const itemsCopia = [...prev.items];
      itemsCopia[index][campo] = valor;
      return { ...prev, items: itemsCopia };
    });
  };

  // Quitar item de la lista
  const removerItem = (index) => {
    setFormulario((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Guardar y emitir el Acta de Baja
  const handleSubmitBaja = async (e) => {
    e.preventDefault();
    if (formulario.items.length === 0) {
      toast.error('Debe agregar al menos un producto a inmovilizar.');
      return;
    }

    const haySinCantidad = formulario.items.some((it) => {
      const c = parseFloat(it.cantidad_cajas || 0);
      const f = parseInt(it.cantidad_fraccion || 0);
      return c <= 0 && f <= 0;
    });
    if (haySinCantidad) {
      toast.error('Todos los productos deben tener una cantidad de cajas o fracciones mayor a cero.');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        fecha: formulario.fecha,
        tipo_motivo: formulario.tipo_motivo,
        destino_final: formulario.destino_final,
        observaciones: formulario.observaciones,
        detalles: formulario.items.map((it) => ({
          id_medicamento: it.id_medicamento,
          id_lote: it.id_lote,
          cantidad_cajas: parseFloat(it.cantidad_cajas || 0),
          cantidad_fraccion: parseInt(it.cantidad_fraccion || 0),
          costo_unitario: it.costo_unitario
        }))
      };

      const res = await api.post('/bajas', payload);
      if (res && res.success) {
        toast.success(res.message || 'Acta generada exitosamente.');
        cerrarModalNuevo();
        setFormulario({
          fecha: new Date().toISOString().split('T')[0],
          tipo_motivo: 'Vencimiento',
          destino_final: 'En_Custodia_Cuarentena',
          observaciones: '',
          items: []
        });
        cargarActas();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al emitir el acta de baja.');
    } finally {
      setGuardando(false);
    }
  };

  // Ver detalle de acta
  const verDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      const res = await api.get(`/bajas/${id}`);
      if (res && res.success) {
        setActaSeleccionada(res.acta);
      }
    } catch (e) {
      toast.error('No se pudo cargar el detalle del acta.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Imprimir Acta Oficial de Baja
  const imprimirActa = async (id) => {
    try {
      toast.loading('Generando documento de impresión...', { id: 'imp-baja' });
      const res = await api.get(`/bajas/${id}/imprimir`);
      toast.dismiss('imp-baja');

      if (!res || !res.success) {
        toast.error('No se pudo generar el acta.');
        return;
      }

      const { acta, empresa } = res;

      const ventana = window.open('', '_blank');
      ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Acta Oficial de Baja e Inmovilización - ${acta.numero_acta}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
            .header { border-bottom: 2px solid #b91c1c; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 14px; font-weight: bold; color: #b91c1c; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 9.5px; color: #64748b; font-weight: bold; margin-top: 2px; }
            .acta-num { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 8px; background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; }
            .info-item { font-size: 9.5px; }
            .info-label { font-weight: bold; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 9px; }
            th { background: #f1f5f9; color: #0f172a; font-weight: bold; text-align: center; }
            .total-row { background: #fef2f2; font-weight: bold; font-size: 10px; }
            .footer-firmas { margin-top: 50px; display: flex; justify-content: space-around; text-align: center; }
            .firma-box { width: 220px; border-top: 1px solid #334155; padding-top: 5px; font-size: 9px; }
            .fundamento { margin-top: 20px; font-size: 8.5px; color: #64748b; text-align: justify; line-height: 1.3; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">ACTA OFICIAL DE INMOVILIZACIÓN, BAJA Y RETIRO DE PRODUCTOS FARMACÉUTICOS</p>
            <p class="subtitle">BUENAS PRÁCTICAS DE OFICINA FARMACÉUTICA • D.S. N° 014-2011-SA Y R.M. N° 554-2022/MINSA</p>
            <p class="acta-num">N° DE ACTA: ${acta.numero_acta}</p>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">ESTABLECIMIENTO:</span> ${empresa.nombre}</div>
              <div class="info-item"><span class="info-label">RUC:</span> ${empresa.ruc}</div>
              <div class="info-item"><span class="info-label">DIRECCIÓN:</span> ${empresa.direccion}</div>
              <div class="info-item"><span class="info-label">FECHA DE EMISIÓN:</span> ${acta.fecha}</div>
              <div class="info-item"><span class="info-label">DIRECTOR TÉCNICO (Q.F.):</span> ${acta.usuario_qf?.nombre} (${acta.usuario_qf?.colegiatura_qf || 'CQFP'})</div>
              <div class="info-item"><span class="info-label">MOTIVO SANITARIO:</span> ${acta.tipo_motivo.replace(/_/g, ' ')}</div>
              <div class="info-item"><span class="info-label">DESTINO FINAL:</span> ${acta.destino_final.replace(/_/g, ' ')}</div>
              <div class="info-item"><span class="info-label">ESTADO:</span> ${acta.estado}</div>
            </div>
          </div>

          <p style="font-size: 9.5px; font-weight: bold; margin-top: 8px;">DETALLE DE PRODUCTOS INMOVILIZADOS Y RETIRADOS DEL PISO DE VENTA:</p>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th>DESCRIPCIÓN DEL FÁRMACO</th>
                <th>N° LOTE</th>
                <th>VENCIMIENTO</th>
                <th style="text-align: right;">CANT. CAJAS</th>
                <th style="text-align: right;">CANT. FRAC.</th>
                <th style="text-align: right;">COSTO UNIT.</th>
                <th style="text-align: right;">PÉRDIDA TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${acta.detalles.map((d, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td><strong>${d.medicamento?.nombre_comercial || 'Fármaco'}</strong> ${d.medicamento?.concentracion || ''}</td>
                  <td style="font-family: monospace; text-align: center;">${d.numero_lote}</td>
                  <td style="text-align: center;">${d.fecha_vencimiento || '-'}</td>
                  <td style="text-align: right; font-weight: bold;">${parseFloat(d.cantidad_cajas).toFixed(0)}</td>
                  <td style="text-align: right;">${d.cantidad_fraccion}</td>
                  <td style="text-align: right;">S/ ${parseFloat(d.costo_unitario).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold;">S/ ${parseFloat(d.subtotal_costo).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="7" style="text-align: right; padding-right: 10px;">COSTO TOTAL DE PÉRDIDA POR MERMA / DESMEDRO (S/):</td>
                <td style="text-align: right;">S/ ${parseFloat(acta.costo_total_perdida).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          ${acta.observaciones ? `
            <div style="margin-top: 10px; font-size: 9px; background: #f8fafc; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong>OBSERVACIONES ADICIONALES:</strong> ${acta.observaciones}
            </div>
          ` : ''}

          <div class="fundamento">
            <strong>FUNDAMENTO LEGAL Y SANITARIO:</strong> La presente Acta certifica que los productos detallados han sido formalmente retirados del anaquel y trasladados al Área de Bajas / Cuarentena, quedando expresamente prohibida su dispensación o comercialización al público consumidor conforme al Art. 40 y 41 del D.S. N° 014-2011-SA. Asimismo, constituye sustento fehaciente de mermas y desmedros de existencias conforme al Artículo 37° inciso f) del TUO de la Ley del Impuesto a la Renta y su Reglamento (D.S. N° 122-94-EF).
          </div>

          <div class="footer-firmas">
            <div class="firma-box">
              <br><br>
              <strong>QUÍMICO FARMACÉUTICO</strong><br>
              Director Técnico / Reg. CQFP: ${acta.usuario_qf?.colegiatura_qf || 'CQFP'}
            </div>
            <div class="firma-box">
              <br><br>
              <strong>REPRESENTANTE LEGAL</strong><br>
              Administrador / Gerencia
            </div>
          </div>
        </body>
        </html>
      `);
      ventana.document.close();
      setTimeout(() => {
        ventana.print();
      }, 500);
    } catch (err) {
      toast.error('Error al abrir la vista de impresión.');
    }
  };

  return (
    <div className="space-y-4 font-sora">
      {/* ─── ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Bajas, Cuarentena & Mermas
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 shrink-0 font-sora">
                D.S. 014-2011-SA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Inmovilización formal de lotes vencidos o con alerta DIGEMID • Sustento de mermas ante SUNAT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={cargarActas}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 border border-slate-200/80 hover:border-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refrescar lista de actas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setModalNuevoAbierto(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shadow-rose-900/20 active:scale-[0.98] transition-all flex items-center gap-1.5 font-sora cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generar Acta de Baja</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (DISEÑO Y DIMENSIONES DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: Todas las Actas */}
        <div
          onClick={() => setFiltroMotivo('todos')}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroMotivo === 'todos'
              ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
          }`}
          title="Ver todas las actas registradas"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                Actas Emitidas
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                {estadisticas.totalActas || actas.length}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              DIRIS / SUNAT
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
              filtroMotivo === 'todos'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              {filtroMotivo === 'todos' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
              {filtroMotivo === 'todos' ? 'Activo' : 'Ver Todas'}
            </span>
          </div>
        </div>

        {/* KPI 2: Pérdida Deducible SUNAT */}
        <div
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none"
          title="Costo total de adquisición deducible de mermas"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-sora truncate min-w-0 transition-colors">
                Pérdida Deducible
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                S/ {parseFloat(estadisticas.costoTotalPerdida || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Adquisición
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 whitespace-nowrap font-sora">
              SUNAT Op 13
            </span>
          </div>
        </div>

        {/* KPI 3: Vencimientos */}
        <div
          onClick={() => setFiltroMotivo(filtroMotivo === 'Vencimiento' ? 'todos' : 'Vencimiento')}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroMotivo === 'Vencimiento'
              ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 shadow-xs shadow-rose-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
          }`}
          title="Filtrar actas causadas por vencimiento de lote"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-sora truncate min-w-0 transition-colors">
                Vencimientos
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                {actas.filter(a => a.tipo_motivo === 'Vencimiento').length}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Caducados
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
              filtroMotivo === 'Vencimiento'
                ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {filtroMotivo === 'Vencimiento' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />}
              {filtroMotivo === 'Vencimiento' ? 'Filtrando' : 'DIGEMID'}
            </span>
          </div>
        </div>

        {/* KPI 4: Alertas & Mermas */}
        <div
          onClick={() => setFiltroMotivo(filtroMotivo === 'Alerta_Sanitaria_DIGEMID' ? 'todos' : 'Alerta_Sanitaria_DIGEMID')}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroMotivo === 'Alerta_Sanitaria_DIGEMID'
              ? 'border-amber-500 bg-amber-50/10 dark:bg-amber-950/20 shadow-xs shadow-amber-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
          }`}
          title="Filtrar actas por alertas sanitarias o deterioros"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-sora truncate min-w-0 transition-colors">
                Mermas & Alertas
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {actas.filter(a => a.tipo_motivo !== 'Vencimiento').length}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Bloqueo POS
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
              filtroMotivo === 'Alerta_Sanitaria_DIGEMID'
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
            }`}>
              {filtroMotivo === 'Alerta_Sanitaria_DIGEMID' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
              {filtroMotivo === 'Alerta_Sanitaria_DIGEMID' ? 'Filtrando' : 'Inmovilizados'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── FILTROS Y LISTA DE ACTAS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow relative z-20">
        <div className="p-3.5 border-b border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sora">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Libro de Actas de Baja e Inmovilización
            </h2>
          </div>

          <div className="w-full sm:w-72">
            <DropdownPill
              value={filtroMotivo}
              onChange={(val) => setFiltroMotivo(val)}
              options={FILTRO_MOTIVO_OPCIONES}
              icon={Filter}
              placeholder="Filtrar por motivo..."
              direction="down"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-[#F8FCFA] dark:bg-slate-950 text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#D1F4E3] dark:border-slate-800 font-sora">
              <tr>
                <th className="py-3 px-4">N° de Acta</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Motivo Sanitario</th>
                <th className="py-3 px-4">Destino Final</th>
                <th className="py-3 px-4">Director Técnico (Q.F.)</th>
                <th className="py-3 px-4">Costo Merma</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sora">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-bold">
                    Cargando actas de baja...
                  </td>
                </tr>
              ) : actas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <PackageX className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">No hay actas registradas</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Genera la primera acta de inmovilización cuando tengas productos vencidos o mermas.
                    </p>
                  </td>
                </tr>
              ) : (
                actas.map((acta) => (
                  <tr key={acta.id} className="hover:bg-[#EBFDF6]/40 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-rose-600 dark:text-rose-400">
                      {acta.numero_acta}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {acta.fecha}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {acta.tipo_motivo.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {acta.destino_final.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {acta.usuario_qf?.nombre || 'Director Técnico'}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-slate-100">
                      S/ {parseFloat(acta.costo_total_perdida || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80">
                        {acta.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => verDetalle(acta.id)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Ver detalle del acta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => imprimirActa(acta.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Imprimir Acta Oficial para DIRIS / SUNAT"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL DE CREACIÓN DE NUEVA ACTA DE BAJA ─── */}
      {modalNuevoAbierto && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModalNuevo();
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                      Generar Acta de Inmovilización y Baja Sanitaria
                    </h3>
                    <span className="inline-flex items-center whitespace-nowrap text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 tracking-wide">
                      BPA DIGEMID
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold truncate max-w-md">
                    Retira inmediatamente los productos del piso de venta y sustenta la merma ante SUNAT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModalNuevo}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleSubmitBaja} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-modal-scroll">
                {/* Metadatos del Acta: Fecha, Motivo y Destino */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <DatePickerPill
                    label="Fecha de Emisión *"
                    value={formulario.fecha}
                    onChange={(val) => setFormulario({ ...formulario, fecha: val })}
                    mode="emision"
                    direction="down"
                    align="left"
                    placeholder="Seleccionar fecha..."
                  />

                  <DropdownPill
                    label="Motivo Sanitario *"
                    required
                    value={formulario.tipo_motivo}
                    onChange={(val) => setFormulario({ ...formulario, tipo_motivo: val })}
                    options={MOTIVO_SANITARIO_OPCIONES}
                    icon={AlertTriangle}
                  />

                  <DropdownPill
                    label="Destino Final *"
                    required
                    value={formulario.destino_final}
                    onChange={(val) => setFormulario({ ...formulario, destino_final: val })}
                    options={DESTINO_FINAL_OPCIONES}
                    icon={Trash2}
                  />
                </div>

                {/* Buscador de medicamentos para agregar al acta */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Buscar Medicamento a Inmovilizar:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaMed}
                      onChange={(e) => setBusquedaMed(e.target.value)}
                      placeholder="Escribe el nombre comercial, genérico o laboratorio..."
                      className="w-full bg-white dark:bg-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs font-sora h-[42px]"
                    />
                    {buscando && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown de resultados de búsqueda */}
                  {resultadosBusqueda.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto animate-in fade-in duration-150">
                      {resultadosBusqueda.map((med) => (
                        <div
                          key={med.id}
                          onClick={() => agregarItemBaja(med)}
                          className="p-3 hover:bg-rose-50/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate font-sora">
                              {med.nombre_comercial} {med.concentracion}
                            </p>
                            <p className="text-[10.5px] text-slate-400 font-medium truncate">
                              Lab: {med.laboratorio || 'N/A'} • Stock: {med.stock_cajas || 0} cjs ({med.stock_fraccion || 0} fcs) • Costo: S/ {parseFloat(med.precio_compra || 0).toFixed(2)}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900 shrink-0 font-sora shadow-2xs">
                            + Agregar
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de productos en el acta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-sora">
                      Productos Seleccionados para Baja ({formulario.items.length})
                    </span>
                    {formulario.items.length > 0 && (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-sora">
                        Pérdida estimada: S/ {calcularTotalPerdidaFormulario().toFixed(2)}
                      </span>
                    )}
                  </div>

                  {formulario.items.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 mx-auto flex items-center justify-center mb-2">
                        <PackageX className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold font-sora">
                        No hay productos añadidos al acta
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Utiliza el buscador de arriba para añadir los medicamentos y lotes que se darán de baja.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-modal-scroll">
                      {formulario.items.map((it, idx) => {
                        const cantCajas = parseFloat(it.cantidad_cajas || 0);
                        const cantFracc = parseInt(it.cantidad_fraccion || 0);
                        const costoUnit = parseFloat(it.costo_unitario || 0);
                        const uxc = it.unidades_por_caja > 1 ? it.unidades_por_caja : 1;
                        const subtotal = (cantCajas * costoUnit) + (cantFracc * (costoUnit / uxc));

                        return (
                          <div
                            key={`${it.id_medicamento}-${idx}`}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3 text-xs font-sora"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                {it.nombre_comercial} {it.concentracion}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200 font-bold">
                                  Lote: {it.lote_codigo}
                                </span>
                                <span>Vence: {it.vencimiento}</span>
                                {it.stock_max_cajas !== undefined && (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                    • Disp: {it.stock_max_cajas} cjs
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Cajas</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={it.cantidad_cajas}
                                  onChange={(e) => actualizarCantidadItem(idx, 'cantidad_cajas', e.target.value)}
                                  className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 font-mono font-bold text-center text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Fracción</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={it.cantidad_fraccion}
                                  onChange={(e) => actualizarCantidadItem(idx, 'cantidad_fraccion', e.target.value)}
                                  className="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 font-mono font-bold text-center text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                              </div>

                              <div className="text-right min-w-[65px] pl-1">
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Subtotal</span>
                                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                                  S/ {subtotal.toFixed(2)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removerItem(idx)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Quitar producto de la lista"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Observaciones Sanitarias */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Observaciones Sanitarias (Opcional):
                  </label>
                  <textarea
                    value={formulario.observaciones}
                    onChange={(e) => setFormulario({ ...formulario, observaciones: e.target.value })}
                    placeholder="Detalles sobre el retiro, estado físico o acta de inspección..."
                    rows={2}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs resize-none font-sora"
                  />
                </div>
              </div>

              {/* Botones de Pie */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
                <div className="text-xs font-sora">
                  {formulario.items.length > 0 && (
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Total Merma:{' '}
                      <strong className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                        S/ {calcularTotalPerdidaFormulario().toFixed(2)}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cerrarModalNuevo}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sora"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || formulario.items.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-sora disabled:opacity-50"
                  >
                    {guardando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Generando Acta...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>Emitir Acta y Retirar Stock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL DE VISTA DETALLE DEL ACTA ─── */}
      {actaSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActaSeleccionada(null);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[88vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                    Acta N° {actaSeleccionada.numero_acta}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">
                    Fecha: {actaSeleccionada.fecha} • Motivo: {actaSeleccionada.tipo_motivo.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActaSeleccionada(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-3 custom-modal-scroll">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5 font-sora">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Director Técnico Q.F.:</span>{' '}
                  {actaSeleccionada.usuario_qf?.nombre} ({actaSeleccionada.usuario_qf?.colegiatura_qf || 'CQFP'})
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Destino Final:</span>{' '}
                  {actaSeleccionada.destino_final.replace(/_/g, ' ')}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Costo Total de Merma:</span>{' '}
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    S/ {parseFloat(actaSeleccionada.costo_total_perdida).toFixed(2)}
                  </span>
                </p>
              </div>

              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block pt-1 font-sora">
                Medicamentos Inmovilizados:
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                {actaSeleccionada.detalles?.map((d) => (
                  <div key={d.id} className="p-3 text-xs flex items-center justify-between font-sora bg-white dark:bg-slate-800/40">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100">
                        {d.medicamento?.nombre_comercial} {d.medicamento?.concentracion}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Lote: {d.numero_lote} | Vence: {d.fecha_vencimiento || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {d.cantidad_cajas} cjs {d.cantidad_fraccion > 0 ? `+ ${d.cantidad_fraccion} u.` : ''}
                      </p>
                      <p className="font-mono font-black text-rose-600 dark:text-rose-400 text-[11px]">
                        S/ {parseFloat(d.subtotal_costo).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => imprimirActa(actaSeleccionada.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer font-sora"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Formato Oficial</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
