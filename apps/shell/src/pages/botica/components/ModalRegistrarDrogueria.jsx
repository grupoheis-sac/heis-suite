import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import {
  Truck,
  Building2,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ExternalLink,
  Award,
  FileCheck2,
  BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import DropdownPill from './DropdownPill';

const CARGOS_REPRESENTANTE = [
  { value: 'Director Técnico (Q.F.)', label: 'Director Técnico (Químico Farmacéutico)', subtitle: 'Responsable técnico colegiado (DIGEMID)' },
  { value: 'Representante Legal', label: 'Representante Legal / Gerente', subtitle: 'Poder legal registrado en SUNAT / RRPP' },
  { value: 'Asesor Comercial', label: 'Asesor Comercial / Ejecutivo de Ventas', subtitle: 'Contacto para pedidos y cotizaciones' },
  { value: 'Otro', label: 'Otro Contacto Autorizado', subtitle: 'Contacto administrativo o logístico' }
];

export default function ModalRegistrarDrogueria({
  isOpen,
  onClose,
  proveedorEditando = null,
  onSuccess
}) {
  // Datos de la Droguería (Empresa)
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Datos del Profesional / Contacto
  const [cargoContacto, setCargoContacto] = useState('Director Técnico (Q.F.)');
  const [dniContacto, setDniContacto] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [cqfpContacto, setCqfpContacto] = useState('');

  // Estados de carga y validación
  const [buscandoSunat, setBuscandoSunat] = useState(false);
  const [buscandoReniec, setBuscandoReniec] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sunatStatus, setSunatStatus] = useState(null);
  const [reniecStatus, setReniecStatus] = useState(null);

  // Inicializar o limpiar formulario al abrir/cambiar modo
  useEffect(() => {
    if (isOpen) {
      if (proveedorEditando) {
        setRuc(proveedorEditando.numero_documento || '');
        setRazonSocial(proveedorEditando.razon_social || '');
        setDireccion(proveedorEditando.direccion || '');
        setTelefono(proveedorEditando.telefono || '');
        setEmail(proveedorEditando.email || '');

        // Analizar contacto previo si tiene formato
        const contactoPrevio = proveedorEditando.contacto || '';
        const matchDni = contactoPrevio.match(/DNI:?\s*(\d{8})/i);
        const matchCqfp = contactoPrevio.match(/CQFP:?\s*(\d+)/i);

        if (matchDni) setDniContacto(matchDni[1]);
        else setDniContacto('');

        if (matchCqfp) setCqfpContacto(matchCqfp[1]);
        else setCqfpContacto('');

        if (contactoPrevio.includes('Director Técnico') || contactoPrevio.includes('Q.F.')) {
          setCargoContacto('Director Técnico (Q.F.)');
        } else if (contactoPrevio.includes('Representante Legal')) {
          setCargoContacto('Representante Legal');
        } else if (contactoPrevio.includes('Asesor') || contactoPrevio.includes('Ventas')) {
          setCargoContacto('Asesor Comercial');
        } else {
          setCargoContacto('Director Técnico (Q.F.)');
        }

        // Limpiar nombre extraído de formato
        const nombreLimpio = contactoPrevio
          .replace(/^(Q\.F\.|Lic\.|Dr\.)\s*/i, '')
          .replace(/\(DNI:.*?\)/i, '')
          .replace(/-?\s*(Rep\. Legal|Ventas|Director Técnico)/i, '')
          .trim();
        setNombreContacto(nombreLimpio || contactoPrevio);

        setSunatStatus(null);
        setReniecStatus(null);
      } else {
        setRuc('');
        setRazonSocial('');
        setDireccion('');
        setTelefono('');
        setEmail('');
        setCargoContacto('Director Técnico (Q.F.)');
        setDniContacto('');
        setNombreContacto('');
        setCqfpContacto('');
        setSunatStatus(null);
        setReniecStatus(null);
      }
    }
  }, [isOpen, proveedorEditando]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. Consulta en línea a SUNAT (RUC de la Droguería)
  const consultarSunat = async () => {
    const doc = ruc.trim();
    if (!doc) {
      return toast.error('Ingresa el número de RUC de la Droguería');
    }

    if (doc.length !== 11) {
      return toast.error('El RUC debe tener exactamente 11 dígitos numéricos');
    }

    if (!doc.startsWith('20') && !doc.startsWith('10')) {
      toast('Aviso: Las droguerías formales habitualmente tienen RUC 20 (Sociedades) o RUC 10 (Titular Unipersonal)', {
        icon: 'ℹ️'
      });
    }

    try {
      setBuscandoSunat(true);
      const res = await api.get(`/consultas/ruc/${doc}`);
      const data = res.data?.data || res.data;

      if (data && (data.razon_social || data.razonSocial)) {
        const rz = (data.razon_social || data.razonSocial || '').trim();
        const dir = (data.direccion || '').trim();
        const estado = data.estado || 'ACTIVO';
        const condicion = data.condicion || 'HABIDO';
        const ubigeo = data.distrito ? `${data.distrito}, ${data.provincia || ''}` : '';

        setRazonSocial(rz);
        if (dir) setDireccion(dir);

        setSunatStatus({
          estado,
          condicion,
          ubigeo,
          esActivo: estado.toUpperCase() === 'ACTIVO',
          esHabido: condicion.toUpperCase() === 'HABIDO'
        });

        toast.success(`Droguería verificada en SUNAT: ${rz}`);
      } else {
        toast.error('No se encontraron datos en SUNAT para este RUC');
        setSunatStatus(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo conectar con el servicio SUNAT';
      toast.error(msg);
      setSunatStatus(null);
    } finally {
      setBuscandoSunat(false);
    }
  };

  // 2. Consulta en línea a RENIEC (DNI del Profesional / Representante)
  const consultarReniec = async () => {
    const dniLimpio = dniContacto.trim();
    if (!dniLimpio) {
      return toast.error('Ingresa el DNI del profesional / representante');
    }

    if (dniLimpio.length !== 8) {
      return toast.error('El DNI debe tener exactamente 8 dígitos numéricos');
    }

    try {
      setBuscandoReniec(true);
      const res = await api.get(`/consultas/dni/${dniLimpio}`);
      const data = res.data?.data || res.data;

      if (data && (data.nombre_completo || data.nombre)) {
        const nombre = (data.nombre_completo || `${data.nombres || ''} ${data.apellido_paterno || ''} ${data.apellido_materno || ''}`).trim();
        setNombreContacto(nombre);
        setReniecStatus({
          verificado: true,
          nombre,
          dni: dniLimpio
        });
        toast.success(`Identidad verificada en RENIEC: ${nombre}`);
      } else {
        toast.error('DNI no encontrado en el padrón civil de RENIEC');
        setReniecStatus(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo verificar el DNI en RENIEC';
      toast.error(msg);
      setReniecStatus(null);
    } finally {
      setBuscandoReniec(false);
    }
  };

  // Guardar Droguería en la base de datos
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rucLimpio = ruc.trim();
    const razonLimpia = razonSocial.trim();

    if (!rucLimpio || !razonLimpia) {
      return toast.error('El RUC y la Razón Social de la droguería son obligatorios');
    }

    if (rucLimpio.length !== 11) {
      return toast.error('El RUC peruano debe tener exactamente 11 dígitos numéricos');
    }

    // Armar string estructurado para el contacto profesional
    let contactoFinal = '';
    if (nombreContacto.trim()) {
      const prefix = cargoContacto.includes('Q.F.') ? 'Q.F. ' : '';
      let detalles = [];
      if (dniContacto.trim()) detalles.push(`DNI: ${dniContacto.trim()}`);
      if (cqfpContacto.trim()) detalles.push(`CQFP: ${cqfpContacto.trim()}`);
      if (!cargoContacto.includes('Q.F.') && cargoContacto !== 'Otro') detalles.push(cargoContacto);

      contactoFinal = `${prefix}${nombreContacto.trim()}`;
      if (detalles.length > 0) {
        contactoFinal += ` (${detalles.join(' - ')})`;
      }
    }

    const payload = {
      tipo_documento: 'RUC',
      numero_documento: rucLimpio,
      razon_social: razonLimpia,
      contacto: contactoFinal ? contactoFinal.slice(0, 100) : null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null
    };

    try {
      setGuardando(true);
      let respuesta;
      if (proveedorEditando) {
        respuesta = await api.put(`/proveedores/${proveedorEditando.id}`, payload);
        toast.success('Droguería actualizada con éxito');
      } else {
        respuesta = await api.post('/proveedores', payload);
        toast.success('Droguería registrada y verificada exitosamente');
      }

      const proveedorGuardado = respuesta.data?.proveedor || respuesta.data?.data || {
        ...payload,
        id: proveedorEditando?.id || Date.now()
      };

      if (onSuccess) {
        onSuccess(proveedorGuardado);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar la droguería en el catálogo';
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 relative flex flex-col overflow-hidden max-h-[92vh] font-sora">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{proveedorEditando ? 'Editar Droguería' : 'Registrar Nueva Droguería'}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                  RUC Oficial
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Validación fiscal SUNAT · Verificación de Director Técnico (Q.F.) RENIEC & SUNEDU
              </p>
            </div>
          </div>

          {/* Botón Cerrar de Alto Contraste */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/90 hover:border-rose-500 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5] text-rose-600 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar">
          
          {/* SECCIÓN 1: DATOS FISCALES DE LA DROGUERÍA (SUNAT) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                1. Datos Fiscales de la Droguería (Padrón SUNAT)
              </span>
              <a
                href="http://serviciosweb.digemid.minsa.gob.pe/Consultas/Establecimientos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                title="Consultar registro sanitario en el Catálogo Nacional de Establecimientos Farmacéuticos DIGEMID"
              >
                <span>Validar en DIGEMID</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* RUC + Botón SUNAT */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Número de RUC de la Droguería *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ruc}
                    onChange={(e) => {
                      const soloNum = e.target.value.replace(/\D/g, '');
                      setRuc(soloNum);
                      setSunatStatus(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        consultarSunat();
                      }
                    }}
                    placeholder="20100145698 (11 dígitos)"
                    className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={consultarSunat}
                  disabled={buscandoSunat || !ruc.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 active:scale-95"
                  title="Consultar RUC en SUNAT en vivo (Enter)"
                >
                  {buscandoSunat ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Consultar SUNAT</span>
                </button>
              </div>
            </div>

            {/* Diagnóstico Fiscal SUNAT */}
            {sunatStatus && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 text-xs font-bold animate-in fade-in duration-200 ${
                  sunatStatus.esActivo && sunatStatus.esHabido
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50/90 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sunatStatus.esActivo && sunatStatus.esHabido ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span>
                      Estado SUNAT: <strong>{sunatStatus.estado}</strong> — Condición: <strong>{sunatStatus.condicion}</strong>
                    </span>
                    {sunatStatus.ubigeo && (
                      <p className="text-[11px] font-medium opacity-80 truncate">Distrito fiscal: {sunatStatus.ubigeo}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs shrink-0">
                  {sunatStatus.esActivo && sunatStatus.esHabido ? 'HÁBIL PARA FACTURA' : 'OBSERVADO'}
                </span>
              </div>
            )}

            {/* Razón Social */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Razón Social Oficial (Laboratorio / Droguería) *
              </label>
              <input
                type="text"
                required
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej. DROGUERÍA MEDIFARMA S.A."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
              />
            </div>

            {/* Dirección Fiscal / Almacén */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Dirección Fiscal o Almacén Central
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Nicolás Arriola 740, La Victoria, Lima"
                  className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DIRECTOR TÉCNICO / REPRESENTANTE AUTORIZADO (RENIEC + SUNEDU) */}
          <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-200/70 space-y-3.5">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
              <span className="text-xs font-black uppercase text-teal-900 flex items-center gap-1.5 tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                2. Director Técnico (Q.F.) o Representante Autorizado
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://constancias.sunedu.gob.pe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                  title="Verificar grado universitario de Químico Farmacéutico en el Registro Oficial de SUNEDU"
                >
                  <GraduationCap className="w-3 h-3 text-blue-600" />
                  <span>Verificar SUNEDU</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://www.cqfp.pe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                  title="Consultar colegiatura de Químico Farmacéutico en el CQFP"
                >
                  <Award className="w-3 h-3 text-teal-600" />
                  <span>Colegio CQFP</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Cargo + DNI + RENIEC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DropdownPill
                  label="Rol / Cargo en la Droguería"
                  value={cargoContacto}
                  onChange={(val) => setCargoContacto(val)}
                  options={CARGOS_REPRESENTANTE}
                  icon={ShieldCheck}
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  DNI del Profesional (8 dígitos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    value={dniContacto}
                    onChange={(e) => {
                      const soloNum = e.target.value.replace(/\D/g, '');
                      setDniContacto(soloNum);
                      setReniecStatus(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        consultarReniec();
                      }
                    }}
                    placeholder="45879632"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={consultarReniec}
                    disabled={buscandoReniec || !dniContacto.trim()}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-600/20 active:scale-95"
                    title="Consultar identidad en RENIEC oficial (Enter)"
                  >
                    {buscandoReniec ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>RENIEC</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Nombre del Profesional */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Nombres y Apellidos del Profesional / Contacto
                </label>
                {reniecStatus?.verificado && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                    Identidad Verificada en RENIEC
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={nombreContacto}
                  onChange={(e) => setNombreContacto(e.target.value)}
                  placeholder="Ej. Q.F. Roberto Carlos Carranza Mendoza"
                  className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Colegiatura CQFP (Solo si es Q.F.) */}
            {cargoContacto.includes('Q.F.') && (
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Colegiatura CQFP (Colegio Químico Farmacéutico del Perú)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={cqfpContacto}
                    onChange={(e) => setCqfpContacto(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 18452 (5 dígitos)"
                    className="w-full px-3 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs"
                  />
                  <Award className="w-4 h-4 text-teal-600 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: CANALES DE CONTACTO Y PEDIDOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Teléfono Central / WhatsApp de Pedidos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="01-512-3400 / 998765432"
                  className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Correo de Facturación / Pedidos
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pedidos@medifarma.pe"
                  className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando en catálogo...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{proveedorEditando ? 'Guardar Cambios' : 'Registrar Droguería Verificada'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
