/**
 * POSModalClienteRapido.jsx — Modal de Registro Rápido de Clientes para Ferretería
 * Permite registrar clientes DNI / RUC al vuelo desde el POS sin salir de la pantalla de venta.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Search, Building2, User, Phone, MapPin, Mail, CreditCard, Check } from 'lucide-react';

export default function POSModalClienteRapido({
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
 email,
 setEmail,
 limiteCredito,
 setLimiteCredito,
 consultando,
 guardando,
 onConsultar,
 onSubmit
}) {
 if (!visible) return null;

 return createPortal(
 <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
 <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col my-auto soft-card-shadow">
 {/* Header */}
 <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
 <UserPlus className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 ">
 Registro Rápido de Cliente
 </h3>
 <p className="text-[11px] text-slate-400 font-medium">
 Alta inmediata para Boletas, Facturas o Ventas a Crédito
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={onSubmit} className="p-6 space-y-3.5">
 {/* Selector Tipo Documento */}
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 ">
 Tipo de Documento
 </label>
 <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
 {['DNI', 'RUC'].map((tipo) => (
 <button
 key={tipo}
 type="button"
 onClick={() => {
 setTipoDoc(tipo);
 setNumDoc('');
 setNombre('');
 }}
 className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
 tipoDoc === tipo
 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
 : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
 }`}
 >
 {tipo === 'DNI' ? (
 <>
 <User className="w-3.5 h-3.5" />
 <span>DNI (Persona Natural)</span>
 </>
 ) : (
 <>
 <Building2 className="w-3.5 h-3.5" />
 <span>RUC (Empresa / Contratista)</span>
 </>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Número de Documento + Botón Consulta */}
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 ">
 Número de {tipoDoc}
 </label>
 <div className="flex gap-2">
 <input
 type="text"
 required
 maxLength={tipoDoc === 'DNI' ? 8 : 11}
 value={numDoc}
 onChange={(e) => setNumDoc(e.target.value.replace(/\D/g, ''))}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 onConsultar?.();
 }
 }}
 placeholder={tipoDoc === 'DNI' ? 'Ej. 74829103' : 'Ej. 20601234567'}
 className="flex-1 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 <button
 type="button"
 disabled={consultando}
 onClick={onConsultar}
 className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/30 "
 >
 {consultando ? (
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <Search className="w-3.5 h-3.5" />
 )}
 <span>Consultar</span>
 </button>
 </div>
 </div>

 {/* Nombre / Razón Social */}
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 ">
 {tipoDoc === 'DNI' ? 'Nombres y Apellidos del Cliente' : 'Razón Social de la Empresa'}
 </label>
 <input
 type="text"
 required
 value={nombre}
 onChange={(e) => setNombre(e.target.value)}
 placeholder="Ingrese o consulte nombre completo..."
 className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 "
 />
 </div>

 {/* Teléfono y Dirección en 2 columnas */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
 <Phone className="w-3 h-3 text-indigo-500" /> Teléfono / WhatsApp
 </label>
 <input
 type="text"
 value={telefono}
 onChange={(e) => setTelefono(e.target.value)}
 placeholder="Ej. 987654321"
 className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
 <Mail className="w-3 h-3 text-indigo-500" /> Correo Electrónico
 </label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="cliente@ejemplo.com"
 className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>
 </div>

 {/* Dirección */}
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
 <MapPin className="w-3 h-3 text-indigo-500" /> Dirección de Entrega / Fiscal
 </label>
 <input
 type="text"
 value={direccion}
 onChange={(e) => setDireccion(e.target.value)}
 placeholder="Av. Los Constructores 123, Urb..."
 className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 {/* Límite de Crédito (Opcional para clientes frecuentes/maestros) */}
 <div>
 <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
 <CreditCard className="w-3 h-3 text-indigo-500" /> Límite de Crédito Autorizado (S/)
 </label>
 <input
 type="number"
 min="0"
 step="50"
 value={limiteCredito}
 onChange={(e) => setLimiteCredito(e.target.value)}
 placeholder="0.00 (Dejar en 0 si no tiene línea de crédito)"
 className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 {/* Botones de Acción */}
 <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer "
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardando}
 className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer "
 >
 {guardando ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <Check className="w-4 h-4 stroke-[3]" />
 )}
 <span>Guardar y Asignar al Ticket</span>
 </button>
 </div>
 </form>
 </div>
 </div>,
 document.body
 );
}
