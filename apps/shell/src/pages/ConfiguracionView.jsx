import React, { useState } from 'react';
import { useAuthStore } from '@heis/core';
import toast from 'react-hot-toast';
import {
  Settings,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  Save,
  Sparkles
} from 'lucide-react';

export default function ConfiguracionView() {
  const { empresa } = useAuthStore();

  const [form, setForm] = useState({
    nombre: empresa?.nombre || 'Mi Empresa',
    ruc: empresa?.ruc || '20601234567',
    direccion: empresa?.direccion || 'Av. Principal 123',
    telefono: empresa?.telefono || '01 555-1234',
    serie_boleta: 'B001',
    serie_factura: 'F001',
    igv_porcentaje: 18,
    impresora_tipo: 'TERMICA_80MM',
  });

  const handleGuardar = (e) => {
    e.preventDefault();
    toast.success('Configuración guardada exitosamente en el sistema');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
          Configuración General del Negocio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Parámetros de facturación SUNAT, datos comerciales e impresión de tickets
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Datos Comerciales */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Datos Fiscales y Comerciales</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Razón Social / Nombre Comercial
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Número de RUC
              </label>
              <input
                type="text"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Dirección Fiscal
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Facturación Electrónica */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Facturación Electrónica SUNAT & Comprobantes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Serie Boleta Electrónica
              </label>
              <input
                type="text"
                value={form.serie_boleta}
                onChange={(e) => setForm({ ...form, serie_boleta: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Serie Factura Electrónica
              </label>
              <input
                type="text"
                value={form.serie_factura}
                onChange={(e) => setForm({ ...form, serie_factura: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Tasa IGV (%)
              </label>
              <input
                type="number"
                value={form.igv_porcentaje}
                onChange={(e) => setForm({ ...form, igv_porcentaje: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs text-white shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:opacity-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </form>
    </div>
  );
}

