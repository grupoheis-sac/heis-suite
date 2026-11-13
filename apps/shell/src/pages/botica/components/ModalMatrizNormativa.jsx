import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  CreditCard,
  GraduationCap,
  Lock,
  CheckCircle2,
  Award,
  FileText,
  Sparkles,
  UserPlus,
  X,
  Users
} from 'lucide-react';

export default function ModalMatrizNormativa({
  isOpen,
  onClose,
  cajerosCount = 0,
  qfCount = 0,
  adminCount = 0,
  onFiltrarRol,
  onNuevoColaborador
}) {
  // Manejo de tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-matriz-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden font-sora animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── ENCABEZADO DEL MODAL EJECUTIVO ─── */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#00855E] to-[#00B884] text-white shadow-md shadow-emerald-600/25 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="modal-matriz-titulo"
                  className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora"
                >
                  Matriz de Atribuciones y Alcance Normativo
                </h2>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 shrink-0">
                  DIGEMID • Sunat POS • Seguridad
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-xl">
                Guía técnica de facultades legales, control de psicotrópicos, cobros y gobernanza de cuentas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Contadores consolidados */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50 font-bold">
                {cajerosCount} Cajeros
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/50 font-bold">
                {qfCount} QF Colegiados
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/50 font-bold">
                {adminCount} Admins
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cerrar modal (Esc)"
            >
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md">
                ESC
              </kbd>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── CUERPO DEL MODAL: 3 TARJETAS ESPECIALIZADAS ─── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            {/* ═══ TARJETA 1: ROL CAJERO (AZUL / SKY / INDIGO) ═══ */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-5 border border-blue-200/90 dark:border-blue-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="w-32 h-32 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-2xl absolute -top-8 -right-8 pointer-events-none" />

              <div className="space-y-3.5 relative">
                {/* Header de la Tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    <CreditCard className="w-3 h-3 text-blue-600" />
                    Punto de Venta
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-black text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-lg border border-blue-200/70 dark:border-blue-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {cajerosCount} en mostrador
                  </span>
                </div>

                {/* Perfil & Título */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                      Cajero / Dispensador POS
                    </h3>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                      Atención Mostrador & Caja Chica
                    </p>
                  </div>
                </div>

                {/* Bloque Legal / Sunat */}
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    Marco Operativo & Sunat
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Atención rápida en mostrador, emisión de boletas/facturas electrónicas y custodia del dinero de caja por turno.
                  </p>
                </div>

                {/* Atribuciones Habilitadas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Permisos Clave Habilitados:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Venta rápida en POS con atajo <strong className="text-blue-700 dark:text-blue-300 font-bold">F2</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Apertura, arqueos ciegos y cierre de turno</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Cobro en efectivo, Yape, Plin y tarjetas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Consulta de existencias y principios activos</span>
                    </li>
                  </ul>
                </div>

                {/* Límite de Seguridad */}
                <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-[10.5px]">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    <strong className="text-slate-700 dark:text-slate-300 font-bold">Restricción:</strong> Sin acceso a costos de compra, márgenes ni anulación de comprobantes pasados.
                  </span>
                </div>
              </div>

              {/* Botonera de Acción */}
              <div className="pt-3.5 mt-4 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFiltrarRol?.('cajeros');
                    onClose();
                  }}
                  className="px-2.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition-all cursor-pointer flex-1 text-center"
                >
                  Ver ({cajerosCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNuevoColaborador?.('Cajero');
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 flex-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>
              </div>
            </div>

            {/* ═══ TARJETA 2: QUÍMICO FARMACÉUTICO (ESMERALDA / TEAL / DIGEMID) ═══ */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-teal-300/80 dark:border-teal-800/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group ring-1 ring-teal-400/20">
              <div className="w-32 h-32 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-2xl absolute -top-8 -right-8 pointer-events-none" />

              <div className="space-y-3.5 relative">
                {/* Header de la Tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100/90 dark:bg-teal-950 text-teal-900 dark:text-teal-200 text-[10px] font-black uppercase tracking-wider border border-teal-300 dark:border-teal-700">
                    <GraduationCap className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                    Responsable Sanitario
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-black text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/40 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                    {qfCount} colegiado(s)
                  </span>
                </div>

                {/* Perfil & Título */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00855E] to-[#00B884] text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                      Químico Farmacéutico (QF)
                    </h3>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">
                      Dirección Técnica • D.S. 014-2011-SA
                    </p>
                  </div>
                </div>

                {/* Bloque Legal / DIGEMID */}
                <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    Regulación DIGEMID & Salud
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Firma técnica de dispensaciones con receta médica, custodia de psicotrópicos y envío de balances a DIGEMID.
                  </p>
                </div>

                {/* Atribuciones Habilitadas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Permisos Clave Habilitados:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Validación de <strong className="text-teal-800 dark:text-teal-300 font-bold">Recetas Médicas Retenidas</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Custodia y firma de Libro de Psicotrópicos (Lista IV)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Bloqueo de lotes en cuarentena y bajas por vencimiento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Control de temperatura, humedad y Buenas Prácticas (BPO)</span>
                    </li>
                  </ul>
                </div>

                {/* Exigencia Legal Colegiatura */}
                <div className="p-2.5 rounded-xl bg-teal-100/70 dark:bg-teal-950/60 border border-teal-300/80 dark:border-teal-700 flex items-start gap-2 text-[10.5px]">
                  <Award className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-teal-900 dark:text-teal-200 font-medium">
                    <strong className="font-black">Requisito Oficial:</strong> Requiere número de <strong className="font-bold underline">Colegiatura CQFP</strong> registrado para firmar folios e informes sanitarios.
                  </span>
                </div>
              </div>

              {/* Botonera de Acción */}
              <div className="pt-3.5 mt-4 border-t border-teal-100 dark:border-teal-900/40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFiltrarRol?.('farmaceuticos');
                    onClose();
                  }}
                  className="px-2.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-teal-800 dark:text-teal-300 text-[11px] font-bold transition-all cursor-pointer flex-1 text-center"
                >
                  Ver ({qfCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNuevoColaborador?.('Farmacéutico');
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00855E] to-[#00B884] hover:from-[#00704F] hover:to-[#009E71] text-white text-xs font-black shadow-md shadow-emerald-700/25 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 flex-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo QF</span>
                </button>
              </div>
            </div>

            {/* ═══ TARJETA 3: ADMINISTRADOR GENERAL (PÚRPURA / ÍNDIGO / GOBERNANZA) ═══ */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-5 border border-purple-200/90 dark:border-purple-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="w-32 h-32 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-2xl absolute -top-8 -right-8 pointer-events-none" />

              <div className="space-y-3.5 relative">
                {/* Header de la Tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-950 text-purple-900 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                    <ShieldCheck className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                    Gobernanza Total
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-black text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                    {adminCount} superusuario(s)
                  </span>
                </div>

                {/* Perfil & Título */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                      Administrador General
                    </h3>
                    <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                      Gestión Comercial, Sedes & Seguridad
                    </p>
                  </div>
                </div>

                {/* Bloque Legal / Negocio */}
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/50 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Auditoría & Control Estratégico
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Control irrestricto de compras a droguerías, márgenes de ganancia, alta de sedes anexas y gestión de cuentas.
                  </p>
                </div>

                {/* Atribuciones Habilitadas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Permisos Clave Habilitados:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Auditoría de <strong className="text-purple-800 dark:text-purple-300 font-bold">Utilidades, Márgenes y Kardex</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Configuración de Sedes, Sucursales y Series Sunat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Alta de personal, reseteo de claves y asignación de roles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Aprobación de compras a droguerías y créditos</span>
                    </li>
                  </ul>
                </div>

                {/* Privilegio Superusuario */}
                <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 border border-purple-300/80 dark:border-purple-700 flex items-start gap-2 text-[10.5px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-purple-900 dark:text-purple-200 font-medium">
                    <strong className="font-black">Acceso Total:</strong> Privilegios globales sin restricciones en todas las sedes y módulos de la botica.
                  </span>
                </div>
              </div>

              {/* Botonera de Acción */}
              <div className="pt-3.5 mt-4 border-t border-purple-100 dark:border-purple-900/40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFiltrarRol?.('administradores');
                    onClose();
                  }}
                  className="px-2.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[11px] font-bold transition-all cursor-pointer flex-1 text-center"
                >
                  Ver ({adminCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNuevoColaborador?.('Administrador');
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-xs shadow-purple-700/30 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 flex-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER DEL MODAL ─── */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8] shrink-0" />
            <span>
              Directivas sanitarias según <strong>D.S. 014-2011-SA</strong> y normativa Sunat para puntos de venta farmacéuticos.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Matriz
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
