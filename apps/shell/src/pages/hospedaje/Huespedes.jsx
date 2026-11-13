import React, { useState, useEffect } from 'react';
import api from './api';
import { Modal } from '@heis/ui';
import DropdownPill from './components/DropdownPill';
import ModalPerfilHuesped from './components/ModalPerfilHuesped';
import ModalExportarLibroMincetur from './components/ModalExportarLibroMincetur';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Globe,
  CreditCard,
  RefreshCw,
  FileText,
  Edit3,
  MapPin,
  Briefcase,
  Crown,
  ShieldAlert,
  Loader2,
  Hotel,
  Eye,
  MessageCircle,
  Building,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { notificarExito, notificarError } from './utils/notificaciones';

const OPCIONES_DOCUMENTO_HUESPED = [
  { value: 'DNI', label: 'DNI (Perú)', subtitle: 'Documento Nacional de Identidad (8 dígitos)', badge: 'RENIEC' },
  { value: 'Pasaporte', label: 'Pasaporte Extranjero', subtitle: 'Huéspedes internacionales', badge: 'Extranjero' },
  { value: 'CE', label: 'Carnet de Extranjería (CE)', subtitle: 'Residencia en Perú', badge: 'Migraciones' },
  { value: 'RUC', label: 'RUC Corporativo', subtitle: 'Facturación a persona jurídica (11 dígitos)', badge: 'SUNAT' }
];

const OPCIONES_CLASIFICACION_HUESPED = [
  { value: 'estandar', label: 'Estándar', subtitle: 'Pasajero regular del hotel', badge: 'Habitual' },
  { value: 'vip', label: 'Huésped VIP ⭐', subtitle: 'Trato prioritario y beneficios', badge: 'Preferente' },
  { value: 'lista_negra', label: 'Alerta / Lista Negra ⚠️', subtitle: 'Incidentes, impagos o antecedentes', badge: 'Observado' }
];

const FORM_INICIAL = {
  nombre: '',
  apellido: '',
  tipo_documento: 'DNI',
  num_documento: '',
  nacionalidad: 'Peruana',
  ciudad_origen: '',
  ocupacion: '',
  telefono: '',
  email: '',
  direccion: '',
  clasificacion: 'estandar',
  motivo_lista_negra: '',
  observaciones: ''
};

export default function Huespedes() {
  const [huespedes, setHuespedes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [kpis, setKpis] = useState({
    total: 0,
    alojados: 0,
    vip: 0,
    lista_negra: 0,
    extranjeros: 0
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  const [modalExportarOpen, setModalExportarOpen] = useState(false);
  const [huespedParaPerfilId, setHuespedParaPerfilId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [consultandoDoc, setConsultandoDoc] = useState(false);
  const [huespedEditando, setHuespedEditando] = useState(null);

  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    cargarHuespedes();
  }, [busqueda, filtro]);

  const cargarHuespedes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append('busqueda', busqueda.trim());
      if (filtro && filtro !== 'todos') params.append('filtro', filtro);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/huespedes${qs}`);
      setHuespedes(res.data.data || res.data || []);
      if (res.data.kpis) {
        setKpis(res.data.kpis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirNuevo = () => {
    setHuespedEditando(null);
    setForm(FORM_INICIAL);
    setModalOpen(true);
  };

  const handleAbrirEditar = (h) => {
    setHuespedEditando(h);
    setForm({
      nombre: h.nombre || '',
      apellido: h.apellido || '',
      tipo_documento: h.tipo_documento || 'DNI',
      num_documento: h.num_documento || '',
      nacionalidad: h.nacionalidad || 'Peruana',
      ciudad_origen: h.ciudad_origen || '',
      ocupacion: h.ocupacion || '',
      telefono: h.telefono || '',
      email: h.email || '',
      direccion: h.direccion || '',
      clasificacion: h.clasificacion || 'estandar',
      motivo_lista_negra: h.motivo_lista_negra || '',
      observaciones: h.observaciones || ''
    });
    setModalOpen(true);
  };

  const handleNumeroDocumentoChange = (val) => {
    let limpio = val;
    if (form.tipo_documento === 'DNI') {
      limpio = val.replace(/\D/g, '').slice(0, 8);
    } else if (form.tipo_documento === 'RUC') {
      limpio = val.replace(/\D/g, '').slice(0, 11);
    } else {
      limpio = val.slice(0, 20);
    }
    setForm((prev) => ({ ...prev, num_documento: limpio }));
  };

  const handleConsultarDocumento = async () => {
    const doc = (form.num_documento || '').trim();
    if (form.tipo_documento === 'DNI') {
      if (doc.length !== 8) {
        notificarError('Formato inválido', 'El DNI debe tener exactamente 8 dígitos numéricos.');
        return;
      }
      try {
        setConsultandoDoc(true);
        const res = await api.get(`/consultas/dni/${doc}`);
        const d = res.data?.data || res.data;
        if (d && (d.nombres || d.nombre_completo)) {
          setForm((prev) => ({
            ...prev,
            nombre: d.nombres || '',
            apellido: d.apellidos || `${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()
          }));
          notificarExito('RENIEC Conforme', `Datos obtenidos: ${d.nombre_completo}`);
        }
      } catch (err) {
        notificarError('Consulta RENIEC', err.response?.data?.message || 'No se pudo consultar el DNI en RENIEC.');
      } finally {
        setConsultandoDoc(false);
      }
    } else if (form.tipo_documento === 'RUC') {
      if (doc.length !== 11) {
        notificarError('Formato inválido', 'El RUC debe tener exactamente 11 dígitos numéricos.');
        return;
      }
      try {
        setConsultandoDoc(true);
        const res = await api.get(`/consultas/ruc/${doc}`);
        const d = res.data?.data || res.data;
        if (d && (d.razon_social || d.nombre)) {
          const razonSocial = d.razon_social || d.nombre;
          setForm((prev) => ({
            ...prev,
            nombre: razonSocial,
            apellido: '(Empresa / RUC)',
            direccion: d.direccion || prev.direccion,
            ciudad_origen: d.ciudad || d.departamento || prev.ciudad_origen
          }));
          notificarExito('SUNAT Conforme', `Datos obtenidos: ${razonSocial}`);
        }
      } catch (err) {
        notificarError('Consulta SUNAT', err.response?.data?.message || 'No se pudo consultar el RUC en SUNAT.');
      } finally {
        setConsultandoDoc(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.tipo_documento === 'DNI' && form.num_documento.length !== 8) {
      notificarError('Documento inválido', 'El DNI debe contener 8 dígitos numéricos.');
      return;
    }
    if (form.tipo_documento === 'RUC' && form.num_documento.length !== 11) {
      notificarError('Documento inválido', 'El RUC debe contener 11 dígitos numéricos.');
      return;
    }
    if (form.clasificacion === 'lista_negra' && !form.motivo_lista_negra?.trim()) {
      notificarError('Motivo requerido', 'Debe especificar el motivo por el cual el huésped es registrado en Lista Negra / Alerta.');
      return;
    }

    try {
      setGuardando(true);
      if (huespedEditando) {
        await api.put(`/huespedes/${huespedEditando.id}`, form);
        notificarExito('Huésped Actualizado', `Se actualizaron los datos de ${form.nombre} ${form.apellido}.`);
      } else {
        await api.post('/huespedes', form);
        notificarExito('Huésped Registrado', 'Se agregó exitosamente al libro de pasajeros.');
      }
      setModalOpen(false);
      setForm(FORM_INICIAL);
      setHuespedEditando(null);
      cargarHuespedes();
    } catch (err) {
      notificarError(
        huespedEditando ? 'Error al actualizar' : 'Error al registrar',
        err.response?.data?.message || 'No se pudo procesar la solicitud del huésped.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Libro de Huéspedes & Pasajeros
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                MINCETUR D.S. 001-2015 & SUNAT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Directorio de pasajeros con control migratorio, procedencia oficial, VIP y alertas de seguridad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={cargarHuespedes}
            data-tooltip="Actualizar lista de pasajeros [F5]"
            className="p-2 sm:px-3 sm:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalExportarOpen(true)}
            data-tooltip="Exportar Libro Oficial de Registro de Huéspedes en Excel / CSV (MINCETUR)"
            className="p-2 sm:px-3.5 sm:py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold font-sora"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Exportar MINCETUR</span>
          </button>

          <button
            onClick={handleAbrirNuevo}
            data-tooltip="Registrar nuevo huésped en el directorio general"
            className="glow-btn-hotel flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer active:scale-95 shadow-md shadow-blue-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Pasajero</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS KPI (COMPACTADAS EN ALTURA - ESTILO SISTEMA FERRETERÍA) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Total Pasajeros */}
        <div
          onClick={() => setFiltro('todos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtro === 'todos'
              ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-sora truncate">
              Total Pasajeros
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white font-sora tracking-tight leading-none">
              {kpis.total}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Directorio general
            </p>
          </div>
        </div>

        {/* KPI 2: Alojados Hoy (In-House) */}
        <div
          onClick={() => setFiltro(filtro === 'alojados' ? 'todos' : 'alojados')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtro === 'alojados'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate">
              Alojados Hoy
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Hotel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora tracking-tight">
                {kpis.alojados}
              </div>
              {kpis.alojados > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Pasajeros In-House activos
            </p>
          </div>
        </div>

        {/* KPI 3: Huéspedes VIP */}
        <div
          onClick={() => setFiltro(filtro === 'vip' ? 'todos' : 'vip')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtro === 'vip'
              ? 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-sora truncate">
              Huéspedes VIP
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora tracking-tight leading-none">
              {kpis.vip}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Trato preferente y lealtad
            </p>
          </div>
        </div>

        {/* KPI 4: Lista Negra */}
        <div
          onClick={() => setFiltro(filtro === 'lista_negra' ? 'todos' : 'lista_negra')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtro === 'lista_negra'
              ? 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors font-sora truncate">
              Lista Negra
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora tracking-tight leading-none">
              {kpis.lista_negra}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Observados / incidentes
            </p>
          </div>
        </div>

        {/* KPI 5: Extranjeros */}
        <div
          onClick={() => setFiltro(filtro === 'extranjeros' ? 'todos' : 'extranjeros')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtro === 'extranjeros'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora truncate">
              Extranjeros
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-sora tracking-tight leading-none">
              {kpis.extranjeros}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Control migratorio (Pas/CE)
            </p>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE HERRAMIENTAS: BÚSQUEDA Y PÍLDORAS DE SEGMENTO ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Buscador de Pasajeros */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por DNI, pasaporte, nombre, procedencia o teléfono..."
            className="w-full bg-white dark:bg-slate-900 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200/80 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium soft-card-shadow"
          />
        </div>

        {/* Píldoras de Segmentación Rápida */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtro === 'todos' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpis.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('alojados')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'alojados'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Hotel className="w-3.5 h-3.5 text-emerald-500" />
            <span>Alojados Hoy</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtro === 'alojados' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpis.alojados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('vip')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'vip'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>VIP</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtro === 'vip' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpis.vip}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('lista_negra')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'lista_negra'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Lista Negra</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtro === 'lista_negra' ? 'bg-rose-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpis.lista_negra}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('extranjeros')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'extranjeros'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>Extranjeros</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtro === 'extranjeros' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpis.extranjeros}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('empresas')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtro === 'empresas'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Empresas (RUC)</span>
          </button>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] overflow-hidden soft-card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 font-sora">
              <tr>
                <th className="px-6 py-4">Huésped / Pasajero</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Procedencia & Nacionalidad</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Clasificación</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Cargando libro de huéspedes...
                  </td>
                </tr>
              ) : huespedes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron pasajeros registrados con ese criterio.
                  </td>
                </tr>
              ) : (
                huespedes.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Nombre y detalles */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center font-bold text-xs font-sora shrink-0 ${
                          h.clasificacion === 'vip'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300'
                            : h.clasificacion === 'lista_negra'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                            : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400'
                        }`}>
                          {h.nombre?.charAt(0)}{h.apellido?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-800 dark:text-white font-sora">
                              {h.nombre} {h.apellido}
                            </p>
                            {h.estadia_activa && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 font-sora shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Hab. {h.estadia_activa.habitacion?.numero || '---'}
                              </span>
                            )}
                            {h.clasificacion === 'vip' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-sora shrink-0">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> VIP
                              </span>
                            )}
                            {h.clasificacion === 'lista_negra' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-sora shrink-0" title={h.motivo_lista_negra || 'Observado'}>
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" /> ALERTA
                              </span>
                            )}
                          </div>
                          {h.ocupacion && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span>{h.ocupacion}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        {h.tipo_documento}: {h.num_documento}
                      </span>
                    </td>

                    {/* Procedencia & Nacionalidad */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{h.ciudad_origen || 'No especificada'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Globe className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{h.nacionalidad || 'Peruana'}</span>
                        </span>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4 text-xs">
                      <div className="space-y-1">
                        {h.telefono ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${h.telefono}`}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 font-medium transition"
                              title="Llamar teléfono"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{h.telefono}</span>
                            </a>
                            {h.telefono.replace(/\D/g, '') && (
                              <a
                                href={`https://wa.me/${h.telefono.replace(/\D/g, '').length === 9 ? `51${h.telefono.replace(/\D/g, '')}` : h.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${h.nombre}! Saludos cordiales de la recepción del Hotel.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-2xs"
                                title="Enviar WhatsApp al huésped"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] block">Sin teléfono</span>
                        )}
                        {h.email && (
                          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {h.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Clasificación Badge */}
                    <td className="px-6 py-4">
                      {h.clasificacion === 'vip' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[11px] font-sora">
                          <Crown className="w-3 h-3 text-amber-600" /> VIP
                        </span>
                      ) : h.clasificacion === 'lista_negra' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-[11px] font-sora" title={h.motivo_lista_negra}>
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> Lista Negra
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] font-sora">
                          Estándar
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHuespedParaPerfilId(h.id);
                            setModalPerfilOpen(true);
                          }}
                          className="p-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs font-sora"
                          title="Ver Ficha 360° e historial de estadías del pasajero"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="hidden sm:inline">Ficha 360°</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(h)}
                          className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs font-sora"
                          title="Editar datos del pasajero"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Editar</span>
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

      {/* ─── MODAL NUEVO / EDITAR HUÉSPED ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setHuespedEditando(null);
        }}
        title={huespedEditando ? `Editar Pasajero: ${huespedEditando.nombre} ${huespedEditando.apellido}` : "Nuevo Pasajero / Huésped"}
        subtitle={huespedEditando ? `Modificación oficial de ficha de pasajero #${huespedEditando.id}` : "Registro oficial en libro de huéspedes para control hotelero, MINCETUR y SUNAT"}
        icon={huespedEditando ? <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Bloque 1: Identificación & Búsqueda RENIEC/SUNAT */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 font-sora flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Identificación Oficial & Consulta en Línea</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DropdownPill
                  label="Tipo de Documento"
                  value={form.tipo_documento}
                  onChange={(val) => {
                    setForm({ ...form, tipo_documento: val });
                  }}
                  options={OPCIONES_DOCUMENTO_HUESPED}
                  icon={FileText}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                  N° de Documento <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={form.num_documento}
                    onChange={(e) => handleNumeroDocumentoChange(e.target.value)}
                    placeholder={form.tipo_documento === 'DNI' ? '8 dígitos' : form.tipo_documento === 'RUC' ? '11 dígitos' : 'N° documento'}
                    className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {(form.tipo_documento === 'DNI' || form.tipo_documento === 'RUC') && (
                    <button
                      type="button"
                      onClick={handleConsultarDocumento}
                      disabled={consultandoDoc || (form.tipo_documento === 'DNI' ? form.num_documento.length !== 8 : form.num_documento.length !== 11)}
                      className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 font-sora"
                      title={form.tipo_documento === 'DNI' ? 'Consultar RENIEC oficial' : 'Consultar padrón SUNAT'}
                    >
                      {consultandoDoc ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>{form.tipo_documento === 'DNI' ? 'RENIEC' : 'SUNAT'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Carlos / Razón Social"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Ej: Pérez Quispe"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Requerimientos MINCETUR & Procedencia */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sora flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Procedencia & Datos para Ficha MINCETUR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                  Ciudad de Origen
                </label>
                <input
                  type="text"
                  value={form.ciudad_origen}
                  onChange={(e) => setForm({ ...form, ciudad_origen: e.target.value })}
                  placeholder="Ej: Cusco, Arequipa, Lima"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={form.nacionalidad}
                  onChange={(e) => setForm({ ...form, nacionalidad: e.target.value })}
                  placeholder="Peruana"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                  Ocupación / Profesión
                </label>
                <input
                  type="text"
                  value={form.ocupacion}
                  onChange={(e) => setForm({ ...form, ocupacion: e.target.value })}
                  placeholder="Ej: Ingeniero, Comerciante"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                Dirección Domiciliaria
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Av. Principal 123, Urbanización..."
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bloque 3: Contacto & Comunicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                Teléfono / Celular
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="999 888 777"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="huesped@gmail.com"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bloque 4: Clasificación Hotelera & Alertas */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sora flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Clasificación Hotelera & Nivel de Atención</span>
            </div>

            <div>
              <DropdownPill
                label="Estado del Pasajero"
                value={form.clasificacion}
                onChange={(val) => setForm({ ...form, clasificacion: val })}
                options={OPCIONES_CLASIFICACION_HUESPED}
                icon={Crown}
              />
            </div>

            {form.clasificacion === 'lista_negra' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs font-sora">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Motivo de Alerta / Lista Negra (Obligatorio)</span>
                </div>
                <input
                  type="text"
                  required={form.clasificacion === 'lista_negra'}
                  value={form.motivo_lista_negra}
                  onChange={(e) => setForm({ ...form, motivo_lista_negra: e.target.value })}
                  placeholder="Ej: Salida sin pagar minibar, incidentes de conducta, etc."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-100 text-xs outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            )}
          </div>

          {/* Bloque 5: Observaciones / Notas Internas */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sora">
              Observaciones Internas del Hospedaje
            </label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Notas para recepción: piso preferente, solicitudes especiales, empresa de referencia..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setHuespedEditando(null);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="glow-btn-hotel px-6 py-2.5 text-white rounded-xl text-xs font-extrabold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : huespedEditando ? (
                <span>Actualizar Pasajero</span>
              ) : (
                <span>Guardar Pasajero</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL FICHA 360° E HISTORIAL DE PASAJERO ─── */}
      <ModalPerfilHuesped
        isOpen={modalPerfilOpen}
        onClose={() => {
          setModalPerfilOpen(false);
          setHuespedParaPerfilId(null);
        }}
        huespedId={huespedParaPerfilId}
        onEditar={(huesped) => {
          handleAbrirEditar(huesped);
        }}
      />

      {/* ─── MODAL EXPORTAR LIBRO OFICIAL MINCETUR ─── */}
      <ModalExportarLibroMincetur
        isOpen={modalExportarOpen}
        onClose={() => setModalExportarOpen(false)}
      />
    </div>
  );
}
