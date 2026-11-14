// apps/shell/src/pages/OnboardingWizard.jsx
import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Pill,
  Wrench,
  BedDouble,
  Building2,
  UserCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Rocket,
} from 'lucide-react';
import { api } from '@heis/core';
import { UnifiedToast } from '@heis/ui';

const VERTICALES = [
  {
    id: 'restaurante',
    nombre: 'Restaurante & Gastronomía',
    descripcion: 'Control de salón y mesas en tiempo real, KDS de cocina, comandas y división de cuentas.',
    icon: Utensils,
    accent: 'from-amber-500/20 to-orange-600/10 border-amber-500/40 text-amber-300',
  },
  {
    id: 'botica',
    nombre: 'Botica & Farmacia',
    descripcion: 'Control FEFO por lotes y vencimientos, Observatorio DIGEMID, cadena de frío y bajas.',
    icon: Pill,
    accent: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
  },
  {
    id: 'ferreteria',
    nombre: 'Ferretería & Construcción',
    descripcion: 'Fraccionamiento de inventario, kits/combos, alquiler de maquinaria, custodias e IQBF.',
    icon: Wrench,
    accent: 'from-sky-500/20 to-blue-600/10 border-sky-500/40 text-sky-300',
  },
  {
    id: 'hospedaje',
    nombre: 'Hotel & Hospedaje',
    descripcion: 'Rack interactivo de habitaciones, Tape Chart de reservas, tarifas dinámicas y libro MINCETUR.',
    icon: BedDouble,
    accent: 'from-purple-500/20 to-indigo-600/10 border-purple-500/40 text-purple-300',
  },
];

const PLANES_TRIAL = [
  { codigo: 'BASICO', nombre: 'Básico', precio: 99, detalle: '1 Sucursal · 5 Usuarios' },
  { codigo: 'PRO', nombre: 'Pro (Recomendado)', precio: 199, detalle: '3 Sucursales · 20 Usuarios' },
  { codigo: 'ENTERPRISE', nombre: 'Enterprise', precio: 399, detalle: 'Multi-Sucursal Ilimitado' },
];

/**
 * Validador en vivo del algoritmo oficial SUNAT Módulo 11 para RUC peruano (11 dígitos)
 */
export function validarRucModulo11(ruc) {
  const clean = String(ruc || '').trim();
  if (!/^\d{11}$/.test(clean)) {
    return { valido: false, mensaje: 'El RUC debe contener exactamente 11 dígitos numéricos.' };
  }
  if (!/^(10|15|17|20)/.test(clean)) {
    return { valido: false, mensaje: 'El RUC debe iniciar con 10, 15, 17 o 20.' };
  }

  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += Number(clean[i]) * factores[i];
  }
  const resto = 11 - (suma % 11);
  const digitoEsperado = resto === 10 ? 0 : resto === 11 ? 1 : resto;
  const digitoReal = Number(clean[10]);

  if (digitoEsperado !== digitoReal) {
    return {
      valido: false,
      mensaje: `Dígito verificador inválido (se esperaba ${digitoEsperado} al final).`,
    };
  }

  return {
    valido: true,
    tipoContribuyente: clean.startsWith('20') ? 'Persona Jurídica (Empresa)' : 'Persona Natural con Negocio',
    mensaje: 'RUC válido verificado con algoritmo Módulo 11 SUNAT.',
  };
}

export default function OnboardingWizard({ onSuccessRedirect }) {
  const [paso, setPaso] = useState(1);
  const [consultandoRuc, setConsultandoRuc] = useState(false);
  const [procesandoAlta, setProcesandoAlta] = useState(false);
  const [autogenerarClave, setAutogenerarClave] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultadoAlta, setResultadoAlta] = useState(null);

  const [form, setForm] = useState({
    vertical: 'restaurante',
    plan_codigo: 'PRO',
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    telefono: '',
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
  });

  const estadoRuc = useMemo(() => validarRucModulo11(form.ruc), [form.ruc]);

  // Autocompletado opcional consultando padrón SUNAT vía server/src/core/routes/consulta.routes.js
  const handleConsultarPadronSunat = async () => {
    if (!estadoRuc.valido) return;
    setConsultandoRuc(true);
    try {
      const { data } = await api.get(`/consulta/ruc/${form.ruc}`);
      const info = data?.data || data;
      if (info?.razon_social || info?.nombre_o_razon_social) {
        const razon = info.razon_social || info.nombre_o_razon_social;
        setForm((prev) => ({
          ...prev,
          razon_social: razon,
          nombre_comercial: prev.nombre_comercial || razon,
          direccion: info.direccion || info.direccion_completa || prev.direccion,
        }));
        setToast({ type: 'success', message: 'Datos fiscales obtenidos de SUNAT.' });
      }
    } catch {
      setToast({
        type: 'info',
        message: 'RUC verificado por Módulo 11. Ingrese la Razón Social manualmente.',
      });
    } finally {
      setConsultandoRuc(false);
    }
  };

  // Disparo del Paso 3 -> Paso 4: Creación transaccional del Tenant + 14 días de Trial
  const handleActivarTrial = async (e) => {
    e.preventDefault();
    if (!estadoRuc.valido) {
      setToast({ type: 'error', message: estadoRuc.mensaje });
      return;
    }

    setProcesandoAlta(true);
    try {
      const payload = {
        ...form,
        admin_password: autogenerarClave ? undefined : form.admin_password,
      };

      const { data } = await api.post('/suscripciones/onboarding', payload);
      const respuesta = data?.data || data;

      // Guardar sesión JWT y contexto de empresa/sucursal para acceso directo al Dashboard
      if (respuesta?.token) {
        localStorage.setItem('heis_token', respuesta.token);
        localStorage.setItem('token', respuesta.token);
      }
      if (respuesta?.empresa?.id) {
        localStorage.setItem('heis_empresa_id', String(respuesta.empresa.id));
      }
      if (respuesta?.sucursal_id) {
        localStorage.setItem('heis_sucursal_id', String(respuesta.sucursal_id));
      }

      setResultadoAlta(respuesta);
      setPaso(4);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.message ||
          'No se pudo completar el alta automática. Verifique los datos.',
      });
    } finally {
      setProcesandoAlta(false);
    }
  };

  const handleCopiarCredenciales = () => {
    if (!resultadoAlta) return;
    const cred = resultadoAlta.credenciales_iniciales || {};
    const texto = [
      `=== CREDENCIALES DE ACCESO HEIS SUITE ===`,
      `Empresa: ${resultadoAlta.empresa?.razon_social}`,
      `RUC: ${cred.ruc}`,
      `Usuario: ${cred.usuario_email}`,
      `Contraseña Inicial: ${cred.password_temporal || form.admin_password}`,
      `Plan Activo: ${resultadoAlta.suscripcion?.plan} (14 Días Gratis)`,
      `Vencimiento Trial: ${new Date(resultadoAlta.suscripcion?.vence_en).toLocaleDateString('es-PE')}`,
    ].join('\n');

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleIrAlDashboard = () => {
    if (typeof onSuccessRedirect === 'function') {
      onSuccessRedirect(resultadoAlta);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {toast && (
        <UnifiedToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Cabecera de Marca y Barra de Progreso de 4 Pasos */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Prueba Gratuita por 14 Días · Sin Tarjeta de Crédito
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Configura tu entorno empresarial en HEIS Suite
          </h1>
          <p className="text-sm text-slate-400">
            Facturación electrónica SUNAT UBL 2.1, inventario multi-sucursal y control en tiempo real.
          </p>
        </div>

        {/* Stepper Visual */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { num: 1, label: '1. Giro & Plan' },
            { num: 2, label: '2. RUC SUNAT' },
            { num: 3, label: '3. Administrador' },
            { num: 4, label: '4. Acceso Listo' },
          ].map((s) => (
            <div key={s.num} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  paso >= s.num ? 'bg-indigo-500' : 'bg-slate-800'
                }`}
              />
              <span
                className={`block text-xs font-medium ${
                  paso === s.num ? 'text-indigo-300' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Contenedor Principal del Wizard */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* ==========================================
              PASO 1: SELECCIÓN DE GIRO Y PLAN
          ========================================== */}
          {paso === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Selecciona el giro principal de tu negocio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Activaremos automáticamente los módulos especializados y el motor SUNAT UBL 2.1.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {VERTICALES.map((v) => {
                  const Icon = v.icon;
                  const activo = form.vertical === v.id;
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setForm({ ...form, vertical: v.id })}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                        activo
                          ? `bg-gradient-to-br ${v.accent} ring-2 ring-indigo-500/40`
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-6 h-6" />
                        {activo && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="mt-3">
                        <div className="font-semibold text-sm text-slate-100">{v.nombre}</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {v.descripcion}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selección de Plan para los 14 días de prueba */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Plan a evaluar durante tus 14 días gratis:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANES_TRIAL.map((p) => (
                    <button
                      type="button"
                      key={p.codigo}
                      onClick={() => setForm({ ...form, plan_codigo: p.codigo })}
                      className={`p-3 rounded-xl border text-left transition ${
                        form.plan_codigo === p.codigo
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-100">{p.nombre}</div>
                      <div className="text-sm font-mono font-semibold text-indigo-300 mt-0.5">
                        S/ {p.precio}/mes <span className="text-[11px] text-emerald-400">(Hoy S/ 0)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{p.detalle}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >
                  Continuar a Datos Fiscales
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              PASO 2: VALIDACIÓN DE RUC (MÓDULO 11) Y RAZÓN SOCIAL
          ========================================== */}
          {paso === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Identificación Tributaria SUNAT
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Validamos el dígito verificador de tu RUC en tiempo real bajo la norma de SUNAT.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Número de RUC (11 dígitos) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={11}
                      value={form.ruc}
                      onChange={(e) =>
                        setForm({ ...form, ruc: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="20600000001"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleConsultarPadronSunat}
                      disabled={!estadoRuc.valido || consultandoRuc}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold whitespace-nowrap transition"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {consultandoRuc ? 'Consultando...' : 'Autocompletar RUC'}
                    </button>
                  </div>

                  {/* Feedback en vivo del Algoritmo Módulo 11 */}
                  {form.ruc.length > 0 && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        estadoRuc.valido
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {estadoRuc.valido ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {estadoRuc.mensaje}{' '}
                        {estadoRuc.tipoContribuyente ? `(${estadoRuc.tipoContribuyente})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Razón Social Oficial *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.razon_social}
                      onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                      placeholder="GRUPO EMPRESARIAL S.A.C."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm uppercase text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Nombre Comercial (Aparecerá en tus Tickets)
                    </label>
                    <input
                      type="text"
                      value={form.nombre_comercial}
                      onChange={(e) => setForm({ ...form, nombre_comercial: e.target.value })}
                      placeholder="Mi Negocio"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Domicilio Fiscal / Dirección de Sucursal Principal
                  </label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Av. Principal 450, Miraflores - Lima"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>

                <button
                  type="button"
                  disabled={!estadoRuc.valido || !form.razon_social.trim()}
                  onClick={() => setPaso(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition"
                >
                  Continuar a Credenciales
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              PASO 3: CREDENCIALES DEL ADMINISTRADOR
          ========================================== */}
          {paso === 3 && (
            <form onSubmit={handleActivarTrial} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  Cuenta del Administrador Principal
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Con este usuario tendrás control total de sucursales, cajas y certificados SUNAT.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre Completo del Administrador *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.admin_nombre}
                    onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+51 999 888 777"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico Corporativo (Usuario de Login) *
                </label>
                <input
                  type="email"
                  required
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  placeholder="gerencia@tuempresa.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    Generar contraseña inicial de alta seguridad automáticamente
                  </div>
                  <input
                    type="checkbox"
                    checked={autogenerarClave}
                    onChange={(e) => setAutogenerarClave(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>

                {!autogenerarClave && (
                  <div>
                    <input
                      type="password"
                      required={!autogenerarClave}
                      minLength={8}
                      value={form.admin_password}
                      onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                      placeholder="Mínimo 8 caracteres..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={procesandoAlta}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition"
                >
                  <Rocket className="w-4 h-4" />
                  {procesandoAlta ? 'Aprovisionando Empresa...' : 'Activar mis 14 Días Gratis'}
                </button>
              </div>
            </form>
          )}

          {/* ==========================================
              PASO 4: TRIAL ACTIVADO Y CREDENCIALES GENERADAS
          ========================================== */}
          {paso === 4 && resultadoAlta && (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  ¡Tu entorno empresarial está listo y activo!
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hemos configurado tu Sede Principal, series F001/B001 en modo BETA SUNAT y 14 días de prueba en el Plan{' '}
                  <span className="text-indigo-300 font-semibold">
                    {resultadoAlta.suscripcion?.plan}
                  </span>
                  .
                </p>
              </div>

              {/* Tarjeta de Credenciales Iniciales */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-left space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-slate-400 font-sans font-semibold">
                    Credenciales de Administrador Generadas
                  </span>
                  <button
                    type="button"
                    onClick={handleCopiarCredenciales}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-xs transition"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Credenciales
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Empresa / RUC:</span>
                  <span className="text-slate-200 font-semibold">
                    {resultadoAlta.empresa?.razon_social} ({resultadoAlta.credenciales_iniciales?.ruc})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Usuario (Email):</span>
                  <span className="text-indigo-300">
                    {resultadoAlta.credenciales_iniciales?.usuario_email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contraseña Inicial:</span>
                  <span className="text-emerald-400 font-bold">
                    {resultadoAlta.credenciales_iniciales?.password_temporal ||
                      form.admin_password}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fin del Trial (14 días):</span>
                  <span className="text-amber-300">
                    {new Date(resultadoAlta.suscripcion?.vence_en).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleIrAlDashboard}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
              >
                Ingresar al Dashboard Ahora
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}