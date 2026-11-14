import React, { useState, useEffect } from 'react';
import { useAuthStore, imprimirTicketTermico } from '@heis/core';
import toast from 'react-hot-toast';
import {
  Settings,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  Save,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
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
    formato_papel: localStorage.getItem('heis_paper_format') || '80mm',
    metodo_impresion: localStorage.getItem('heis_print_method') || 'AUTO',
    nombre_impresora: localStorage.getItem('heis_printer_name') || 'POS-80',
    url_puente_local: localStorage.getItem('heis_print_bridge_url') || 'http://127.0.0.1/SERVER_PRINTPOS/PrintDoc.php',
  });

  const [probandoTicket, setProbandoTicket] = useState(false);

  const handleGuardar = (e) => {
    e.preventDefault();
    localStorage.setItem('heis_paper_format', form.formato_papel);
    localStorage.setItem('heis_print_method', form.metodo_impresion);
    localStorage.setItem('heis_printer_name', form.nombre_impresora);
    localStorage.setItem('heis_print_bridge_url', form.url_puente_local);
    toast.success('Configuración guardada exitosamente en el sistema');
  };

  const handleTicketPrueba = async () => {
    try {
      setProbandoTicket(true);
      const ticketPrueba = {
        titulo_comprobante: 'TICKET DE PRUEBA SISTEMA',
        serie: 'TEST',
        correlativo: '00000001',
        fecha_emision: new Date().toLocaleString('es-PE'),
        empresa: {
          nombre_comercial: form.nombre,
          ruc: form.ruc,
          direccion: form.direccion,
          telefono: form.telefono,
        },
        cliente: {
          nombre: 'TERMINAL CAJERO LOCAL',
          documento: '00000000',
        },
        items: [
          { cantidad: 1, descripcion: 'Prueba Cabezal Termico', precio_unitario: 0.00, subtotal: 0.00 },
          { cantidad: 1, descripcion: 'Prueba Densidad QR SUNAT', precio_unitario: 0.00, subtotal: 0.00 },
        ],
        op_gravadas: 0.00,
        igv: 0.00,
        total: 0.00,
        metodo_pago: 'TEST SISTEMA',
        abrirGaveta: true,
      };

      await imprimirTicketTermico(ticketPrueba, {
        formato: form.formato_papel,
        metodo: form.metodo_impresion,
        abrirGaveta: true,
      });

      toast.success('Comando de ticket de prueba y apertura de gaveta enviado');
    } catch (err) {
      toast.error(`Error al imprimir ticket de prueba: ${err.message}`);
    } finally {
      setProbandoTicket(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
          Configuración General del Negocio & Terminal POS
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Parámetros de facturación SUNAT, datos comerciales e impresión térmica ESC/POS
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

        {/* Impresora Térmica ESC/POS & Servidor Local */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-500" />
                <span>Ticketera Térmica ESC/POS & Gaveta de Dinero</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configuración local de impresión directa sin diálogos del navegador
              </p>
            </div>

            <button
              type="button"
              onClick={handleTicketPrueba}
              disabled={probandoTicket}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{probandoTicket ? 'Imprimiendo...' : 'Ticket de Prueba'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Ancho del Papel Térmico
              </label>
              <select
                value={form.formato_papel}
                onChange={(e) => setForm({ ...form, formato_papel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold focus:outline-none"
              >
                <option value="80mm">80 mm (Estándar Punto de Venta / 48 Columnas)</option>
                <option value="58mm">58 mm (Compacto Portátil / 32 Columnas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Método de Despacho de Impresión
              </label>
              <select
                value={form.metodo_impresion}
                onChange={(e) => setForm({ ...form, metodo_impresion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold focus:outline-none"
              >
                <option value="AUTO">Automático (Local Bridge ➔ WebSerial ➔ Silencioso)</option>
                <option value="BRIDGE_LOCAL">Puente Local Directo (PrintDoc.php / Agente POS)</option>
                <option value="WEB_SERIAL">WebSerial / WebUSB Directo por Hardware</option>
                <option value="IFRAME">Iframe Silencioso Pre-renderizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Nombre de la Impresora en Windows / Sistema
              </label>
              <input
                type="text"
                value={form.nombre_impresora}
                onChange={(e) => setForm({ ...form, nombre_impresora: e.target.value })}
                placeholder="POS-80"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                URL del Servidor Local de Impresión
              </label>
              <input
                type="text"
                value={form.url_puente_local}
                onChange={(e) => setForm({ ...form, url_puente_local: e.target.value })}
                placeholder="http://127.0.0.1/SERVER_PRINTPOS/PrintDoc.php"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs text-white shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
