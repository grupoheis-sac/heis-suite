/**
 * POSModalPaciente.jsx — Modal de Registro Rápido de Pacientes (RENIEC / SUNAT)
 * Extraído de POS.jsx (P14) — Componente independiente, ~160 líneas
 */
import React from 'react';
import { X, UserPlus, Search, CheckCircle2 } from 'lucide-react';

export default function POSModalPaciente({
  visible,
  onClose,
  tipoDoc,
  setTipoDoc,
  numDoc,
  setNumDoc,
  nombre,
  setNombre,
  direccion,
  setDireccion,
  telefono,
  setTelefono,
  consultando,
  guardando,
  onConsultar,
  onSubmit
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Registro Rápido de Paciente</h3>
              <p className="text-[11px] text-slate-400 font-medium">Consulta automática vía RENIEC o SUNAT</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-3.5">
          {/* Selector Tipo Documento */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              {['DNI', 'RUC'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => { setTipoDoc(tipo); setNumDoc(''); setNombre(''); }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tipoDoc === tipo ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tipo === 'DNI' ? 'DNI (RENIEC - 8 dígitos)' : 'RUC (SUNAT - 11 dígitos)'}
                </button>
              ))}
            </div>
          </div>

          {/* Número de Documento + Botón Consulta */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">Número de {tipoDoc}</label>
            <div className="flex gap-2">
              <input
                type="text" required
                maxLength={tipoDoc === 'DNI' ? 8 : 11}
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onConsultar(); } }}
                placeholder={tipoDoc === 'DNI' ? 'Ej. 74829103' : 'Ej. 20601234567'}
                className="flex-1 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button type="button" disabled={consultando} onClick={onConsultar}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs">
                {consultando ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Consultar {tipoDoc === 'DNI' ? 'RENIEC' : 'SUNAT'}</span>
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
              {tipoDoc === 'DNI' ? 'Nombres y Apellidos del Paciente' : 'Razón Social'}
            </label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese o consulte automáticamente..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">Dirección Domiciliaria o Fiscal</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Av. / Jr. / Calle..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp de Contacto</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 987 654 321"
              className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono font-medium border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>

          <div className="pt-3 flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Guardar y Seleccionar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
