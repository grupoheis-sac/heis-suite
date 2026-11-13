import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import { useSettingsStore } from '@heis/core';
import {
  Thermometer,
  Droplets,
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  Printer,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Info,
  UserCheck,
  Sparkles,
  RefreshCw,
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import DropdownPill from './components/DropdownPill';

const TURNOS_CONTROL = [
  { value: 'Mañana', label: 'Mañana', subtitle: '08:00 - 12:00' },
  { value: 'Tarde', label: 'Tarde', subtitle: '14:00 - 18:00' }
];

export default function TemperaturaHumedad() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const fechaHoy = new Date();
  const [mes, setMes] = useState(fechaHoy.getMonth() + 1);
  const [anio, setAnio] = useState(fechaHoy.getFullYear());
  const [idSucursal, setIdSucursal] = useState('todas');
  const [sucursales, setSucursales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ total: 0, conformes: 0, conAlerta: 0, porcentajeConformidad: 100 });
  const [umbrales, setUmbrales] = useState({
    tempAmbienteMin: 15.0,
    tempAmbienteMax: 25.0,
    humedadRelativaMax: 65.0,
    tempRefrigeracionMin: 2.0,
    tempRefrigeracionMax: 8.0
  });

  const [estadoHoy, setEstadoHoy] = useState({
    mañana: { registrado: false, datos: null },
    tarde: { registrado: false, datos: null },
    turnoRecomendado: 'Mañana'
  });

  // Modal de registro y edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idRegistroEditar, setIdRegistroEditar] = useState(null);
  const [formulario, setFormulario] = useState({
    id: null,
    id_sucursal: '',
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Mañana',
    hora: new Date().toTimeString().slice(0, 5),
    temp_ambiente: '21.5',
    humedad_relativa: '58.0',
    temp_refrigeracion: '',
    tiene_refrigeracion: false,
    observaciones: '',
    accion_correctiva: ''
  });

  // Cargar lista de sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await api.get('/sucursales');
        if (res && res.success && res.sucursales) {
          setSucursales(res.sucursales);
          if (res.sucursales.length > 0 && !formulario.id_sucursal) {
            setFormulario((prev) => ({ ...prev, id_sucursal: res.sucursales[0].id }));
          }
        }
      } catch (err) {
        // En caso de que no haya multi-sucursal activa, ignorar
      }
    };
    fetchSucursales();
  }, []);

  // Cargar registros del periodo y estado de hoy
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = { mes, anio };
      if (idSucursal && idSucursal !== 'todas') params.id_sucursal = idSucursal;

      const [resRegistros, resHoy] = await Promise.all([
        api.get('/temperatura', { params }),
        api.get('/temperatura/hoy', { params: idSucursal !== 'todas' ? { id_sucursal: idSucursal } : {} })
      ]);

      if (resRegistros && resRegistros.success) {
        setRegistros(resRegistros.registros || []);
        if (resRegistros.estadisticas) setEstadisticas(resRegistros.estadisticas);
        if (resRegistros.umbrales) setUmbrales(resRegistros.umbrales);
      }

      if (resHoy && resHoy.success) {
        setEstadoHoy(resHoy);
      }
    } catch (err) {
      toast.error('Error al cargar registros de temperatura y humedad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mes, anio, idSucursal]);

  // Abrir modal con valores recomendados según la hora del día (Nuevo registro)
  const abrirModalNuevo = (turnoForzado = null) => {
    setModoEdicion(false);
    setIdRegistroEditar(null);
    const horaActual = new Date();
    const horaStr = horaActual.toTimeString().slice(0, 5);
    const turnoAuto = turnoForzado || (horaActual.getHours() < 13 ? 'Mañana' : 'Tarde');

    setFormulario({
      id: null,
      id_sucursal: idSucursal !== 'todas' ? idSucursal : (sucursales[0]?.id || ''),
      fecha: new Date().toISOString().split('T')[0],
      turno: turnoAuto,
      hora: horaStr,
      temp_ambiente: '21.0',
      humedad_relativa: '55.0',
      temp_refrigeracion: '',
      tiene_refrigeracion: false,
      observaciones: '',
      accion_correctiva: ''
    });
    setModalAbierto(true);
  };

  // Abrir modal en modo edición para corregir o complementar una toma existente
  const abrirModalEditar = (reg) => {
    setModoEdicion(true);
    setIdRegistroEditar(reg.id);
    setFormulario({
      id: reg.id,
      id_sucursal: reg.id_sucursal || (sucursales[0]?.id || ''),
      fecha: reg.fecha,
      turno: reg.turno,
      hora: reg.hora,
      temp_ambiente: String(reg.temp_ambiente),
      humedad_relativa: String(reg.humedad_relativa),
      temp_refrigeracion: reg.temp_refrigeracion !== null && reg.temp_refrigeracion !== undefined ? String(reg.temp_refrigeracion) : '',
      tiene_refrigeracion: reg.temp_refrigeracion !== null && reg.temp_refrigeracion !== undefined && reg.temp_refrigeracion !== '',
      observaciones: reg.observaciones || '',
      accion_correctiva: reg.accion_correctiva || ''
    });
    setModalAbierto(true);
  };

  // Eliminar lectura previa confirmación
  const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta lectura de temperatura y humedad? Esta acción quedará registrada.')) {
      return;
    }
    try {
      const res = await api.delete(`/temperatura/${id}`);
      if (res && res.success) {
        toast.success(res.message || 'Lectura eliminada correctamente.');
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar la lectura.');
    }
  };

  // Sincronizar hora al segundo actual
  const fijarHoraActual = () => {
    const ahora = new Date().toTimeString().slice(0, 5);
    setFormulario((prev) => ({ ...prev, hora: ahora }));
    toast.success(`Hora fijada: ${ahora}`, { icon: '⏰', duration: 1500 });
  };

  // Autocompletar valores estándar de rutina (21.5°C y 56% HR)
  const cargarValoresOptimos = () => {
    setFormulario((prev) => ({
      ...prev,
      temp_ambiente: '21.5',
      humedad_relativa: '56.0',
      temp_refrigeracion: prev.tiene_refrigeracion ? '4.5' : ''
    }));
    toast.success('Valores estándar de referencia cargados (21.5°C / 56% HR).', { icon: '✨', duration: 2000 });
  };

  // Validación reactiva de rangos en el modal
  const evaluacionEnVivo = useMemo(() => {
    const tAmb = parseFloat(formulario.temp_ambiente);
    const hRel = parseFloat(formulario.humedad_relativa);
    const tRef = formulario.tiene_refrigeracion && formulario.temp_refrigeracion !== '' ? parseFloat(formulario.temp_refrigeracion) : null;

    let advertencias = [];
    if (!isNaN(tAmb)) {
      if (tAmb > umbrales.tempAmbienteMax) advertencias.push(`Temperatura ambiente superior al máximo (${tAmb}°C > ${umbrales.tempAmbienteMax}°C)`);
      if (tAmb < umbrales.tempAmbienteMin) advertencias.push(`Temperatura ambiente inferior al mínimo (${tAmb}°C < ${umbrales.tempAmbienteMin}°C)`);
    }
    if (!isNaN(hRel)) {
      if (hRel > umbrales.humedadRelativaMax) advertencias.push(`Humedad relativa superior al límite (${hRel}% > ${umbrales.humedadRelativaMax}%)`);
    }
    if (tRef !== null && !isNaN(tRef)) {
      if (tRef < umbrales.tempRefrigeracionMin || tRef > umbrales.tempRefrigeracionMax) {
        advertencias.push(`Cadena de frío en riesgo (${tRef}°C fuera de 2°C a 8°C)`);
      }
    }

    return {
      conforme: advertencias.length === 0,
      advertencias
    };
  }, [formulario, umbrales]);

  // Guardar lectura
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const payload = {
        ...formulario,
        temp_refrigeracion: formulario.tiene_refrigeracion && formulario.temp_refrigeracion !== '' ? formulario.temp_refrigeracion : null
      };

      const res = await api.post('/temperatura', payload);
      if (res && res.success) {
        toast.success(res.message || (modoEdicion ? 'Lectura actualizada con éxito.' : 'Lectura registrada correctamente.'));
        if (res.alerta_generada) {
          toast((t) => (
            <span className="text-amber-700 font-bold text-xs">
              ⚠️ Lectura registrada con observación sanitaria por superar límites BPA.
            </span>
          ), { icon: '⚠️', duration: 5000 });
        }
        setModalAbierto(false);
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar la lectura.');
    } finally {
      setGuardando(false);
    }
  };

  // Imprimir formato mensual oficial BPA para DIRIS/DIGEMID
  const imprimirReporteBPA = async () => {
    try {
      toast.loading('Generando hoja de control BPA...', { id: 'imprimir-bpa' });
      const params = { mes, anio };
      if (idSucursal && idSucursal !== 'todas') params.id_sucursal = idSucursal;

      const res = await api.get('/temperatura/reporte-mensual', { params });
      toast.dismiss('imprimir-bpa');

      if (!res || !res.success) {
        toast.error('No se pudo generar el reporte.');
        return;
      }

      const { institucional, dias, umbrales: umb } = res;
      const nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      // Ventana de impresión limpia con formato exigido por inspectores DIRIS
      const ventana = window.open('', '_blank');
      ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Control de Temperatura y Humedad - ${institucional.establecimiento} - ${nombresMeses[mes]} ${anio}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
            .header { border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 14px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 10px; color: #64748b; font-weight: bold; margin-top: 2px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 8px; background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; }
            .info-item { font-size: 9.5px; }
            .info-label { font-weight: bold; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: center; font-size: 9px; }
            th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
            .sub-th { font-size: 8px; background: #e2e8f0; }
            .alerta { background: #fee2e2; color: #991b1b; font-weight: bold; }
            .ok { color: #0f766e; }
            .footer-firmas { margin-top: 35px; display: flex; justify-content: space-around; text-align: center; }
            .firma-box { width: 220px; border-top: 1px solid #334155; padding-top: 5px; font-size: 9px; }
            .norma { margin-top: 15px; font-size: 8px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">REGISTRO DE CONTROL DE TEMPERATURA Y HUMEDAD RELATIVA</p>
            <p class="subtitle">BUENAS PRÁCTICAS DE ALMACENAMIENTO (BPA) • R.M. N° 554-2022/MINSA / DIGEMID</p>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">ESTABLECIMIENTO:</span> ${institucional.establecimiento}</div>
              <div class="info-item"><span class="info-label">RUC:</span> ${institucional.ruc}</div>
              <div class="info-item"><span class="info-label">DIRECCIÓN:</span> ${institucional.direccion}</div>
              <div class="info-item"><span class="info-label">PERÍODO:</span> ${nombresMeses[mes]} ${anio}</div>
              <div class="info-item"><span class="info-label">DIRECTOR TÉCNICO:</span> ${institucional.directorTecnico} (${institucional.colegiatura})</div>
              <div class="info-item"><span class="info-label">LÍMITES BPA:</span> Amb: ${umb.tempAmbienteMin}°C - ${umb.tempAmbienteMax}°C | Humedad: &le; ${umb.humedadRelativaMax}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 25px;">DÍA</th>
                <th colspan="4" style="background: #e6fffa;">TURNO MAÑANA (08:00 - 12:00)</th>
                <th colspan="4" style="background: #f0fdf4;">TURNO TARDE (14:00 - 18:00)</th>
                <th rowspan="2">OBSERVACIONES / ACCIONES CORRECTIVAS</th>
              </tr>
              <tr class="sub-th">
                <th>HORA</th>
                <th>T° AMB (°C)</th>
                <th>HUM (%)</th>
                <th>RESPONSABLE</th>
                <th>HORA</th>
                <th>T° AMB (°C)</th>
                <th>HUM (%)</th>
                <th>RESPONSABLE</th>
              </tr>
            </thead>
            <tbody>
              ${dias.map(d => {
                const m = d.manana;
                const t = d.tarde;
                const obs = [m?.accion_correctiva, t?.accion_correctiva, m?.observaciones, t?.observaciones].filter(Boolean).join('; ');
                return `
                  <tr>
                    <td style="font-weight: bold; background: #f8fafc;">${d.dia}</td>
                    <td>${m ? m.hora : '-'}</td>
                    <td class="${m && m.alerta ? 'alerta' : 'ok'}">${m ? m.temp_ambiente + '°' : '-'}</td>
                    <td class="${m && m.alerta ? 'alerta' : 'ok'}">${m ? m.humedad_relativa + '%' : '-'}</td>
                    <td>${m ? m.responsable : '-'}</td>
                    <td>${t ? t.hora : '-'}</td>
                    <td class="${t && t.alerta ? 'alerta' : 'ok'}">${t ? t.temp_ambiente + '°' : '-'}</td>
                    <td class="${t && t.alerta ? 'alerta' : 'ok'}">${t ? t.humedad_relativa + '%' : '-'}</td>
                    <td>${t ? t.responsable : '-'}</td>
                    <td style="text-align: left; font-size: 8px;">${obs || 'Conforme'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer-firmas">
            <div class="firma-box">
              <br><br>
              <strong>QUÍMICO FARMACÉUTICO</strong><br>
              Director Técnico / Reg. CQFP
            </div>
            <div class="firma-box">
              <br><br>
              <strong>ADMINISTRACIÓN</strong><br>
              Representante Legal
            </div>
          </div>

          <p class="norma">
            Formato oficial estandarizado conforme al Manual de Buenas Prácticas de Oficina Farmacéutica (R.M. N° 554-2022/MINSA) y Manual de BPA (R.M. N° 132-2015/MINSA).
          </p>
        </body>
        </html>
      `);
      ventana.document.close();
      setTimeout(() => {
        ventana.print();
      }, 500);
    } catch (err) {
      toast.error('Error al generar impresión de BPA.');
    }
  };

  const meses = [
    { num: 1, nombre: 'Enero' }, { num: 2, nombre: 'Febrero' }, { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' }, { num: 5, nombre: 'Mayo' }, { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' }, { num: 8, nombre: 'Agosto' }, { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' }, { num: 11, nombre: 'Noviembre' }, { num: 12, nombre: 'Diciembre' }
  ];

  return (
    <div className="space-y-4 font-sora">
      {/* ─── ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Thermometer className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Control de Temperatura y Humedad
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                BPA • DIGEMID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Buenas Prácticas de Almacenamiento (R.M. N° 554-2022/MINSA) • Registro obligatorio 2 veces al día.
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={imprimirReporteBPA}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 font-sora"
            title="Generar formato mensual para carpeta de inspección DIRIS/DIGEMID"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Imprimir Hoja Oficial BPA</span>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNuevo()}
            className="px-3.5 py-2 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-bold text-xs shadow-xs shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center gap-1.5 font-sora cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Lectura Hoy</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (DISEÑO Y DIMENSIONES DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: Turno Mañana */}
        <button
          type="button"
          onClick={() => {
            if (estadoHoy.mañana.registrado && estadoHoy.mañana.datos) {
              abrirModalEditar(estadoHoy.mañana.datos);
            } else {
              abrirModalNuevo('Mañana');
            }
          }}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between text-left outline-none focus:outline-none focus-visible:outline-none ${
            estadoHoy.mañana.registrado
              ? 'border-emerald-500/50 dark:border-emerald-600/50 hover:border-emerald-500'
              : 'border-amber-400/60 dark:border-amber-600/50 bg-amber-50/10 hover:border-amber-400'
          }`}
          title={estadoHoy.mañana.registrado ? 'Clic para ver o editar la lectura matutina' : 'Clic para registrar la toma del turno mañana'}
        >
          <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl pointer-events-none transition-all ${
            estadoHoy.mañana.registrado ? 'bg-emerald-500/5 group-hover:bg-emerald-500/12' : 'bg-amber-500/5 group-hover:bg-amber-500/12'
          }`} />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className={`text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider font-sora truncate min-w-0 transition-colors ${
                estadoHoy.mañana.registrado ? 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400' : 'text-amber-700/80 dark:text-amber-400'
              }`}>
                Turno Mañana
              </span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs ${
                estadoHoy.mañana.registrado
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
              }`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className={`text-xl sm:text-2xl font-extrabold font-sora tracking-tight truncate font-mono ${
                estadoHoy.mañana.registrado ? 'text-slate-900 dark:text-slate-100' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {estadoHoy.mañana.registrado && estadoHoy.mañana.datos ? `${estadoHoy.mañana.datos.temp_ambiente}°C` : 'Pendiente'}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {estadoHoy.mañana.registrado && estadoHoy.mañana.datos
                ? `${estadoHoy.mañana.datos.humedad_relativa}% HR • ${estadoHoy.mañana.datos.hora} hrs`
                : 'Horario: 08:00 - 12:00'}
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 whitespace-nowrap font-sora ${
              estadoHoy.mañana.registrado
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                estadoHoy.mañana.registrado ? 'bg-[#00B884]' : 'bg-amber-500 animate-pulse'
              } shrink-0`} />
              {estadoHoy.mañana.registrado ? 'Registrado' : 'Por Registrar'}
            </span>
          </div>
        </button>

        {/* KPI 2: Turno Tarde */}
        <button
          type="button"
          onClick={() => {
            if (estadoHoy.tarde.registrado && estadoHoy.tarde.datos) {
              abrirModalEditar(estadoHoy.tarde.datos);
            } else {
              abrirModalNuevo('Tarde');
            }
          }}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between text-left outline-none focus:outline-none focus-visible:outline-none ${
            estadoHoy.tarde.registrado
              ? 'border-emerald-500/50 dark:border-emerald-600/50 hover:border-emerald-500'
              : 'border-amber-400/60 dark:border-amber-600/50 bg-amber-50/10 hover:border-amber-400'
          }`}
          title={estadoHoy.tarde.registrado ? 'Clic para ver o editar la lectura de la tarde' : 'Clic para registrar la toma del turno tarde'}
        >
          <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl pointer-events-none transition-all ${
            estadoHoy.tarde.registrado ? 'bg-emerald-500/5 group-hover:bg-emerald-500/12' : 'bg-amber-500/5 group-hover:bg-amber-500/12'
          }`} />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className={`text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider font-sora truncate min-w-0 transition-colors ${
                estadoHoy.tarde.registrado ? 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400' : 'text-amber-700/80 dark:text-amber-400'
              }`}>
                Turno Tarde
              </span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs ${
                estadoHoy.tarde.registrado
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
              }`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className={`text-xl sm:text-2xl font-extrabold font-sora tracking-tight truncate font-mono ${
                estadoHoy.tarde.registrado ? 'text-slate-900 dark:text-slate-100' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {estadoHoy.tarde.registrado && estadoHoy.tarde.datos ? `${estadoHoy.tarde.datos.temp_ambiente}°C` : 'Pendiente'}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {estadoHoy.tarde.registrado && estadoHoy.tarde.datos
                ? `${estadoHoy.tarde.datos.humedad_relativa}% HR • ${estadoHoy.tarde.datos.hora} hrs`
                : 'Horario: 14:00 - 18:00'}
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 whitespace-nowrap font-sora ${
              estadoHoy.tarde.registrado
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                estadoHoy.tarde.registrado ? 'bg-[#00B884]' : 'bg-amber-500 animate-pulse'
              } shrink-0`} />
              {estadoHoy.tarde.registrado ? 'Registrado' : 'Por Registrar'}
            </span>
          </div>
        </button>

        {/* KPI 3: Conformidad BPA Mensual */}
        <button
          type="button"
          onClick={imprimirReporteBPA}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between text-left outline-none focus:outline-none focus-visible:outline-none"
          title="Ver o imprimir hoja de control mensual oficial para inspecciones DIRIS/DIGEMID"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                Conformidad BPA
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                {estadisticas.porcentajeConformidad}%
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {estadisticas.conformes} de {estadisticas.total} conformes
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 whitespace-nowrap font-sora ${
              estadisticas.conAlerta === 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                estadisticas.conAlerta === 0 ? 'bg-[#00B884]' : 'bg-rose-500 animate-pulse'
              } shrink-0`} />
              {estadisticas.conAlerta === 0 ? '100% Óptimo' : `${estadisticas.conAlerta} Desvíos`}
            </span>
          </div>
        </button>

        {/* KPI 4: Total Tomas Registradas */}
        <button
          type="button"
          onClick={() => abrirModalNuevo()}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between text-left outline-none focus:outline-none focus-visible:outline-none"
          title="Registrar nueva lectura de temperatura y humedad"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-400 font-sora truncate min-w-0 transition-colors">
                Total Tomas Mes
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                {estadisticas.total}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Máx: {umbrales.humedadRelativaMax}% HR
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 shrink-0 whitespace-nowrap font-sora">
              {umbrales.tempAmbienteMin}°C - {umbrales.tempAmbienteMax}°C
            </span>
          </div>
        </button>
      </div>

      {/* ─── FILTROS Y SELECTORES DE PERIODO ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow font-sora">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {sucursales.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8]" />
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
              >
                <option value="todas">Todas las Sedes</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8]" />
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
            >
              {meses.map((m) => (
                <option key={m.num} value={m.num}>{m.nombre}</option>
              ))}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
            >
              {[anio - 1, anio, anio + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#00855E] dark:text-slate-400 dark:hover:text-[#5EEBB8] px-3 py-1.5 rounded-xl hover:bg-[#EBFDF6] dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-[#A6F6D8] dark:hover:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ─── TABLA DE REGISTROS DEL MES ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow overflow-hidden font-sora">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8]" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
              Bitácora Mensual de Lecturas ({registros.length} registros)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Mes evaluado: {meses.find((m) => m.num === mes)?.nombre} {anio}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[10.5px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Turno & Hora</th>
                <th className="py-3 px-4">Temp. Ambiente</th>
                <th className="py-3 px-4">Humedad Relativa</th>
                <th className="py-3 px-4">Refrigeración</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Estado BPA</th>
                <th className="py-3 px-4">Observaciones / Acción</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    Cargando bitácora de temperatura y humedad...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <Thermometer className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-sm">No hay lecturas registradas en este período</p>
                    <p className="text-slate-400 text-xs mt-1">Presiona "Registrar Lectura Hoy" para ingresar la primera toma.</p>
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                      {reg.fecha}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          reg.turno === 'Mañana' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {reg.turno}
                        </span>
                        <span className="font-mono text-slate-600 font-semibold">{reg.hora}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-black text-xs ${
                        reg.temp_ambiente > umbrales.tempAmbienteMax || reg.temp_ambiente < umbrales.tempAmbienteMin
                           ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200'
                          : 'text-slate-800'
                      }`}>
                        {reg.temp_ambiente}°C
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-black text-xs ${
                        reg.humedad_relativa > umbrales.humedadRelativaMax
                          ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200'
                          : 'text-slate-800'
                      }`}>
                        {reg.humedad_relativa}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                      {reg.temp_refrigeracion ? `${reg.temp_refrigeracion}°C` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">
                        {reg.usuario?.nombre || 'Director Técnico'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {reg.alerta_generada ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Fuera de Límite
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Conforme BPA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={reg.accion_correctiva || reg.observaciones || 'Conforme'}>
                      {reg.accion_correctiva ? (
                        <span className="font-semibold text-teal-700">
                          {reg.accion_correctiva}
                        </span>
                      ) : (
                        reg.observaciones || '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(reg)}
                          title="Editar lectura"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00855E] hover:bg-[#EBFDF6] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarRegistro(reg.id)}
                          title="Eliminar lectura"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ─── MODAL DE REGISTRO / EDICIÓN DE TEMPERATURA (PORTAL AL BODY) ─── */}
      {modalAbierto && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto custom-modal-scroll animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#D1F4E3] dark:border-slate-800 space-y-4 font-sora my-auto animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Thermometer className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 leading-tight font-sora">
                    {modoEdicion ? 'Editar Toma de Temperatura & Humedad' : 'Registrar Toma de Temperatura & Humedad'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Manual de Buenas Prácticas de Almacenamiento (BPA) • DIGEMID / MINSA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fila de Trazabilidad: Responsable y Sede */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/40 border border-[#D1F4E3]/70 dark:border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <UserCheck className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8] shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block">Responsable Registro</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{user?.nombre || 'Director Técnico'}</span>
                </div>
              </div>

              {sucursales.length > 1 ? (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5 flex items-center gap-1 font-sora">
                    <Building2 className="w-3 h-3 text-[#00855E]" /> Sede / Sucursal
                  </label>
                  <select
                    value={formulario.id_sucursal}
                    onChange={(e) => setFormulario({ ...formulario, id_sucursal: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00855E]"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.codigo_establecimiento ? `(${s.codigo_establecimiento})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8] shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400 text-[10px] block">Sede Asignada</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {sucursales[0]?.nombre || 'Sede Principal'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Fecha, Turno y Hora */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={formulario.fecha}
                    onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
                  />
                </div>

                <div>
                  <DropdownPill
                    label="Turno"
                    value={formulario.turno}
                    onChange={(val) => setFormulario({ ...formulario, turno: val })}
                    options={TURNOS_CONTROL}
                    icon={Clock}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10.5px] font-black uppercase text-slate-500 dark:text-slate-400 font-sora">
                      Hora
                    </label>
                    <button
                      type="button"
                      onClick={fijarHoraActual}
                      className="text-[9.5px] font-bold text-[#00855E] dark:text-[#5EEBB8] hover:underline cursor-pointer"
                      title="Sincronizar a la hora actual"
                    >
                      Ahora
                    </button>
                  </div>
                  <input
                    type="time"
                    required
                    value={formulario.hora}
                    onChange={(e) => setFormulario({ ...formulario, hora: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
                  />
                </div>
              </div>

              {/* Botón rápido para autocompletar valores estándar de rutina */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-sora">
                  Parámetros Termohigrométricos
                </span>
                <button
                  type="button"
                  onClick={cargarValoresOptimos}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-[#5EEBB8] border border-[#A6F6D8]/70 transition-all cursor-pointer"
                  title="Cargar 21.5°C y 56% HR recomendados"
                >
                  <Sparkles className="w-3 h-3 text-[#00B884]" />
                  Valores Típicos (21.5°C / 56%)
                </button>
              </div>

              {/* Medición de Temperatura Ambiente y Humedad */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/50 border border-[#D1F4E3] dark:border-slate-800">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1 font-sora">
                    <Thermometer className="w-3.5 h-3.5 text-[#00855E] dark:text-[#5EEBB8]" />
                    Temp. Ambiente (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formulario.temp_ambiente}
                    onChange={(e) => setFormulario({ ...formulario, temp_ambiente: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#00855E]/20 shadow-2xs"
                    placeholder="ej. 22.5"
                  />
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                    Norma: {umbrales.tempAmbienteMin}°C a {umbrales.tempAmbienteMax}°C
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1 font-sora">
                    <Droplets className="w-3.5 h-3.5 text-[#00855E] dark:text-[#5EEBB8]" />
                    Humedad Relativa (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formulario.humedad_relativa}
                    onChange={(e) => setFormulario({ ...formulario, humedad_relativa: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#00855E]/20 shadow-2xs"
                    placeholder="ej. 58.0"
                  />
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                    Norma: Máx {umbrales.humedadRelativaMax}% HR
                  </span>
                </div>
              </div>

              {/* Cadena de frío (Refrigeración 2 a 8°C) */}
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-cyan-50/30 dark:bg-cyan-950/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formulario.tiene_refrigeracion}
                    onChange={(e) => setFormulario({ ...formulario, tiene_refrigeracion: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded-md focus:ring-cyan-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-sora">
                    <Snowflake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Registrar Cadena de Frío / Refrigeradora (2°C - 8°C)
                  </span>
                </label>

                {formulario.tiene_refrigeracion && (
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      value={formulario.temp_refrigeracion}
                      onChange={(e) => setFormulario({ ...formulario, temp_refrigeracion: e.target.value })}
                      placeholder="Temperatura de refrigeración (ej. 4.5°C)"
                      className="w-full bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 rounded-xl px-3 py-2 text-xs font-black font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Indicador reactivo de Semáforo en vivo */}
              <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                evaluacionEnVivo.conforme
                  ? 'bg-[#EBFDF6] text-[#00855E] dark:bg-emerald-950/50 dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {evaluacionEnVivo.conforme ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00B884] shrink-0" />
                    <span>Lectura en rango óptimo conforme al Manual BPA de DIGEMID.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-black text-rose-900 dark:text-rose-200">Alerta Sanitaria:</p>
                      <ul className="text-[11px] font-medium list-disc list-inside text-rose-800 dark:text-rose-300">
                        {evaluacionEnVivo.advertencias.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Acción correctiva si hubo alerta */}
              {!evaluacionEnVivo.conforme && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-rose-700 dark:text-rose-300 mb-1">
                    Acción Correctiva Inmediata (Exigida por DIGEMID ante desvíos)
                  </label>
                  <input
                    type="text"
                    value={formulario.accion_correctiva}
                    onChange={(e) => setFormulario({ ...formulario, accion_correctiva: e.target.value })}
                    placeholder="ej. Se encendió aire acondicionado y deshumedecedor"
                    className="w-full bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[
                      'Encendido de aire acondicionado',
                      'Encendido de deshumedecedor',
                      'Ventilación forzada activada',
                      'Revisión de termostato de refrigeradora'
                    ].map((sugerencia) => (
                      <button
                        type="button"
                        key={sugerencia}
                        onClick={() => setFormulario({ ...formulario, accion_correctiva: sugerencia })}
                        className="px-2 py-0.5 bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-[#5EEBB8] rounded-lg text-[10px] font-bold border border-[#A6F6D8]/60 transition-all cursor-pointer"
                      >
                        + {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campo opcional de Observaciones Generales / Notas del Termohigrómetro */}
              <div>
                <label className="block text-[10.5px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between font-sora">
                  <span>Observaciones Generales / Notas Sanitarias</span>
                  <span className="text-[9.5px] text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formulario.observaciones}
                  onChange={(e) => setFormulario({ ...formulario, observaciones: e.target.value })}
                  placeholder="ej. Termohigrómetro digital calibrado N° 01, condiciones normales..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00855E]/20"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-bold shadow-xs shadow-emerald-900/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 font-sora"
                >
                  {guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar Registro BPA' : 'Confirmar y Guardar Lectura')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
