import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import {
  FileText,
  Download,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Save,
  X,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Pill,
  Calendar,
  Copy,
  Check,
  Eye,
  EyeOff,
  SlidersHorizontal
} from 'lucide-react';

export default function ObservatorioDigemid() {
  const settings = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'sin_registro' | 'con_stock'

  // Modal para edición de ficha sanitaria DIGEMID
  const [productoEditando, setProductoEditando] = useState(null);
  const [codigoDigemidForm, setCodigoDigemidForm] = useState('');
  const [registroSanitarioForm, setRegistroSanitarioForm] = useState('');
  const [nombreGenericoForm, setNombreGenericoForm] = useState('');
  const [concentracionForm, setConcentracionForm] = useState('');
  const [presentacionForm, setPresentacionForm] = useState('');
  const [mostrarDatosTecnicos, setMostrarDatosTecnicos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modal y estado para descarga segura del Archivo OPM DIGEMID
  const [modalConfirmarDescarga, setModalConfirmarDescarga] = useState(null); // 'txt' | 'csv' | null
  const [descargandoArchivo, setDescargandoArchivo] = useState(false);

  // Parámetros avanzados para el archivo OPM
  const hoyRef = new Date();
  const [opmPeriodoMes, setOpmPeriodoMes] = useState(String(hoyRef.getMonth() + 1).padStart(2, '0'));
  const [opmPeriodoAnio, setOpmPeriodoAnio] = useState(String(hoyRef.getFullYear()));
  const [opmSoloConStock, setOpmSoloConStock] = useState(false);
  const [opmSoloConRegistro, setOpmSoloConRegistro] = useState(false);
  const [opmExcluirPreciosCero, setOpmExcluirPreciosCero] = useState(true);
  const [opmSeparador, setOpmSeparador] = useState('tab'); // 'tab' | 'pipe'
  const [opmIncluirEncabezado, setOpmIncluirEncabezado] = useState(true);
  const [opmMostrarPreview, setOpmMostrarPreview] = useState(false);
  const [opmPreviewData, setOpmPreviewData] = useState(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [copiadoPreview, setCopiadoPreview] = useState(false);

  // Cargar resumen y productos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resResumen, resProductos] = await Promise.all([
        api.get('/digemid/resumen'),
        api.get('/digemid/productos', { params: { busqueda, filtro } })
      ]);

      if (resResumen) {
        setResumen(resResumen);
      }
      if (resProductos) {
        setProductos(resProductos.productos || (Array.isArray(resProductos) ? resProductos : []));
      }
    } catch (err) {
      toast.error('Error al cargar datos del Observatorio DIGEMID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtro]);

  // Búsqueda con debounce simple
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Abrir modal de confirmación antes de descargar
  const abrirModalDescarga = (formato = 'txt') => {
    setModalConfirmarDescarga(formato);
    const d = new Date();
    if (resumen?.periodo?.mes) {
      setOpmPeriodoMes(String(resumen.periodo.mes).padStart(2, '0'));
    } else {
      setOpmPeriodoMes(String(d.getMonth() + 1).padStart(2, '0'));
    }
    if (resumen?.periodo?.anio) {
      setOpmPeriodoAnio(String(resumen.periodo.anio));
    } else {
      setOpmPeriodoAnio(String(d.getFullYear()));
    }
    setOpmMostrarPreview(false);
  };

  const descargarTxtOficial = () => abrirModalDescarga('txt');
  const descargarCsv = () => abrirModalDescarga('csv');

  // Selecciones rápidas de periodo
  const seleccionarMesActual = () => {
    const d = new Date();
    setOpmPeriodoMes(String(d.getMonth() + 1).padStart(2, '0'));
    setOpmPeriodoAnio(String(d.getFullYear()));
  };

  const seleccionarMesAnterior = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setOpmPeriodoMes(String(d.getMonth() + 1).padStart(2, '0'));
    setOpmPeriodoAnio(String(d.getFullYear()));
  };

  const copiarPreviewAlPortapapeles = () => {
    if (!opmPreviewData?.muestraTexto) return;
    navigator.clipboard.writeText(opmPreviewData.muestraTexto);
    setCopiadoPreview(true);
    toast.success('Muestra copiada al portapapeles');
    setTimeout(() => setCopiadoPreview(false), 2000);
  };

  // Recargar previsualización y diagnóstico en vivo
  useEffect(() => {
    if (!modalConfirmarDescarga) return;

    let cancelado = false;
    const fetchPreview = async () => {
      try {
        setCargandoPreview(true);
        const res = await api.get('/digemid/preview-exportacion', {
          params: {
            formato: modalConfirmarDescarga,
            solo_con_stock: opmSoloConStock,
            solo_con_registro: opmSoloConRegistro,
            excluir_precios_cero: opmExcluirPreciosCero,
            separador: opmSeparador,
            incluir_encabezado: opmIncluirEncabezado,
            periodo_mes: opmPeriodoMes,
            periodo_anio: opmPeriodoAnio
          }
        });
        if (!cancelado && res && res.success) {
          setOpmPreviewData(res);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error cargando preview OPM:', err);
        }
      } finally {
        if (!cancelado) setCargandoPreview(false);
      }
    };

    const timer = setTimeout(fetchPreview, 120);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [
    modalConfirmarDescarga,
    opmSoloConStock,
    opmSoloConRegistro,
    opmExcluirPreciosCero,
    opmSeparador,
    opmIncluirEncabezado,
    opmPeriodoMes,
    opmPeriodoAnio
  ]);

  // Ejecución segura de descarga con parámetros y manejo de cancelación sin falsos toasts
  const ejecutarDescarga = async (formato = 'txt') => {
    try {
      setDescargandoArchivo(true);
      const periodoStr = `${opmPeriodoAnio}${opmPeriodoMes}`;
      const defaultFilename = `OPM_DIGEMID_${periodoStr}.${formato}`;

      // Solicitar el archivo binario/texto al backend con todos los parámetros seleccionados
      const resData = await api.get('/digemid/exportar', {
        params: {
          formato,
          solo_con_stock: opmSoloConStock,
          solo_con_registro: opmSoloConRegistro,
          excluir_precios_cero: opmExcluirPreciosCero,
          separador: opmSeparador,
          incluir_encabezado: opmIncluirEncabezado,
          periodo_mes: opmPeriodoMes,
          periodo_anio: opmPeriodoAnio
        },
        responseType: 'blob'
      });

      const blob = resData instanceof Blob ? resData : new Blob([resData], {
        type: formato === 'txt' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8'
      });

      // 1. Navegadores modernos (Chrome, Edge en Windows): Usar File System Access API
      if (typeof window.showSaveFilePicker === 'function') {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [
              formato === 'txt'
                ? {
                    description: 'Archivo Oficial OPM DIGEMID (*.txt)',
                    accept: { 'text/plain': ['.txt'] }
                  }
                : {
                    description: 'Padrón de Precios y Stock (*.csv)',
                    accept: { 'text/csv': ['.csv'] }
                  }
            ]
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          toast.success(`Archivo OPM (.${formato}) guardado exitosamente.`);
          setModalConfirmarDescarga(null);
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') {
            return;
          }
          console.error('Error al guardar archivo:', pickerErr);
          toast.error('No se pudo guardar el archivo en la ubicación seleccionada.');
        }
      } else {
        // 2. Fallback estándar para navegadores sin showSaveFilePicker
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', defaultFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        toast.success(`Archivo OPM (.${formato}) descargado exitosamente.`);
        setModalConfirmarDescarga(null);
      }
    } catch (err) {
      console.error('Error generando archivo OPM:', err);
      toast.error('Error al generar el archivo del Observatorio DIGEMID.');
    } finally {
      setDescargandoArchivo(false);
    }
  };

  // Atajo de teclado: Cerrar modales con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (productoEditando && !guardando) setProductoEditando(null);
        if (modalConfirmarDescarga && !descargandoArchivo) setModalConfirmarDescarga(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productoEditando, modalConfirmarDescarga, guardando, descargandoArchivo]);

  // Formateador y validador de Registro Sanitario DIGEMID
  const handleRegistroSanitarioChange = (val) => {
    setRegistroSanitarioForm(val.toUpperCase().replace(/\s+/g, ' '));
  };

  const aplicarPrefijoRS = (prefijo) => {
    const limpio = registroSanitarioForm.replace(/^(EN|EE|N|P|DM|QN|QE|BE|BN)-?/i, '').trim();
    setRegistroSanitarioForm(`${prefijo}-${limpio}`);
  };

  const esFormatoValidoRS = (rs) => {
    if (!rs || !rs.trim()) return false;
    return /^(EN|EE|N|P|DM|QN|QE|BE|BN)-\d+/i.test(rs.trim());
  };

  const consultarRegistroDigemid = () => {
    if (!productoEditando) return;
    const termino = (productoEditando.nombre_generico || productoEditando.nombre_comercial || '').trim();
    const url = `https://www.google.com/search?q=site%3Adigemid.minsa.gob.pe+registro+sanitario+${encodeURIComponent(termino)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Abrir editor de producto
  const abrirEditor = (producto) => {
    setProductoEditando(producto);
    setCodigoDigemidForm(producto.codigo_digemid || '');
    setRegistroSanitarioForm(producto.registro_sanitario || '');
    setNombreGenericoForm(producto.nombre_generico || '');
    setConcentracionForm(producto.concentracion || '');
    setPresentacionForm(producto.presentacion || '');
    setMostrarDatosTecnicos(!producto.nombre_generico || !producto.presentacion);
  };

  // Guardar códigos sanitarios y ficha técnica actualizados
  const guardarCodigos = async (e) => {
    e.preventDefault();
    if (!productoEditando) return;

    try {
      setGuardando(true);
      const res = await api.patch(`/digemid/producto/${productoEditando.id}`, {
        codigo_digemid: codigoDigemidForm,
        registro_sanitario: registroSanitarioForm,
        nombre_generico: nombreGenericoForm,
        concentracion: concentracionForm,
        presentacion: presentacionForm
      });

      if (res && res.success) {
        toast.success('Ficha sanitaria y códigos DIGEMID guardados con éxito.');
        setProductoEditando(null);
        cargarDatos();
      }
    } catch (err) {
      toast.error('Error al guardar los códigos del medicamento.');
    } finally {
      setGuardando(false);
    }
  };

  // Extracción segura y normalizada de estadísticas DIGEMID (evita TypeError si alguna propiedad viene ausente)
  const stats = resumen?.estadisticas || resumen?.metricas || {};
  const totalCatalogo = stats.totalCatalogo ?? stats.totalMedicamentos ?? 0;
  const conRegistroSanitario = stats.conRegistroSanitario ?? 0;
  const sinRegistroSanitario = stats.sinRegistroSanitario ?? 0;
  const porcentajeCompletitud = stats.porcentajeCompletitud ?? stats.porcentajeCumplimiento ?? 0;
  const genericosDCI = stats.genericosDCI ?? 0;
  const periodoMes = resumen?.periodo?.mes ? String(resumen.periodo.mes).padStart(2, '0') : '--';
  const periodoAnio = resumen?.periodo?.anio || '----';
  const codigoEstablecimiento = resumen?.establecimiento?.codigoDigemid || 'Por configurar';

  return (
    <div className="space-y-6">
      {/* ─── ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sora">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Observatorio de Precios DIGEMID (OPM)
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                Ley N° 29459
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              R.D. N° 002-2020-DIGEMID-DG-MINSA • Generador del reporte mensual oficial de precios y existencias.
            </p>
          </div>
        </div>

        {/* Acciones principales de exportación */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => abrirModalDescarga('csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sora"
            title="Descargar padrón en Excel (.csv)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Padrón (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => abrirModalDescarga('txt')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer font-sora"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Archivo OPM (.txt Oficial)</span>
          </button>
        </div>
      </div>

      {/* ─── RESUMEN DE CUMPLIMIENTO SANITARIO (DISEÑO Y DIMENSIONES DASHBOARD) ─── */}
      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
          {/* Tarjeta 1: Total Catálogo */}
          <div
            onClick={() => setFiltro('todos')}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
              filtro === 'todos'
                ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
            }`}
            title="Ver catálogo completo de fármacos"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                  Catálogo Total
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                  <Pill className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-1 sm:my-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                  {totalCatalogo}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                Fármacos registrados
              </span>
              <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
                filtro === 'todos'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
              }`}>
                {filtro === 'todos' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                Activos
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Con Registro Sanitario */}
          <div
            onClick={() => setFiltro(filtro === 'con_registro' ? 'todos' : 'con_registro')}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
              filtro === 'con_registro' || filtro === 'sin_registro'
                ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-xs shadow-indigo-500/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
            }`}
            title="Filtrar por fármacos con Registro Sanitario DIGEMID"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/12 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-sora truncate min-w-0 transition-colors">
                  Con Reg. Sanitario
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-1 sm:my-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 font-sora tracking-tight truncate font-mono">
                  {conRegistroSanitario}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                {sinRegistroSanitario > 0 ? `${sinRegistroSanitario} sin código` : '100% Identificados'}
              </span>
              <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
                filtro === 'con_registro'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50'
              }`}>
                {filtro === 'con_registro' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />}
                {porcentajeCompletitud}%
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Genéricos DCI (Ley 32033) */}
          <div
            onClick={() => setFiltro(filtro === 'genericos_dci' ? 'todos' : 'genericos_dci')}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
              filtro === 'genericos_dci'
                ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/20 shadow-xs shadow-teal-500/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
            }`}
            title="Filtrar medicamentos genéricos en DCI (Ley 32033)"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/12 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-400 font-sora truncate min-w-0 transition-colors">
                  Genéricos en DCI
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-1 sm:my-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 font-sora tracking-tight truncate font-mono">
                  {genericosDCI}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                Sustitución activa
              </span>
              <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
                filtro === 'genericos_dci'
                  ? 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50'
              }`}>
                {filtro === 'genericos_dci' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />}
                Ley 32033
              </span>
            </div>
          </div>

          {/* Tarjeta 4: Estado Mensual OPM */}
          <div
            onClick={() => setFiltro(filtro === 'con_stock' ? 'todos' : 'con_stock')}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
              filtro === 'con_stock'
                ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
            }`}
            title="Filtrar por productos con existencias en botica"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                  Estado Mensual OPM
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-1 sm:my-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                  {periodoMes}/{periodoAnio}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
              <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate font-mono">
                Cód: {codigoEstablecimiento}
              </span>
              <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora flex items-center gap-1 ${
                filtro === 'con_stock'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {filtro === 'con_stock' ? 'Con Stock' : 'Vigente'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── GUÍA DE CARGA A DIGEMID EN 3 PASOS ─── */}
      <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
              ¿Cómo presentar este reporte mensual ante DIGEMID?
            </h3>
            <ol className="text-xs text-indigo-900/90 font-medium mt-1 space-y-0.5 list-decimal list-inside">
              <li>Descarga el archivo presionando el botón azul <strong>"Descargar Archivo OPM (.txt Oficial)"</strong>.</li>
              <li>Ingresa a la plataforma oficial: <a href="https://observatorio.digemid.minsa.gob.pe/" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-700 hover:text-indigo-950 inline-flex items-center gap-0.5">observatorio.digemid.minsa.gob.pe <ExternalLink className="w-3 h-3 inline" /></a> con tus credenciales.</li>
              <li>En el menú <em>"Carga de Precios"</em>, sube el archivo .txt descargado y guarda tu constancia digital de presentación.</li>
            </ol>
          </div>
        </div>

        <a
          href="https://observatorio.digemid.minsa.gob.pe/"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <span>Ir a Portal DIGEMID</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ─── TABLA INTERACTIVA DEL CATÁLOGO PARA EL OBSERVATORIO ─── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por fármaco, DCI o registro..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-sora"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Filtrar:</span>
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 gap-0.5">
              <button
                type="button"
                onClick={() => setFiltro('todos')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sora ${
                  filtro === 'todos' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Todos ({totalCatalogo})
              </button>
              <button
                type="button"
                onClick={() => setFiltro('con_registro')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sora ${
                  filtro === 'con_registro' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Con Registro ({conRegistroSanitario})
              </button>
              <button
                type="button"
                onClick={() => setFiltro('sin_registro')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sora ${
                  filtro === 'sin_registro' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Sin Registro ({sinRegistroSanitario})
              </button>
              <button
                type="button"
                onClick={() => setFiltro('genericos_dci')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sora flex items-center gap-1 ${
                  filtro === 'genericos_dci' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>Genéricos DCI</span>
                <span className="text-[10px] opacity-80">({genericosDCI})</span>
              </button>
              <button
                type="button"
                onClick={() => setFiltro('con_stock')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sora ${
                  filtro === 'con_stock' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Con Stock
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[10.5px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Medicamento / Marca</th>
                <th className="py-3 px-4">Principio Activo (DCI)</th>
                <th className="py-3 px-4">Registro Sanitario</th>
                <th className="py-3 px-4">Cód. DIGEMID</th>
                <th className="py-3 px-4">Precio Caja</th>
                <th className="py-3 px-4">Precio Unidad</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">
                    Cargando productos para el reporte DIGEMID...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-sm">No se encontraron productos</p>
                    <p className="text-slate-400 text-xs mt-1">Prueba con otro término de búsqueda o cambia de filtro.</p>
                  </td>
                </tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{prod.nombre_comercial}</p>
                        <p className="text-[10.5px] text-slate-400 font-medium">{prod.presentacion || '-'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {prod.nombre_generico || <span className="text-slate-400 italic">No especificado</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {prod.registro_sanitario ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {prod.registro_sanitario}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 text-[11px]">
                      {prod.codigo_digemid || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900">
                      S/ {parseFloat(prod.precio_venta || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {prod.fraccionable ? `S/ ${parseFloat(prod.precio_fraccion || 0).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold text-xs ${
                        parseFloat(prod.stock_cajas) > 0 ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {parseFloat(prod.stock_cajas || 0).toFixed(0)} cjs
                        {parseInt(prod.stock_fraccion || 0) > 0 && ` + ${prod.stock_fraccion} u.`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => abrirEditor(prod)}
                        className="p-1.5 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                        title="Editar Registro Sanitario o Código DIGEMID"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL DE EDICIÓN RÁPIDA DE CÓDIGOS SANITARIOS ─── */}
      {productoEditando && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => !guardando && setProductoEditando(null)}
          className="fixed inset-0 z-[9999] bg-slate-900/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[90vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera Fija */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Ficha Sanitaria DIGEMID
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                      OPM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    Asignación de códigos para el Observatorio de Precios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductoEditando(null)}
                disabled={guardando}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Formulario con cuerpo scrolleable y pie fijo */}
            <form onSubmit={guardarCodigos} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Contenido desplazable interno */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-modal-scroll">
                {/* Tarjeta resumen del producto con botón de consulta externa */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Fármaco seleccionado
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                      {productoEditando.nombre_comercial}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      Laboratorio: <span className="font-semibold text-slate-700 dark:text-slate-300">{productoEditando.laboratorio || 'No especificado'}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={consultarRegistroDigemid}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                    title="Buscar en Google por documentos oficiales de DIGEMID"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buscar en DIGEMID</span>
                  </button>
                </div>

                {/* Campo: Registro Sanitario */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Registro Sanitario DIGEMID</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {registroSanitarioForm && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        esFormatoValidoRS(registroSanitarioForm)
                          ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
                          : 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
                      }`}>
                        {esFormatoValidoRS(registroSanitarioForm) ? '✓ Formato Válido' : 'Prefijo sugerido: EN- o EE-'}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={registroSanitarioForm}
                    onChange={(e) => handleRegistroSanitarioChange(e.target.value)}
                    placeholder="ej. EN-01234 o EE-04589"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wide focus:outline-none focus:border-indigo-500 uppercase transition-colors"
                  />

                  {/* Accesos rápidos para prefijos estándar peruanos */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium mr-0.5">Prefijos comunes:</span>
                    {[
                      { label: 'EN (Nacional)', val: 'EN' },
                      { label: 'EE (Extranjero)', val: 'EE' },
                      { label: 'N (Natural)', val: 'N' },
                      { label: 'DM (Dispositivo)', val: 'DM' }
                    ].map((pref) => (
                      <button
                        key={pref.val}
                        type="button"
                        onClick={() => aplicarPrefijoRS(pref.val)}
                        className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {pref.val}-
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo: Código de Catálogo DIGEMID OPM */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Código de Catálogo DIGEMID OPM (Opcional)
                  </label>
                  <input
                    type="text"
                    value={codigoDigemidForm}
                    onChange={(e) => setCodigoDigemidForm(e.target.value.trim())}
                    placeholder="ej. 00014589"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                    Código de 6 a 8 dígitos asignado en el Observatorio DIGEMID.
                  </span>
                </div>

                {/* Sección desplegable: Datos Técnicos (DCI, Concentración, Presentación) */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMostrarDatosTecnicos(!mostrarDatosTecnicos)}
                    className="w-full flex items-center justify-between py-1.5 text-xs font-black text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Datos Técnicos (DCI, Concentración y Forma)</span>
                    </span>
                    <span className="text-[10.5px] font-bold">
                      {mostrarDatosTecnicos ? 'Ocultar ▲' : 'Completar ▼'}
                    </span>
                  </button>

                  {mostrarDatosTecnicos && (
                    <div className="mt-2 space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Principio Activo / Nombre Genérico (DCI)
                        </label>
                        <input
                          type="text"
                          value={nombreGenericoForm}
                          onChange={(e) => setNombreGenericoForm(e.target.value)}
                          placeholder="ej. PARACETAMOL, AMOXICILINA"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Concentración
                          </label>
                          <input
                            type="text"
                            value={concentracionForm}
                            onChange={(e) => setConcentracionForm(e.target.value)}
                            placeholder="ej. 500 mg, 120mg/5ml"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Presentación / Forma
                          </label>
                          <input
                            type="text"
                            value={presentacionForm}
                            onChange={(e) => setPresentacionForm(e.target.value)}
                            placeholder="ej. Tableta, Jarabe"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de modal fijo (botones siempre accesibles y redondeados con el card) */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setProductoEditando(null)}
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Ficha Sanitaria</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL AVANZADO DE GENERACIÓN Y DESCARGA OFICIAL OPM DIGEMID ─── */}
      {modalConfirmarDescarga && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => !descargandoArchivo && setModalConfirmarDescarga(null)}
          className="fixed inset-0 z-[9999] bg-slate-900/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera Fija */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {modalConfirmarDescarga === 'txt'
                        ? 'Generar Archivo Oficial OPM (.txt)'
                        : 'Exportar Padrón de Precios (.csv)'}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                      DIGEMID
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {modalConfirmarDescarga === 'txt'
                      ? 'Parámetros técnicos y validación previa antes de cargar al portal MINSA'
                      : 'Resumen consolidado para control interno, auditoría y cruce en Excel'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConfirmarDescarga(null)}
                disabled={descargandoArchivo}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Cuerpo con scroll interno */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-modal-scroll">
              {/* 1. Selector de Periodo a Declarar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Periodo de Declaración Mensual</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={seleccionarMesActual}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
                    >
                      Mes actual
                    </button>
                    <button
                      type="button"
                      onClick={seleccionarMesAnterior}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      Mes anterior
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Mes
                    </label>
                    <select
                      value={opmPeriodoMes}
                      onChange={(e) => setOpmPeriodoMes(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="01">01 - Enero</option>
                      <option value="02">02 - Febrero</option>
                      <option value="03">03 - Marzo</option>
                      <option value="04">04 - Abril</option>
                      <option value="05">05 - Mayo</option>
                      <option value="06">06 - Junio</option>
                      <option value="07">07 - Julio</option>
                      <option value="08">08 - Agosto</option>
                      <option value="09">09 - Setiembre</option>
                      <option value="10">10 - Octubre</option>
                      <option value="11">11 - Noviembre</option>
                      <option value="12">12 - Diciembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Año
                    </label>
                    <select
                      value={opmPeriodoAnio}
                      onChange={(e) => setOpmPeriodoAnio(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Diagnóstico Previo en Vivo (Auditoría Técnica) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Diagnóstico de Conformidad DIGEMID</span>
                  </span>
                  {cargandoPreview ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Validando...</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      Cód. Estab: <strong className="text-slate-900 dark:text-slate-100">{opmPreviewData?.codEstablecimiento || codigoEstablecimiento}</strong>
                    </span>
                  )}
                </div>

                {/* Métricas clave del lote */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      En el Archivo
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {opmPreviewData?.totalFilas ?? totalCatalogo}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">
                      de {opmPreviewData?.totalCatalogo ?? totalCatalogo} fármacos
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Sin Reg. Sanitario
                    </span>
                    <span className={`text-base font-black font-mono ${
                      (opmPreviewData?.sinRegistroEnLote ?? sinRegistroSanitario) > 0
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {opmPreviewData?.sinRegistroEnLote ?? sinRegistroSanitario}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">
                      {(opmPreviewData?.sinRegistroEnLote ?? sinRegistroSanitario) > 0 ? 'Con observaciones' : 'Conforme'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Precios en S/ 0
                    </span>
                    <span className={`text-base font-black font-mono ${
                      (opmPreviewData?.preciosCeroEnLote ?? 0) > 0
                        ? 'text-rose-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {opmPreviewData?.preciosCeroEnLote ?? 0}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">
                      {(opmPreviewData?.preciosCeroEnLote ?? 0) > 0 ? 'Rechazo seguro' : 'Válidos'}
                    </span>
                  </div>
                </div>

                {/* Alertas preventivas contextuales */}
                {(opmPreviewData?.preciosCeroEnLote ?? 0) > 0 && !opmExcluirPreciosCero && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>
                      <strong>Alerta de rechazo:</strong> Hay productos con precio S/ 0.00 incluidos. DIGEMID no admite ítems sin precio declarado. Activa la opción <em>Excluir precios en S/ 0.00</em>.
                    </span>
                  </div>
                )}

                {(opmPreviewData?.sinRegistroEnLote ?? sinRegistroSanitario) > 0 && !opmSoloConRegistro && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                      Hay <strong>{opmPreviewData?.sinRegistroEnLote ?? sinRegistroSanitario} productos sin Registro Sanitario</strong>. Si tu DIRIS/DIGEMID exige que todo el lote tenga código oficial, activa <em>Excluir sin Registro Sanitario</em>.
                    </span>
                  </div>
                )}

                {(opmPreviewData?.codEstablecimiento === 'ESTAB_001' || !opmPreviewData?.codEstablecimiento) && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2 text-indigo-800 dark:text-indigo-300 text-[11px] leading-relaxed">
                    <Building2 className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                    <span>
                      Código de establecimiento por defecto (<strong>{opmPreviewData?.codEstablecimiento || 'ESTAB_001'}</strong>). Asegúrate de registrar el código oficial otorgado por DIGEMID en el módulo de Configuración.
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Filtros y Reglas de Inclusión */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Filtros y Reglas de Inclusión del Lote</span>
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={opmSoloConStock}
                      onChange={(e) => setOpmSoloConStock(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        Solo incluir productos con Stock Disponible (&gt; 0)
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Omite productos en 0 unidades para evitar observaciones sobre disponibilidad física.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={opmSoloConRegistro}
                      onChange={(e) => setOpmSoloConRegistro(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        Excluir productos sin Registro Sanitario ni Código DIGEMID
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Garantiza que el validador oficial de DIGEMID no rechace el archivo por filas no homologadas.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={opmExcluirPreciosCero}
                      onChange={(e) => setOpmExcluirPreciosCero(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        Excluir productos con precio en S/ 0.00 <span className="text-emerald-500 font-bold text-[10px] uppercase">(Recomendado)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Filtra automáticamente artículos de prueba o sin precio fijado que bloquean la carga oficial.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Formato Técnico (Delimitador y Cabeceras para TXT) */}
              {modalConfirmarDescarga === 'txt' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    Formato y Delimitador de Columnas
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpmSeparador('tab')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        opmSeparador === 'tab'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Tabulación (\t) • Estándar Oficial
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpmSeparador('pipe')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        opmSeparador === 'pipe'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Pleca (|) • Alternativo
                    </button>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={opmIncluirEncabezado}
                      onChange={(e) => setOpmIncluirEncabezado(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold">
                      Incluir fila de encabezado oficial (COD_ESTAB, COD_PROD...)
                    </span>
                  </label>
                </div>
              )}

              {/* 5. Vista Previa en Vivo y Enlace al Portal OPM */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpmMostrarPreview(!opmMostrarPreview)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {opmMostrarPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar vista previa del archivo</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver vista previa del archivo (primeras líneas)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="http://observatorio.digemid.minsa.gob.pe/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    title="Acceder a la plataforma web oficial de DIGEMID"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Portal OPM DIGEMID</span>
                  </a>
                </div>

                {opmMostrarPreview && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <span className="font-mono text-emerald-400 font-bold">
                        OPM_DIGEMID_{opmPeriodoAnio}{opmPeriodoMes}.{modalConfirmarDescarga}
                      </span>
                      <button
                        type="button"
                        onClick={copiarPreviewAlPortapapeles}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        {copiadoPreview ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar muestra</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="font-mono text-[10.5px] text-emerald-300 leading-relaxed overflow-x-auto p-2 bg-slate-950/60 rounded-xl select-all max-h-36 custom-modal-scroll">
                      {opmPreviewData?.muestraTexto || 'Cargando previsualización del archivo...'}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Pie de modal fijo */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Archivo de salida
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                  OPM_DIGEMID_{opmPeriodoAnio}{opmPeriodoMes}.{modalConfirmarDescarga}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setModalConfirmarDescarga(null)}
                  disabled={descargandoArchivo}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarDescarga(modalConfirmarDescarga)}
                  disabled={descargandoArchivo}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {descargandoArchivo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando archivo...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {modalConfirmarDescarga === 'txt'
                          ? `Descargar TXT (${opmPreviewData?.totalFilas ?? totalCatalogo} productos)`
                          : `Descargar CSV (${opmPreviewData?.totalFilas ?? totalCatalogo} productos)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
  );
}
