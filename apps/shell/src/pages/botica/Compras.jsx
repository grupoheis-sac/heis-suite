import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import ModalCargarFactura from './components/ModalCargarFactura';
import ModalRegistrarDrogueria from './components/ModalRegistrarDrogueria';
import {
  Truck,
  Plus,
  PlusCircle,
  Search,
  Calendar,
  DollarSign,
  Package,
  Building2,
  Trash2,
  Eye,
  CheckCircle,
  CheckCircle2,
  X,
  FileText,
  Boxes,
  ShieldCheck,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  AlertTriangle,
  Clock,
  Info
} from 'lucide-react';
import DropdownPill from './components/DropdownPill';
import DatePickerPill from './components/DatePickerPill';

const COMPROBANTES_COMPRA = [
  { value: 'Factura', label: 'Factura Electrónica', subtitle: 'Con crédito fiscal IGV' },
  { value: 'Boleta', label: 'Boleta de Venta', subtitle: 'Comprobante simplificado' },
  { value: 'Guía', label: 'Guía de Remisión', subtitle: 'Sustento de traslado/ingreso' }
];

const PAGOS_COMPRA = [
  { value: 'Contado', label: 'Contado', subtitle: 'Cancelación inmediata' },
  { value: 'Credito', label: 'Crédito', subtitle: 'Pago pactado a plazo' }
];

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalCargarFactura, setModalCargarFactura] = useState(false);
  const [modalNuevaDrogueria, setModalNuevaDrogueria] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  const descargarPlantilla = async () => {
    try {
      toast.loading('Generando plantilla oficial de compras en Excel...', { id: 'plantilla-down' });
      const response = await api.get('/compras/plantilla-excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_carga_facturas_botica.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Plantilla descargada con éxito', { id: 'plantilla-down' });
    } catch (e) {
      toast.error('Error al descargar la plantilla de compras', { id: 'plantilla-down' });
    }
  };

  // Form State
  const [form, setForm] = useState({
    id_proveedor: '',
    tipo_comprobante: 'Factura',
    serie: 'F001',
    numero: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    guia_remision: '',
    tipo_pago: 'Contado',
    credito_dias: 30,
    notas: ''
  });

  const [items, setItems] = useState([]);
  const [busquedaMed, setBusquedaMed] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resCompras, resProv, resMeds] = await Promise.all([
        api.get('/compras'),
        api.get('/compras/proveedores'),
        api.get('/medicamentos?limit=100')
      ]);

      if (resCompras.data.success) setCompras(resCompras.data.compras);
      if (resProv.data.success) setProveedores(resProv.data.proveedores);
      if (resMeds.data.success) setMedicamentos(resMeds.data.medicamentos);
    } catch (err) {
      console.error('Error al cargar compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Atajo de teclado para cerrar modales con Escape
  useEffect(() => {
    if (!modalNuevo && !compraSeleccionada) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalNuevo) setModalNuevo(false);
        if (compraSeleccionada) setCompraSeleccionada(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalNuevo, compraSeleccionada]);

  // Cálculo dinámico de fecha de vencimiento de pago si es a crédito
  const calcularFechaPago = () => {
    if (form.tipo_pago !== 'Credito') return null;
    const base = form.fecha_emision ? new Date(`${form.fecha_emision}T12:00:00`) : new Date();
    base.setDate(base.getDate() + (parseInt(form.credito_dias) || 30));
    return base.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Semáforo FEFO por ítem según meses de vida útil
  const getFefoStatus = (fechaVenc) => {
    if (!fechaVenc) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(`${fechaVenc}T00:00:00`);
    if (isNaN(venc.getTime())) return null;

    if (venc < hoy) {
      return { tipo: 'vencido', label: 'VENCIDO', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
    const diffMeses = (venc.getFullYear() - hoy.getFullYear()) * 12 + (venc.getMonth() - hoy.getMonth());
    if (diffMeses < 6) {
      return { tipo: 'critico', label: `${diffMeses} m (Alerta BPA)`, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (diffMeses < 12) {
      return { tipo: 'proximo', label: `${diffMeses} m`, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    return { tipo: 'optimo', label: `${diffMeses} m (Óptimo)`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const agregarMedicamentoACompra = (med) => {
    // Verificar si ya está en la lista
    if (items.some((i) => i.id_medicamento === med.id)) {
      toast.error('El medicamento ya fue agregado a la lista de compra.');
      return;
    }

    const unAnioDespues = new Date();
    unAnioDespues.setFullYear(unAnioDespues.getFullYear() + 2);
    const fechaDefecto = unAnioDespues.toISOString().split('T')[0];

    setItems([
      ...items,
      {
        id_medicamento: med.id,
        nombre: med.nombre_comercial,
        concentracion: med.concentracion,
        registro_sanitario: med.registro_sanitario || 'RS-VIGENTE',
        laboratorio: med.laboratorio || 'Lab. Farmacéutico',
        numero_lote: '',
        fecha_vencimiento: fechaDefecto,
        cantidad_cajas: 1,
        precio_unitario: parseFloat(med.precio_compra) || 10.0
      }
    ]);
    setBusquedaMed('');
    toast.success(`"${med.nombre_comercial}" agregado`);
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevos = [...items];
    nuevos[index][campo] = valor;
    setItems(nuevos);
  };

  const eliminarItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calcularTotal = () => {
    return items.reduce((acc, item) => {
      const c = parseFloat(item.cantidad_cajas) || 0;
      const p = parseFloat(item.precio_unitario) || 0;
      return acc + c * p;
    }, 0);
  };

  const totalFactura = calcularTotal();
  const subtotalGravado = totalFactura > 0 ? parseFloat((totalFactura / 1.18).toFixed(2)) : 0;
  const igvFactura = totalFactura > 0 ? parseFloat((totalFactura - subtotalGravado).toFixed(2)) : 0;

  const handleGuardarCompra = async (e) => {
    e.preventDefault();

    if (!form.id_proveedor) {
      toast.error('Seleccione la droguería o laboratorio proveedor');
      return;
    }

    if (!form.serie.trim() || !form.numero.trim()) {
      toast.error('Ingrese la serie y número de factura o comprobante');
      return;
    }

    if (items.length === 0) {
      toast.error('Debe agregar al menos un medicamento a la compra');
      return;
    }

    // Validar lotes y fechas de vencimiento con reglas DIGEMID
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const it of items) {
      if (!it.numero_lote.trim()) {
        toast.error(`Ingrese el número de lote físico para: ${it.nombre}`);
        return;
      }
      if (!it.fecha_vencimiento) {
        toast.error(`Seleccione la fecha de vencimiento para: ${it.nombre}`);
        return;
      }
      const fechaVenc = new Date(`${it.fecha_vencimiento}T00:00:00`);
      if (fechaVenc < hoy) {
        toast.error(`El lote "${it.numero_lote}" de "${it.nombre}" está vencido. No se puede ingresar por normativa DIGEMID.`);
        return;
      }
      if (parseFloat(it.cantidad_cajas) <= 0) {
        toast.error(`La cantidad de cajas para ${it.nombre} debe ser mayor a 0`);
        return;
      }
      if (parseFloat(it.precio_unitario) < 0) {
        toast.error(`El precio unitario de ${it.nombre} no puede ser negativo`);
        return;
      }
    }

    try {
      toast.loading('Registrando factura e ingresando lotes al sistema FEFO...', { id: 'guardar-compra' });
      const payload = {
        ...form,
        credito_dias: parseInt(form.credito_dias) || 30,
        items: items.map((i) => ({
          id_medicamento: i.id_medicamento,
          numero_lote: i.numero_lote.trim().toUpperCase(),
          fecha_vencimiento: i.fecha_vencimiento,
          cantidad_cajas: parseFloat(i.cantidad_cajas),
          precio_unitario: parseFloat(i.precio_unitario)
        }))
      };

      const res = await api.post('/compras', payload);
      if (res.data.success) {
        toast.success('Factura farmacéutica registrada. Stock y Lotes asignados a FEFO.', { id: 'guardar-compra' });
        setModalNuevo(false);
        setItems([]);
        setForm({
          id_proveedor: '',
          tipo_comprobante: 'Factura',
          serie: 'F001',
          numero: '',
          fecha_emision: new Date().toISOString().split('T')[0],
          guia_remision: '',
          tipo_pago: 'Contado',
          credito_dias: 30,
          notas: ''
        });
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la compra', { id: 'guardar-compra' });
    }
  };

  const medsFiltrados = busquedaMed.trim()
    ? medicamentos.filter(
        (m) =>
          m.nombre_comercial.toLowerCase().includes(busquedaMed.toLowerCase()) ||
          (m.nombre_generico && m.nombre_generico.toLowerCase().includes(busquedaMed.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sora">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Truck className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Compras Farmacéuticas y Registro de Lotes
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                BPA & FEFO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Abastecimiento con laboratorios y droguerías con control de vencimiento y trazabilidad FEFO.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer font-sora"
            title="Descargar formato Excel oficial con ejemplos"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Plantilla</span> Excel
          </button>

          <button
            type="button"
            onClick={() => setModalNuevo(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer font-sora"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            Registro Manual
          </button>

          <button
            type="button"
            onClick={() => setModalCargarFactura(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer font-sora"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Cargar Factura</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/20 text-white font-extrabold uppercase tracking-wider">
              FEFO
            </span>
          </button>
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-[24px] soft-card-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-4 px-5">Comprobante</th>
                <th className="py-4 px-5">Proveedor / Droguería</th>
                <th className="py-4 px-5">Fecha Registro</th>
                <th className="py-4 px-5">Modalidad</th>
                <th className="py-4 px-5">Ítems</th>
                <th className="py-4 px-5">Total (S/)</th>
                <th className="py-4 px-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cargando historial de compras...</span>
                    </div>
                  </td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">
                          Aún no se han registrado compras farmacéuticas
                        </p>
                        <p className="text-xs text-slate-400">
                          Carga tu primera factura electrónica en XML emitida por tu droguería o usa la plantilla en Excel para ingresar stock y lotes FEFO.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setModalCargarFactura(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Cargar Factura Ahora
                        </button>
                        <button
                          onClick={descargarPlantilla}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                        >
                          Bajar Formato Excel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                compras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      <span className="text-[10px] text-teal-600 block font-semibold">
                        {c.tipo_comprobante}
                      </span>
                      <span className="font-mono">{c.serie}-{c.numero}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">
                        {c.proveedor?.razon_social || 'Proveedor Directo'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        RUC: {c.proveedor?.numero_documento || 'Sin RUC'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono">
                      {new Date(c.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.tipo_pago === 'Contado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {c.tipo_pago}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {c.detalles?.length || 0} medicamentos
                    </td>
                    <td className="py-3.5 px-5 font-black text-slate-800 text-sm font-mono">
                      S/ {parseFloat(c.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => setCompraSeleccionada(c)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                        title="Ver Lotes Ingresados"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      {modalNuevo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalNuevo(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
        >
          <form
            onSubmit={handleGuardarCompra}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-100 max-w-5xl w-full shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default font-sora max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera del Modal (shrink-0) */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-100 shadow-xs shrink-0">
                  <Truck className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">
                      Registrar Factura de Droguería / Laboratorio
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-100/70 text-emerald-800 border border-emerald-200 shrink-0">
                      BPA & FEFO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    Ingreso formal de mercadería, recepción técnica y asignación de lotes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevo(false);
                    setModalCargarFactura(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-700 text-xs font-bold border border-teal-200/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Cargar archivo XML de SUNAT o Excel oficial de droguería"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Cargar XML / Excel
                </button>
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Contenido con Scroll Interno Seguro (flex-1) */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 sm:space-y-5 custom-modal-scroll">
              {/* Datos Principales del Comprobante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Droguería / Laboratorio Proveedor *
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalNuevaDrogueria(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer hover:underline transition-all"
                      title="Registrar nueva droguería en SUNAT sin salir"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Nueva Droguería</span>
                    </button>
                  </div>
                  <DropdownPill
                    value={form.id_proveedor}
                    onChange={(val) => setForm({ ...form, id_proveedor: val })}
                    options={proveedores.map((p) => ({
                      value: p.id,
                      label: p.razon_social,
                      subtitle: `RUC: ${p.numero_documento}`
                    }))}
                    icon={Building2}
                    placeholder="Seleccione proveedor..."
                    searchPlaceholder="Buscar por razón social o RUC..."
                  />
                </div>

                <div className="min-w-0">
                  <DropdownPill
                    label="Tipo Comprobante"
                    value={form.tipo_comprobante}
                    onChange={(val) => setForm({ ...form, tipo_comprobante: val })}
                    options={COMPROBANTES_COMPRA}
                    icon={FileText}
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Serie y Número *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.serie}
                      onChange={(e) => setForm({ ...form, serie: e.target.value.toUpperCase() })}
                      placeholder="F001"
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs font-bold shrink-0"
                    />
                    <input
                      type="text"
                      required
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      placeholder="001248"
                      className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Fila Secundaria: Fecha de Emisión, Guía de Remisión, Condición de Pago & Plazo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                <div className="min-w-0">
                  <DatePickerPill
                    label="Fecha de Emisión (SUNAT)"
                    required
                    value={form.fecha_emision}
                    onChange={(val) => setForm({ ...form, fecha_emision: val })}
                    mode="emision"
                    direction="down"
                    align="left"
                    placeholder="Seleccionar fecha emisión..."
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Guía de Remisión <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.guia_remision}
                    onChange={(e) => setForm({ ...form, guia_remision: e.target.value.toUpperCase() })}
                    placeholder="Ej. T001-0004523"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="min-w-0">
                  <DropdownPill
                    label="Condición de Pago"
                    value={form.tipo_pago}
                    onChange={(val) => setForm({ ...form, tipo_pago: val })}
                    options={PAGOS_COMPRA}
                    icon={DollarSign}
                  />
                </div>

                <div className="min-w-0">
                  {form.tipo_pago === 'Credito' ? (
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Plazo Crédito</label>
                        <span className="text-[10px] text-teal-700 font-bold truncate">
                          Vence: {calcularFechaPago()}
                        </span>
                      </div>
                      <select
                        value={form.credito_dias}
                        onChange={(e) => setForm({ ...form, credito_dias: parseInt(e.target.value) || 30 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-2xs"
                      >
                        <option value="15">15 días calendario</option>
                        <option value="30">30 días calendario</option>
                        <option value="45">45 días calendario</option>
                        <option value="60">60 días calendario</option>
                        <option value="90">90 días calendario</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1.5">
                        Condición
                      </label>
                      <div className="text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3 py-2 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Cancelación Inmediata</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Buscador de Medicamentos */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Buscar Medicamento para Agregar a la Factura
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaMed}
                    onChange={(e) => setBusquedaMed(e.target.value)}
                    placeholder="Escriba nombre comercial, genérico o principio activo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xs"
                  />
                </div>

                {/* Autocomplete dropdown con contención estricta */}
                {medsFiltrados.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl max-h-56 overflow-y-auto shadow-2xl divide-y divide-slate-100">
                    {medsFiltrados.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => agregarMedicamentoACompra(m)}
                        className="p-3 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{m.nombre_comercial}</span>
                            <span className="text-slate-400 font-normal">({m.concentracion})</span>
                            {m.registro_sanitario && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                RS: {m.registro_sanitario}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-teal-600 block font-medium mt-0.5 truncate">
                            {m.laboratorio || 'Laboratorio Gral.'} • Presentación: {m.presentacion || 'Caja'} • Stock Actual: {m.stock_cajas || 0} cjs
                          </span>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0">
                          + Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla de Ítems a Ingresar con Alertas FEFO y Scroll Horizontal Seguro */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/30">
                <div className="max-h-[260px] overflow-y-auto overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[680px]">
                    <thead className="bg-slate-100/80 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[200px]">Medicamento & RS</th>
                        <th className="py-2.5 px-3 w-32">N° Lote Físico *</th>
                        <th className="py-2.5 px-3 w-40">F. Vencimiento *</th>
                        <th className="py-2.5 px-3 text-center w-20">Cajas</th>
                        <th className="py-2.5 px-3 text-right w-24">Costo Cja (S/)</th>
                        <th className="py-2.5 px-3 text-right w-24">Subtotal (S/)</th>
                        <th className="py-2.5 px-3 text-center w-14">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400">
                            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">Ningún medicamento seleccionado</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Use el buscador arriba para ingresar los productos que figuran en la factura de la droguería.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => {
                          const fefo = getFefoStatus(item.fecha_vencimiento);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block truncate max-w-[220px]" title={item.nombre}>{item.nombre}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.concentracion}</span>
                                  <span className="text-[9.5px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/50 shrink-0">
                                    RS: {item.registro_sanitario}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  required
                                  value={item.numero_lote}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'numero_lote', e.target.value.toUpperCase())
                                  }
                                  placeholder="Ej. L-2401"
                                  className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="space-y-1">
                                  <input
                                    type="date"
                                    required
                                    value={item.fecha_vencimiento}
                                    onChange={(e) =>
                                      actualizarItem(idx, 'fecha_vencimiento', e.target.value)
                                    }
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-emerald-500"
                                  />
                                  {fefo && (
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${fefo.color}`}
                                      title={
                                        fefo.tipo === 'critico'
                                          ? 'Atención BPA: Vence en menos de 6 meses'
                                          : fefo.tipo === 'vencido'
                                          ? 'Bloqueado por fecha caducada'
                                          : 'Vigencia adecuada'
                                      }
                                    >
                                      {fefo.label}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.cantidad_cajas}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'cantidad_cajas', e.target.value)
                                  }
                                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={item.precio_unitario}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'precio_unitario', e.target.value)
                                  }
                                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right text-slate-800 font-bold font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-800 font-mono">
                                S/{' '}
                                {(
                                  (parseFloat(item.cantidad_cajas) || 0) *
                                  (parseFloat(item.precio_unitario) || 0)
                                ).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarItem(idx)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Quitar ítem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Liquidación Fiscal SUNAT y Footer Fijo (shrink-0) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-start gap-2 max-w-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  Control BPA conforme: los lotes ingresados se asignan al algoritmo FEFO y actualizan el stock general.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-end w-full md:w-auto">
                {/* Desglose Fiscal SUNAT */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs">
                  <div>
                    <span className="text-[9.5px] text-slate-400 block font-medium">Op. Gravada</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      S/ {subtotalGravado.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-[9.5px] text-slate-400 block font-medium">IGV (18%)</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      S/ {igvFactura.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-200"></div>
                  <div>
                    <span className="text-[9.5px] text-slate-400 block font-medium">Total Factura</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      S/ {totalFactura.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalNuevo(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200/80 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    Guardar e Ingresar Lotes
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Modal Ver Detalle Compra */}
      {compraSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCompraSeleccionada(null);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[28px] soft-card-shadow border border-slate-100 max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Truck className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-800">
                  Detalle: {compraSeleccionada.serie}-{compraSeleccionada.numero}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCompraSeleccionada(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p>
                <strong className="text-slate-700">Droguería:</strong>{' '}
                {compraSeleccionada.proveedor?.razon_social}
              </p>
              <p>
                <strong className="text-slate-700">RUC:</strong>{' '}
                <span className="font-mono">{compraSeleccionada.proveedor?.numero_documento}</span>
              </p>
              <p>
                <strong className="text-slate-700">Fecha de Registro:</strong>{' '}
                <span className="font-mono">{new Date(compraSeleccionada.created_at).toLocaleString('es-PE')}</span>
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2.5">Medicamento</th>
                    <th className="p-2.5">Lote</th>
                    <th className="p-2.5">Vence</th>
                    <th className="p-2.5 text-right">Cant</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compraSeleccionada.detalles?.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-bold text-slate-800">
                        {d.medicamento?.nombre_comercial}
                      </td>
                      <td className="p-2.5 font-mono text-teal-600 font-bold">{d.numero_lote}</td>
                      <td className="p-2.5 font-mono text-slate-500">{d.fecha_vencimiento}</td>
                      <td className="p-2.5 text-right font-medium text-slate-700">{d.cantidad_cajas} cjs</td>
                      <td className="p-2.5 text-right font-bold font-mono text-slate-800">
                        S/ {parseFloat(d.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Total de Factura:</span>
              <span className="text-xl font-black text-emerald-600 font-mono">
                S/ {parseFloat(compraSeleccionada.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Carga Inteligente de Facturas (XML / Excel) */}
      <ModalCargarFactura
        abierto={modalCargarFactura}
        alCerrar={() => setModalCargarFactura(false)}
        alCompletar={cargarDatos}
        proveedores={proveedores}
        catalogoMedicamentos={medicamentos}
      />

      {/* Modal Registrar Nueva Droguería en línea */}
      <ModalRegistrarDrogueria
        isOpen={modalNuevaDrogueria}
        onClose={() => setModalNuevaDrogueria(false)}
        onSuccess={(nuevoProv) => {
          if (nuevoProv) {
            setProveedores((prev) => [nuevoProv, ...prev]);
            setForm((f) => ({ ...f, id_proveedor: nuevoProv.id }));
            toast.success(`Droguería "${nuevoProv.razon_social}" lista y seleccionada`);
          }
        }}
      />
    </div>
  );
}
