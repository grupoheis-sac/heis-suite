import React, { useState, useEffect } from 'react';
import { Modal } from '@heis/ui';
import { ShoppingCart, Plus, Trash2, Save, Calendar, FileText, Building2, PackageCheck } from 'lucide-react';
import api from '../../api';
import { notificarExito, notificarError } from '../../utils/notificaciones';

export default function ModalNuevaCompra({ isOpen, onClose, productos = [], onSuccess }) {
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Form Fields
  const [proveedorId, setProveedorId] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('factura');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  // Items en la factura
  const [items, setItems] = useState([
    { producto_id: '', cantidad: 1, costo_unitario: '', nombre: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      cargarProveedores();
      setNumeroComprobante('');
      setTipoComprobante('factura');
      setFechaCompra(new Date().toISOString().split('T')[0]);
      setObservaciones('');
      setItems([{ producto_id: '', cantidad: 1, costo_unitario: '', nombre: '' }]);
    }
  }, [isOpen]);

  const cargarProveedores = async () => {
    try {
      setCargandoProveedores(true);
      const res = await api.get('/proveedores?activo=true');
      const list = res.data?.data || res.data || [];
      setProveedores(list);
      if (list.length > 0 && !proveedorId) {
        setProveedorId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoProveedores(false);
    }
  };

  const handleAgregarFila = () => {
    setItems([
      ...items,
      { producto_id: '', cantidad: 1, costo_unitario: '', nombre: '' }
    ]);
  };

  const handleEliminarFila = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, campo, valor) => {
    const nuevos = [...items];
    nuevos[index][campo] = valor;

    if (campo === 'producto_id') {
      const prod = productos.find(p => String(p.id) === String(valor));
      if (prod) {
        nuevos[index].nombre = prod.nombre;
        if (!nuevos[index].costo_unitario || parseFloat(nuevos[index].costo_unitario) === 0) {
          nuevos[index].costo_unitario = prod.costo ? parseFloat(prod.costo) : '';
        }
      }
    }

    setItems(nuevos);
  };

  const totalCalculado = items.reduce((sum, item) => {
    const qty = parseInt(item.cantidad, 10) || 0;
    const cost = parseFloat(item.costo_unitario) || 0;
    return sum + (qty * cost);
  }, 0);

  const subtotalCalculado = +(totalCalculado / 1.18).toFixed(2);
  const igvCalculado = +(totalCalculado - subtotalCalculado).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!proveedorId) {
      notificarError('Proveedor requerido', 'Seleccione un proveedor para la compra.');
      return;
    }
    if (!numeroComprobante.trim()) {
      notificarError('Comprobante requerido', 'Ingrese el número de factura o boleta.');
      return;
    }

    const itemsValidos = items.filter(
      it => it.producto_id && (parseInt(it.cantidad, 10) > 0)
    );

    if (itemsValidos.length === 0) {
      notificarError('Items vacíos', 'Debe agregar al menos un producto con cantidad mayor a 0.');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        proveedor_id: proveedorId,
        numero_comprobante: numeroComprobante.trim(),
        tipo_comprobante: tipoComprobante,
        fecha_compra: fechaCompra,
        subtotal: subtotalCalculado,
        igv: igvCalculado,
        total: totalCalculado,
        observaciones: observaciones || null,
        items_detalle: itemsValidos.map(it => ({
          producto_id: it.producto_id,
          nombre: it.nombre || productos.find(p => String(p.id) === String(it.producto_id))?.nombre || 'Producto',
          cantidad: parseInt(it.cantidad, 10),
          costo_unitario: parseFloat(it.costo_unitario) || 0,
          subtotal: +(parseInt(it.cantidad, 10) * (parseFloat(it.costo_unitario) || 0)).toFixed(2)
        }))
      };

      await api.post('/compras', payload);
      notificarExito('Stock ingresado', `Compra ${numeroComprobante} registrada y stock actualizado.`);
      onSuccess();
      onClose();
    } catch (err) {
      notificarError('Error al guardar compra', err.response?.data?.message || 'No se pudo registrar la compra.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
      title="Registrar Compra e Ingreso de Stock"
      subtitle="Ingresa factura de proveedor para incrementar stock y actualizar costos de compra"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sora">
        {/* Datos de Cabecera */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Proveedor *
            </label>
            <select
              required
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razon_social} ({p.ruc})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              N° Comprobante *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: F001-004521"
              value={numeroComprobante}
              onChange={(e) => setNumeroComprobante(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
                className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="factura">Factura</option>
                <option value="boleta">Boleta</option>
                <option value="guia">Guía</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Productos a Ingresar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Detalle de Productos a Ingresar al Inventario
            </h4>
            <button
              type="button"
              onClick={handleAgregarFila}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Producto</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineTotal = (parseInt(item.cantidad, 10) || 0) * (parseFloat(item.costo_unitario) || 0);

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.producto_id}
                      onChange={(e) => handleItemChange(idx, 'producto_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.codigo}] {p.nombre} (Stock actual: {p.stock_actual})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      placeholder="Cantidad"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>

                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Costo u."
                      value={item.costo_unitario}
                      onChange={(e) => handleItemChange(idx, 'costo_unitario', e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="w-24 text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    S/ {lineTotal.toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarFila(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Observaciones y Totales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones de Compra / N° Guía Remisión
            </label>
            <input
              type="text"
              placeholder="Ej: Lote vencimiento 2027, chofer proveedor Juan"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-1 text-right">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Subtotal:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-200">S/ {subtotalCalculado.toFixed(2)}</strong>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>IGV (18%):</span>
              <strong className="font-mono text-slate-700 dark:text-slate-200">S/ {igvCalculado.toFixed(2)}</strong>
            </div>
            <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex justify-between pt-1 border-t border-blue-200/60 dark:border-blue-800/40">
              <span>TOTAL COMPRA:</span>
              <strong className="text-sm font-mono text-blue-700 dark:text-blue-400">S/ {totalCalculado.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || totalCalculado <= 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{guardando ? 'Guardando e Incrementando Stock...' : 'Confirmar Ingreso de Stock'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

