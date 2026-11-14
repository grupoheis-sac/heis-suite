import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api, consultarDocumento, useAuthStore, useRealtime } from '@heis/core';
import { Modal } from '@heis/ui';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Receipt,
  Code2,
  FileSpreadsheet,
  Calendar,
  Wallet,
  Boxes,
  X,
  ChevronLeft,
  ChevronRight,
  Ban,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Send,
  ShieldAlert,
  Eye,
  Copy,
  Check,
} from 'lucide-react';

const MAX_INTENTOS_WORKER = 10;

const ESTADO_SUNAT_CONFIG = {
  ACEPTADO: {
    label: 'Aceptado SUNAT',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: CheckCircle2,
  },
  ACEPTADO_CON_OBSERVACIONES: {
    label: 'Aceptado con Obs.',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20',
    icon: CheckCircle2,
  },
  PENDIENTE: {
    label: 'Pendiente de Envío',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20',
    icon: Clock,
  },
  PROCESANDO_ENVIO: {
    label: 'Transmitiendo a SUNAT...',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse',
    icon: RefreshCw,
  },
  CONTINGENCIA_REINTENTAR: {
    label: 'En Cola Contingencia',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: AlertTriangle,
  },
  RECHAZADO: {
    label: 'Rechazado (Tributario)',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    icon: XCircle,
  },
  ERROR_CRITICO: {
    label: 'Error Crítico',
    badgeClass: 'bg-red-600/15 text-red-600 dark:text-red-400 border border-red-500/30',
    icon: ShieldAlert,
  },
  ANULADO: {
    label: 'Anulado / Baja',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: Ban,
  },
};

function formatearProximoReintento(fechaIso) {
  if (!fechaIso) return '—';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '—';

  const diffSegundos = Math.round((fecha.getTime() - Date.now()) / 1000);
  if (diffSegundos <= 0) return 'En breve (< 30s)';
  if (diffSegundos < 60) return `En ${diffSegundos}s`;
  const diffMinutos = Math.ceil(diffSegundos / 60);
  if (diffMinutos < 60) return `En ${diffMinutos} min`;

  return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function FacturacionSunatHub() {
  const { empresa } = useAuthStore();
  const [comprobantes, setComprobantes] = useState([]);
  const [resumen, setResumen] = useState({
    total_comprobantes: 0,
    total_facturado: 0,
    total_igv: 0,
    total_gravadas: 0,
    aceptados: 0,
    notas_credito: 0,
  });
  const [loading, setLoading] = useState(true);

  // Paginación Servidor
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Filtros Avanzados
  const [periodoContable, setPeriodoContable] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [descargandoReporte, setDescargandoReporte] = useState(null);

  const [filtroModulo, setFiltroModulo] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [reintentandoId, setReintentandoId] = useState(null);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [archivoVisor, setArchivoVisor] = useState({
    cargando: false,
    cpe: null,
    tipo: 'xml',
    filename: '',
    content: '',
  });
  const [copiado, setCopiado] = useState(false);

  // Escuchar eventos WebSocket del worker de contingencia SUNAT
  useRealtime({
    'sunat:comprobante_actualizado': (payload) => {
      setComprobantes((prev) =>
        prev.map((item) =>
          item.id === payload.comprobante_id
            ? {
                ...item,
                estado_sunat: payload.estado_sunat,
                sunat_estado:
                  payload.estado_sunat === 'ACEPTADO' || payload.estado_sunat === 'ACEPTADO_CON_OBSERVACIONES'
                    ? 'ACEPTADO'
                    : payload.estado_sunat,
                proximo_reintento: null,
                intentos_envio: payload.intentos_envio ?? item.intentos_envio,
                codigo_sunat: payload.codigo_sunat ?? item.codigo_sunat,
                ultimo_error_sunat: payload.ultimo_error_sunat ?? item.ultimo_error_sunat,
                cdr_filename: payload.cdr_filename ?? item.cdr_filename,
              }
            : item
        )
      );
      toast.success(`Comprobante ${payload.serie}-${payload.correlativo}: ${payload.estado_sunat}`);
    },
    'sunat:alerta_rechazo': (payload) => {
      setComprobantes((prev) =>
        prev.map((item) =>
          item.id === payload.comprobante_id
            ? {
                ...item,
                estado_sunat: 'RECHAZADO',
                sunat_estado: 'RECHAZADO',
                codigo_sunat: payload.codigo,
                ultimo_error_sunat: payload.motivo,
                proximo_reintento: null,
              }
            : item
        )
      );
      toast.error(`Rechazo SUNAT (${payload.codigo}) en ${payload.comprobante}: ${payload.motivo}`);
    },
  });

  const handleForzarReintento = async (cpe) => {
    try {
      setReintentandoId(cpe.id);
      setComprobantes((prev) =>
        prev.map((item) =>
          item.id === cpe.id ? { ...item, estado_sunat: 'PROCESANDO_ENVIO' } : item
        )
      );

      const res = await api.post(`/core/facturacion/comprobantes/${cpe.id}/reintentar`);
      toast.success(res.data?.message || 'Reenvío a SUNAT encolado para ejecución inmediata.');
      cargarComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo forzar el reenvío a SUNAT.');
      cargarComprobantes();
    } finally {
      setReintentandoId(null);
    }
  };

  const handleAbrirVisor = async (cpe, tipo = 'xml') => {
    setVisorAbierto(true);
    setCopiado(false);
    setArchivoVisor({ cargando: true, cpe, tipo, filename: '', content: '' });

    try {
      const { data } = await api.get(
        `/core/facturacion/comprobantes/${cpe.id}/archivo/${tipo}?modo=preview`
      );
      setArchivoVisor({
        cargando: false,
        cpe,
        tipo,
        filename: data.filename,
        content: data.content,
      });
    } catch (err) {
      setArchivoVisor({
        cargando: false,
        cpe,
        tipo,
        filename: 'No disponible',
        content:
          err.response?.data?.message ||
          `No se pudo cargar el archivo ${tipo.toUpperCase()}.`,
      });
    }
  };

  const handleCopiarXml = () => {
    if (!archivoVisor.content) return;
    navigator.clipboard.writeText(archivoVisor.content);
    setCopiado(true);
    toast.success('Contenido copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const [modalEmitir, setModalEmitir] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [buscandoDoc, setBuscandoDoc] = useState(false);
  const [nuevoCpe, setNuevoCpe] = useState({
    tipo_comprobante: 'Factura',
    origen_modulo: empresa?.modulos_activos?.[0] || 'general',
    cliente_documento: '',
    cliente_nombre: '',
    cliente_direccion: '',
    concepto: 'SERVICIO / VENTA COMERCIAL',
    cantidad: 1,
    precio_unitario: '',
  });

  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/core/facturacion/comprobantes', {
        params: {
          page,
          limit,
          origen_modulo: filtroModulo !== 'TODOS' ? filtroModulo : undefined,
          tipo_comprobante: filtroTipo !== 'TODOS' ? filtroTipo : undefined,
          estadoSunat: filtroEstado !== 'TODOS' ? filtroEstado : undefined,
          fechaInicio: fechaInicio || undefined,
          fechaFin: fechaFin || undefined,
          search: busqueda.trim() || undefined,
        },
      });
      if (res.data?.success) {
        setComprobantes(res.data.data || []);
        setTotalRegistros(res.data.total ?? (res.data.data?.length || 0));
        setTotalPages(res.data.totalPages || 1);
        if (res.data.resumen) setResumen(res.data.resumen);
      }
    } catch (error) {
      toast.error('Error al cargar comprobantes electrónicos SUNAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, [page, limit, filtroModulo, filtroTipo, filtroEstado, fechaInicio, fechaFin]);

  const handleDescargarLibroContable = async (endpoint, defaultFilename, label) => {
    try {
      setDescargandoReporte(endpoint);
      const res = await api.get(`/core/facturacion/reportes/${endpoint}`, {
        params: {
          periodo: periodoContable,
          origen_modulo: filtroModulo,
        },
        responseType: 'blob',
      });

      const disposition = res.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || defaultFilename;

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`${label} (${periodoContable}) descargado con éxito`);
    } catch (error) {
      toast.error(`Error al exportar ${label}`);
    } finally {
      setDescargandoReporte(null);
    }
  };

  const handleBuscarRucDni = async () => {
    const doc = nuevoCpe.cliente_documento.trim();
    if (doc.length !== 8 && doc.length !== 11) {
      toast.error('Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido');
      return;
    }
    try {
      setBuscandoDoc(true);
      const tipo = doc.length === 11 ? 'ruc' : 'dni';
      const res = await consultarDocumento(tipo, doc);
      const info = res?.data || res;
      if (info) {
        setNuevoCpe((prev) => ({
          ...prev,
          cliente_nombre: info.razon_social || info.nombre_completo || info.nombres || prev.cliente_nombre,
          cliente_direccion: info.direccion || prev.cliente_direccion,
        }));
        toast.success('Datos obtenidos desde padrón SUNAT/RENIEC');
      }
    } catch (err) {
      toast.error('No se encontró el documento, puede ingresar el nombre manualmente');
    } finally {
      setBuscandoDoc(false);
    }
  };

  const handleEmitirDirecto = async (e) => {
    e.preventDefault();
    if (emitiendo) return;

    const precio = parseFloat(nuevoCpe.precio_unitario);
    if (!precio || precio <= 0) {
      toast.error('Ingrese un importe válido mayor a S/ 0.00');
      return;
    }
    if (nuevoCpe.tipo_comprobante === 'Factura' && nuevoCpe.cliente_documento.trim().length !== 11) {
      toast.error('Para emitir Factura Electrónica el RUC debe tener 11 dígitos');
      return;
    }

    try {
      setEmitiendo(true);
      const res = await api.post('/core/facturacion/emitir', {
        tipo_comprobante: nuevoCpe.tipo_comprobante,
        origen_modulo: nuevoCpe.origen_modulo,
        cliente_documento: nuevoCpe.cliente_documento.trim() || '00000000',
        cliente_nombre: nuevoCpe.cliente_nombre.trim() || 'CLIENTE VARIOS',
        cliente_direccion: nuevoCpe.cliente_direccion.trim(),
        items: [
          {
            descripcion: nuevoCpe.concepto.trim() || 'VENTA COMERCIAL',
            cantidad: Number(nuevoCpe.cantidad) || 1,
            precio_unitario: precio,
          },
        ],
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Comprobante UBL 2.1 emitido y aceptado');
        setModalEmitir(false);
        setNuevoCpe((prev) => ({
          ...prev,
          cliente_documento: '',
          cliente_nombre: '',
          cliente_direccion: '',
          precio_unitario: '',
        }));
        cargarComprobantes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al emitir comprobante electrónico');
    } finally {
      setEmitiendo(false);
    }
  };

  const handleEmitirNotaCredito = async (cpe) => {
    if (procesandoId) return;
    const motivo = window.prompt(
      `Emitir Nota de Crédito Electrónica (07) para anular ${cpe.numero_formato}.\nIngrese el motivo de sustento SUNAT:`,
      'Anulación de la operación'
    );
    if (!motivo) return;

    try {
      setProcesandoId(cpe.id);
      const res = await api.post(`/core/facturacion/comprobantes/${cpe.id}/nota-credito`, {
        motivo,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        cargarComprobantes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al emitir Nota de Crédito');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleComunicarBaja = async (cpe) => {
    if (procesandoId) return;
    const motivo = window.prompt(
      `Comunicar Baja ante SUNAT para ${cpe.numero_formato}.\n(Válido dentro de los primeros 7 días calendario):\nIngrese el motivo de baja:`,
      'Error en la emisión del comprobante'
    );
    if (!motivo) return;

    try {
      setProcesandoId(cpe.id);
      const res = await api.post(`/core/facturacion/comprobantes/${cpe.id}/comunicar-baja`, {
        motivo,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Baja comunicada a SUNAT con éxito');
        cargarComprobantes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo comunicar la baja ante SUNAT');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleDescargarArchivo = async (id, tipo, numeroFormato) => {
    if (procesandoId) return;
    try {
      setProcesandoId(`${id}-${tipo}`);
      const res = await api.get(`/core/facturacion/comprobantes/${id}/${tipo}`, {
        responseType: 'blob',
      });
      const mime = tipo === 'pdf' ? 'application/pdf' : 'application/xml';
      const extension = tipo === 'pdf' ? 'pdf' : 'xml';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      if (tipo === 'pdf') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${tipo === 'cdr' ? 'R-' : ''}${numeroFormato}.${extension}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      toast.success(`Archivo ${tipo.toUpperCase()} listo`);
    } catch (error) {
      toast.error(`No se pudo obtener el ${tipo.toUpperCase()}`);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-8">
      {/* Cabecera */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-heading">
                Facturación Electrónica SUNAT (UBL 2.1) & Libros Contables
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Entorno {(empresa?.entorno_sunat || 'beta').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Central unificada de Facturas (01), Boletas (03), Notas de Crédito (07), Formato 14.1, PLE y Kardex 13.1
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalEmitir(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Emitir Comprobante CPE</span>
        </button>
      </div>

      {/* Barra de Exportación Contable Tributaria SUNAT */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-white/10 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
              Centro de Exportación para Contabilidad & Declaración SUNAT
            </h2>
            <p className="text-[11px] text-slate-300">
              Descarga directa en Excel (.CSV) y PLE (.TXT) del período tributario seleccionado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-slate-300">Período:</span>
            <input
              type="month"
              value={periodoContable}
              onChange={(e) => setPeriodoContable(e.target.value)}
              className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={descargandoReporte === 'ventas-14-1-csv'}
            onClick={() =>
              handleDescargarLibroContable(
                'ventas-14-1-csv',
                `FORMATO_14_1_${periodoContable}.csv`,
                'Registro de Ventas 14.1 (Excel CSV)'
              )
            }
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ventas 14.1 (Excel)</span>
          </button>

          <button
            type="button"
            disabled={descargandoReporte === 'ple-14-1-txt'}
            onClick={() =>
              handleDescargarLibroContable(
                'ple-14-1-txt',
                `PLE_140100_${periodoContable}.txt`,
                'Libro Electrónico PLE 14.1 (.TXT)'
              )
            }
            className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PLE 14.1 (.TXT)</span>
          </button>

          <button
            type="button"
            disabled={descargandoReporte === 'kardex-13-1-csv'}
            onClick={() =>
              handleDescargarLibroContable(
                'kardex-13-1-csv',
                `KARDEX_13_1_${periodoContable}.csv`,
                'Kardex Valorizado 13.1 (Excel CSV)'
              )
            }
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Kardex 13.1 (Excel)</span>
          </button>

          <button
            type="button"
            disabled={descargandoReporte === 'arqueos-caja-csv'}
            onClick={() =>
              handleDescargarLibroContable(
                'arqueos-caja-csv',
                `ARQUEOS_CAJA_${periodoContable}.csv`,
                'Libro Caja y Arqueos (Excel CSV)'
              )
            }
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-white/15"
          >
            <Wallet className="w-3.5 h-3.5 text-sky-400" />
            <span>Arqueos Caja</span>
          </button>
        </div>
      </div>

      {/* KPIs Tributarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Facturado Válido</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            S/ {Number(resumen.total_facturado).toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold">
            Gravadas: S/ {Number(resumen.total_gravadas).toFixed(2)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">IGV (18%) Débito Fiscal</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            S/ {Number(resumen.total_igv).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Impuesto General a las Ventas</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CPE Aceptados SUNAT</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {resumen.aceptados} / {resumen.total_comprobantes}
          </div>
          <span className="text-[11px] text-slate-400">Con CDR código 0 y Hash SHA-256</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notas de Crédito (07)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {resumen.notas_credito}
          </div>
          <span className="text-[11px] text-slate-400">Anulaciones electrónicas vinculadas</span>
        </div>
      </div>

      {/* Filtros Servidor */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar serie, RUC o cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none font-mono"
            />
          </div>

          <select
            value={filtroModulo}
            onChange={(e) => {
              setFiltroModulo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="restaurante">Restaurante</option>
            <option value="ferreteria">Ferretería</option>
            <option value="botica">Botica</option>
            <option value="hospedaje">Hospedaje</option>
            <option value="general">Emisión Directa</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="Factura">Facturas (01)</option>
            <option value="Boleta">Boletas (03)</option>
            <option value="NotaCredito">Notas de Crédito (07)</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACEPTADO">ACEPTADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>
        </div>
      </div>

      {/* Tabla de Comprobantes con Paginación Servidor */}
      <div className="rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-white/[0.02]">
                <th className="py-3.5 px-4">Comprobante</th>
                <th className="py-3.5 px-4">Módulo Origen</th>
                <th className="py-3.5 px-4">Cliente / Receptor</th>
                <th className="py-3.5 px-4 text-right">Gravada</th>
                <th className="py-3.5 px-4 text-right">IGV</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Estado SUNAT</th>
                <th className="py-3.5 px-4 text-right">Descargas & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Cargando comprobantes electrónicos UBL 2.1...</span>
                    </div>
                  </td>
                </tr>
              ) : comprobantes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No se encontraron comprobantes electrónicos registrados.
                  </td>
                </tr>
              ) : (
                comprobantes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 dark:text-white font-mono">
                        {c.numero_formato}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.tipo_comprobante} ({c.tipo_documento_codigo}) • {new Date(c.fecha_emision).toLocaleString()}
                      </div>
                      {c.doc_referencia_serie_num && (
                        <div className="text-[10px] text-amber-500 font-bold">
                          Ref: {c.doc_referencia_serie_num}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {c.origen_modulo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {c.cliente_razon_social}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Doc: {c.cliente_num_doc}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      S/ {Number(c.op_gravadas).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      S/ {Number(c.igv).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      S/ {Number(c.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const estadoKey = c.estado_sunat || c.sunat_estado || 'PENDIENTE';
                        const config = ESTADO_SUNAT_CONFIG[estadoKey] || ESTADO_SUNAT_CONFIG.PENDIENTE;
                        const IconoEstado = config.icon;
                        const intentos = Number(c.intentos_envio || 0);

                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${config.badgeClass}`}
                            >
                              <IconoEstado className="w-3 h-3" />
                              {config.label}
                            </span>

                            {/* Barra de progreso de reintentos del Worker si aplica */}
                            {(['CONTINGENCIA_REINTENTAR', 'PROCESANDO_ENVIO', 'ERROR_CRITICO'].includes(estadoKey) || intentos > 0) && (
                              <div className="flex items-center gap-1.5 mt-0.5" title={`Intentos de envío: ${intentos}/${MAX_INTENTOS_WORKER}`}>
                                <div className="w-16 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      intentos >= MAX_INTENTOS_WORKER
                                        ? 'bg-rose-500'
                                        : intentos > 0
                                        ? 'bg-amber-400'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (intentos / MAX_INTENTOS_WORKER) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-400">
                                  {intentos}/{MAX_INTENTOS_WORKER}
                                </span>
                              </div>
                            )}

                            {/* Próximo reintento con backoff */}
                            {estadoKey === 'CONTINGENCIA_REINTENTAR' && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatearProximoReintento(c.proximo_reintento)}</span>
                              </div>
                            )}

                            {/* Error o rechazo de SUNAT si existe */}
                            {c.ultimo_error_sunat && (
                              <p
                                className="text-[10px] text-rose-500 dark:text-rose-400 max-w-[170px] truncate"
                                title={c.ultimo_error_sunat}
                              >
                                {c.codigo_sunat ? `[${c.codigo_sunat}] ` : ''}{c.ultimo_error_sunat}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Botón Forzar Reintento Inmediato a SUNAT */}
                        {(['CONTINGENCIA_REINTENTAR', 'ERROR_CRITICO', 'PENDIENTE', 'RECHAZADO'].includes(c.estado_sunat || c.sunat_estado) || c.sunat_estado === 'RECHAZADO') && (
                          <button
                            type="button"
                            disabled={reintentandoId === c.id}
                            onClick={() => handleForzarReintento(c)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            title="Forzar reenvío inmediato a SUNAT"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{reintentandoId === c.id ? 'Reintentando...' : 'Reintentar'}</span>
                          </button>
                        )}

                        {/* Visor Interactivo XML / CDR */}
                        <button
                          type="button"
                          onClick={() => handleAbrirVisor(c, 'xml')}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                          title="Inspeccionar XML Firmado UBL 2.1 o CDR en Visor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visor</span>
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(procesandoId)}
                          onClick={() => handleDescargarArchivo(c.id, 'pdf', c.numero_formato)}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          title="Visualizar o Descargar PDF Oficial A4 con QR y Hash"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(procesandoId)}
                          onClick={() => handleDescargarArchivo(c.id, 'xml', c.numero_formato)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          title="Descargar XML UBL 2.1 Firmado"
                        >
                          <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>XML</span>
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(procesandoId)}
                          onClick={() => handleDescargarArchivo(c.id, 'cdr', c.numero_formato)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          title="Descargar Constancia de Recepción CDR SUNAT"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>CDR</span>
                        </button>
                        {c.sunat_estado === 'ACEPTADO' && c.tipo_comprobante !== 'NotaCredito' && (
                          <>
                            <button
                              type="button"
                              disabled={Boolean(procesandoId)}
                              onClick={() => handleEmitirNotaCredito(c)}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              title="Emitir Nota de Crédito Electrónica (07)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>NC</span>
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(procesandoId)}
                              onClick={() => handleComunicarBaja(c)}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              title="Comunicar Baja a SUNAT (Primeros 7 días)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Baja</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Servidor */}
        <div className="p-4 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="text-slate-500 dark:text-slate-400 font-semibold">
            Mostrando {comprobantes.length > 0 ? (page - 1) * limit + 1 : 0} a{' '}
            {Math.min(page * limit, totalRegistros)} de {totalRegistros} comprobantes (Página {page} de {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
            >
              <option value={10}>10 / pág</option>
              <option value={20}>20 / pág</option>
              <option value={50}>50 / pág</option>
              <option value={100}>100 / pág</option>
            </select>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Emisión Rápida CPE */}
      {modalEmitir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Emitir Comprobante Electrónico UBL 2.1
                </h2>
              </div>
              <button
                onClick={() => setModalEmitir(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmitirDirecto} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={nuevoCpe.tipo_comprobante}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, tipo_comprobante: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold"
                  >
                    <option value="Factura">Factura Electrónica (F001)</option>
                    <option value="Boleta">Boleta de Venta (B001)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Módulo de Origen
                  </label>
                  <select
                    value={nuevoCpe.origen_modulo}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, origen_modulo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold"
                  >
                    <option value="general">General / Corporativo</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="ferreteria">Ferretería</option>
                    <option value="botica">Botica</option>
                    <option value="hospedaje">Hospedaje</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {nuevoCpe.tipo_comprobante === 'Factura' ? 'Número de RUC (11 dígitos)' : 'DNI / Documento Cliente'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoCpe.cliente_documento}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, cliente_documento: e.target.value })}
                    placeholder={nuevoCpe.tipo_comprobante === 'Factura' ? '20601234567' : '70123456'}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarRucDni}
                    disabled={buscandoDoc}
                    className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                  >
                    {buscandoDoc ? 'Consultando...' : 'Consultar SUNAT'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Razón Social o Nombre Completo
                </label>
                <input
                  type="text"
                  value={nuevoCpe.cliente_nombre}
                  onChange={(e) => setNuevoCpe({ ...nuevoCpe, cliente_nombre: e.target.value })}
                  placeholder="CLIENTE VARIOS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Descripción del Concepto / Ítem
                  </label>
                  <input
                    type="text"
                    value={nuevoCpe.concepto}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, concepto: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Importe Total (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoCpe.precio_unitario}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, precio_unitario: e.target.value })}
                    placeholder="100.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmitir(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emitiendo}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {emitiendo ? 'Firmando XML...' : 'Firmar y Emitir a SUNAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor XML / CDR */}
      <Modal
        isOpen={visorAbierto}
        onClose={() => setVisorAbierto(false)}
        title={
          archivoVisor.cpe
            ? `Auditoría UBL 2.1: ${archivoVisor.cpe.numero_formato || `${archivoVisor.cpe.serie}-${archivoVisor.cpe.correlativo}`}`
            : 'Visor XML / CDR'
        }
        subtitle="Inspección de comprobante electrónico firmado y constancia de recepción de SUNAT"
        icon={Code2}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAbrirVisor(archivoVisor.cpe, 'xml')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  archivoVisor.tipo === 'xml'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                XML Firmado (UBL 2.1)
              </button>
              <button
                type="button"
                onClick={() => handleAbrirVisor(archivoVisor.cpe, 'cdr')}
                disabled={!archivoVisor.cpe?.cdr_filename && !archivoVisor.cpe?.cdr_respuesta}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                  archivoVisor.tipo === 'cdr'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Constancia CDR SUNAT
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarXml}
                disabled={!archivoVisor.content || archivoVisor.cargando}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>
              {archivoVisor.cpe && (
                <button
                  type="button"
                  onClick={() => handleDescargarArchivo(archivoVisor.cpe.id, archivoVisor.tipo, archivoVisor.cpe.numero_formato)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-2xl max-h-[420px] overflow-auto border border-slate-800">
            {archivoVisor.cargando ? (
              <div className="py-8 text-center text-slate-400 font-sans flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Obteniendo archivo desde el almacenamiento del tenant...</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all select-all">
                {archivoVisor.content}
              </pre>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
