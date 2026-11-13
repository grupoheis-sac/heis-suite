import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  Eye,
  CheckCircle2
} from 'lucide-react';
import api from '../../api';
import ModalNuevaCompra from './ModalNuevaCompra';
import { Modal } from '@heis/ui';
import { notificarError } from '../../utils/notificaciones';

export default function ComprasTab({ esAdmin, productos = [], onStockActualizado }) {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalCompraOpen, setModalCompraOpen] = useState(false);
  const [compraDetalle, setCompraDetalle] = useState(null);

  useEffect(() => {
    cargarCompras();
  }, []);

  const cargarCompras = async () => {
    try {
      setCargando(true);
      const res = await api.get('/compras');
      setCompras(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      notificarError('Error', 'No se pudieron cargar los registros de compras.');
    } finally {
      setCargando(false);
    }
  };

  const comprasFiltradas = compras.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (c.numero_comprobante && c.numero_comprobante.toLowerCase().includes(q)) ||
      (c.proveedor?.razon_social && c.proveedor.razon_social.toLowerCase().includes(q)) ||
      (c.proveedor?.ruc && c.proveedor.ruc.includes(q))
    );
  });

  const totalInvertido = compras.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
  const totalFacturas = compras.length;

  return (
    <div className="space-y-4 font-sora">
      {/* Resumen KPI de Compras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Ingresos / Facturas
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {totalFacturas}
            </span>
            <span className="text-[10px] text-slate-400">comprobantes de proveedores</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Inversión Total en Stock
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
              S/ {totalInvertido.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">mercadería hotelera adquirida</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Control de Inventario
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 block">
              Auto-Kardex Activo
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Costo y stock automáticos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar compra por número de factura o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={cargarCompras}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Recargar compras"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {esAdmin && (
          <button
            type="button"
            onClick={() => setModalCompraOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ingreso de Stock</span>
          </button>
        )}
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
        {cargando ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Cargando historial de compras...
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="py-12 text-center p-6 space-y-2">
            <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No hay compras registradas
            </h3>
            <p className="text-xs text-slate-400">
              {busqueda ? 'No se encontraron compras con los criterios de búsqueda.' : 'Registra tus facturas para alimentar el stock automáticamente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Total Factura</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comprasFiltradas.map((c) => {
                  const itemCount = Array.isArray(c.items_detalle) ? c.items_detalle.length : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-white">
                        <span className="uppercase px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mr-2">
                          {c.tipo_comprobante}
                        </span>
                        {c.numero_comprobante}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {c.proveedor?.razon_social || 'Proveedor no especificado'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          RUC: {c.proveedor?.ruc || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {c.fecha_compra}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        S/ {parseFloat(c.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setCompraDetalle(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Compra */}
      {modalCompraOpen && (
        <ModalNuevaCompra
          isOpen={modalCompraOpen}
          onClose={() => setModalCompraOpen(false)}
          productos={productos}
          onSuccess={() => {
            cargarCompras();
            if (onStockActualizado) onStockActualizado();
          }}
        />
      )}

      {/* Modal Detalle de Compra */}
      {compraDetalle && (
        <Modal
          isOpen={Boolean(compraDetalle)}
          onClose={() => setCompraDetalle(null)}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          title={`Detalle de Compra #${compraDetalle.numero_comprobante}`}
          subtitle={`Proveedor: ${compraDetalle.proveedor?.razon_social || ''} • Fecha: ${compraDetalle.fecha_compra}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 font-sora">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Proveedor:</span>
                <strong className="text-slate-800 dark:text-white">{compraDetalle.proveedor?.razon_social}</strong>
                <p className="font-mono text-slate-500 text-[11px]">RUC: {compraDetalle.proveedor?.ruc}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Comprobante:</span>
                <strong className="text-slate-800 dark:text-white uppercase">{compraDetalle.tipo_comprobante} {compraDetalle.numero_comprobante}</strong>
                <p className="font-mono text-slate-500 text-[11px]">Emitido el {compraDetalle.fecha_compra}</p>
              </div>
            </div>

            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3 text-center">Cant.</th>
                    <th className="py-2 px-3 text-right">Costo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(compraDetalle.items_detalle || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {it.nombre || `Producto #${it.producto_id}`}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        +{it.cantidad}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        S/ {parseFloat(it.costo_unitario || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        S/ {parseFloat(it.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs">
              <span className="text-emerald-900 dark:text-emerald-200">TOTAL FACTURADO:</span>
              <span className="text-base font-mono text-emerald-700 dark:text-emerald-300">
                S/ {parseFloat(compraDetalle.total || 0).toFixed(2)}
              </span>
            </div>

            {compraDetalle.observaciones && (
              <p className="text-xs text-slate-500 italic">
                Nota: {compraDetalle.observaciones}
              </p>
            )}

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setCompraDetalle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

