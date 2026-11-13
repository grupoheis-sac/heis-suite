import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ArrowLeft,
  Check,
  Search,
  Trash2,
  Building2,
  Sparkles,
  Download,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Info,
  Clock,
  Plus,
  Filter,
  Percent
} from 'lucide-react';
import DropdownPill from './DropdownPill';

const OPCIONES_PAGO = [
  { value: 'Contado', label: 'Contado', subtitle: 'Cancelación inmediata' },
  { value: 'Credito', label: 'Crédito', subtitle: 'Pago con plazo otorgado' }
];

export default function ModalCargarFactura({ abierto, alCerrar, alCompletar, proveedores = [], catalogoMedicamentos = [] }) {
  // Pasos: 1 = Carga de Archivo, 2 = Previsualización y Conciliación FEFO
  const [paso, setPaso] = useState(1);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const inputArchivoRef = useRef(null);

  // Atajo de teclado: Escape para cerrar modal
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !guardando) {
        alCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, guardando, alCerrar]);

  // Datos analizados del comprobante
  const [datosCargados, setDatosCargados] = useState(null);

  // Estados editables en Paso 2
  const [comprobanteForm, setComprobanteForm] = useState({
    serie: 'F001',
    numero: '',
    tipo_comprobante: 'Factura',
    guia_remision: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tipo_pago: 'Contado',
    credito_dias: 30,
    moneda: 'PEN',
    subtotal: 0,
    igv: 0,
    total: 0,
    formato_origen: ''
  });

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState({
    id: '',
    ruc: '',
    razon_social: '',
    es_nuevo: false
  });

  const [itemsFactura, setItemsFactura] = useState([]);
  const [filtroItems, setFiltroItems] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'NUEVOS' | 'CAMBIO_PRECIO' | 'ALERTAS_FEFO'

  const opcionesProveedores = useMemo(() => {
    const list = proveedores.map(p => ({
      value: String(p.id),
      label: p.razon_social,
      subtitle: `RUC: ${p.numero_documento}`
    }));
    list.push({
      value: 'NUEVO',
      label: `+ Registrar Nuevo (${proveedorSeleccionado.razon_social || 'Proveedor Factura'})`,
      subtitle: 'Crear proveedor automáticamente'
    });
    return list;
  }, [proveedores, proveedorSeleccionado.razon_social]);

  // Manejador de selección de archivo
  const manejarArchivo = (archivo) => {
    if (!archivo) return;
    const extension = archivo.name.split('.').pop().toLowerCase();
    const formatosValidos = ['xml', 'xlsx', 'xls', 'csv'];

    if (!formatosValidos.includes(extension)) {
      toast.error(`Formato no soportado (.${extension}). Use XML SUNAT (.xml) o Excel Droguería (.xlsx, .xls, .csv)`);
      return;
    }

    setArchivoSeleccionado(archivo);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      manejarArchivo(e.dataTransfer.files[0]);
    }
  };

  const procesarArchivoFactura = async () => {
    if (!archivoSeleccionado) {
      toast.error('Seleccione un archivo de factura primero');
      return;
    }

    try {
      setCargando(true);
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);

      const res = await api.post('/compras/procesar-archivo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        setDatosCargados(res);
        setComprobanteForm({
          serie: res.comprobante?.serie || 'F001',
          numero: res.comprobante?.numero || '',
          tipo_comprobante: res.comprobante?.tipo_comprobante || 'Factura',
          guia_remision: res.comprobante?.guia_remision || '',
          fecha_emision: res.comprobante?.fecha_emision || new Date().toISOString().split('T')[0],
          fecha_vencimiento: res.comprobante?.fecha_vencimiento || '',
          tipo_pago: res.comprobante?.tipo_pago || 'Contado',
          credito_dias: 30,
          moneda: res.comprobante?.moneda || 'PEN',
          subtotal: res.comprobante?.subtotal || 0,
          igv: res.comprobante?.igv || 0,
          total: res.comprobante?.total || 0,
          formato_origen: res.formato_origen
        });

        // Configurar proveedor detectado
        const provDetectado = res.proveedor;
        if (provDetectado?.id_proveedor_detectado) {
          setProveedorSeleccionado({
            id: String(provDetectado.id_proveedor_detectado),
            ruc: provDetectado.ruc,
            razon_social: provDetectado.razon_social_bd || provDetectado.razon_social,
            es_nuevo: false
          });
        } else {
          // Si no existe, revisar si coincide con algún proveedor ya en memoria
          const provCoincidente = proveedores.find(
            p => p.numero_documento === provDetectado?.ruc ||
                 (provDetectado?.razon_social && p.razon_social.toLowerCase().includes(provDetectado.razon_social.toLowerCase()))
          );

          if (provCoincidente) {
            setProveedorSeleccionado({
              id: String(provCoincidente.id),
              ruc: provCoincidente.numero_documento,
              razon_social: provCoincidente.razon_social,
              es_nuevo: false
            });
          } else {
            setProveedorSeleccionado({
              id: '',
              ruc: provDetectado?.ruc || '',
              razon_social: provDetectado?.razon_social || '',
              es_nuevo: true
            });
          }
        }

        setItemsFactura(res.items || []);
        setPaso(2);
        toast.success(`Factura analizada con éxito: ${res.items?.length || 0} medicamentos detectados.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al procesar el archivo de factura');
    } finally {
      setCargando(false);
    }
  };

  const descargarPlantilla = async () => {
    try {
      toast.loading('Generando plantilla oficial en Excel...', { id: 'plantilla' });
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
      toast.success('Plantilla descargada con éxito', { id: 'plantilla' });
    } catch (err) {
      toast.error('Error al descargar la plantilla de Excel', { id: 'plantilla' });
    }
  };

  // Modificación de ítems en Paso 2
  const actualizarItem = (idx, campo, valor) => {
    const nuevos = [...itemsFactura];
    nuevos[idx][campo] = valor;

    if (campo === 'cantidad_cajas' || campo === 'precio_unitario') {
      const cant = parseFloat(campo === 'cantidad_cajas' ? valor : nuevos[idx].cantidad_cajas) || 0;
      const pre = parseFloat(campo === 'precio_unitario' ? valor : nuevos[idx].precio_unitario) || 0;
      nuevos[idx].subtotal = parseFloat((cant * pre).toFixed(2));
    }

    setItemsFactura(nuevos);
  };

  const reVincularMedicamento = (idx, idMedSeleccionado) => {
    const med = catalogoMedicamentos.find(m => m.id === parseInt(idMedSeleccionado));
    const nuevos = [...itemsFactura];
    if (med) {
      nuevos[idx].encontrado = true;
      nuevos[idx].id_medicamento = med.id;
      nuevos[idx].nombre_catalogo = med.nombre_comercial;
      nuevos[idx].concentracion = med.concentracion;
      nuevos[idx].laboratorio = med.laboratorio;
      nuevos[idx].registro_sanitario = med.registro_sanitario || nuevos[idx].registro_sanitario || '';
      nuevos[idx].precio_compra_actual = parseFloat(med.precio_compra);
      nuevos[idx].stock_actual = med.stock_cajas;
      nuevos[idx].crear_como_nuevo = false;
    } else {
      nuevos[idx].encontrado = false;
      nuevos[idx].id_medicamento = null;
      nuevos[idx].crear_como_nuevo = true;
    }
    setItemsFactura(nuevos);
  };

  const eliminarItem = (idx) => {
    setItemsFactura(itemsFactura.filter((_, i) => i !== idx));
  };

  // Cálculos reactivos
  const totalSumaItems = useMemo(() => {
    return itemsFactura.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
  }, [itemsFactura]);

  // Semáforo FEFO para fecha de vencimiento
  const calcularSemaforoFefo = (fechaStr) => {
    if (!fechaStr) return { color: 'text-slate-400 bg-slate-100 border-slate-200', texto: 'Sin Fecha', esVencido: false };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fechaStr + 'T00:00:00');
    const difDias = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));

    if (difDias < 0) return { color: 'text-rose-700 bg-rose-100 border-rose-300 font-bold', texto: '🚫 Vencido (BPA)', esVencido: true, difDias };
    if (difDias <= 60) return { color: 'text-amber-800 bg-amber-50 border-amber-300 font-bold', texto: `⚠️ Crítico (${difDias}d)`, esVencido: false, difDias };
    if (difDias <= 180) return { color: 'text-yellow-800 bg-yellow-50 border-yellow-300 font-medium', texto: `Próximo (${Math.round(difDias/30)}m)`, esVencido: false, difDias };
    return { color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium', texto: `Seguro (>6m)`, esVencido: false, difDias };
  };

  // Verificación estricta de vencidos para BPA DIGEMID
  const hayItemsVencidos = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    return itemsFactura.some(it => it.fecha_vencimiento && it.fecha_vencimiento < hoyStr);
  }, [itemsFactura]);

  // Previsualización de vencimiento de crédito (emisión + días)
  const fechaVencimientoCredito = useMemo(() => {
    if (comprobanteForm.tipo_pago !== 'Credito') return null;
    const emision = comprobanteForm.fecha_emision ? new Date(comprobanteForm.fecha_emision + 'T12:00:00') : new Date();
    if (isNaN(emision.getTime())) return null;
    const dias = parseInt(comprobanteForm.credito_dias) || 0;
    const fechaVenc = new Date(emision);
    fechaVenc.setDate(fechaVenc.getDate() + dias);
    return fechaVenc.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [comprobanteForm.tipo_pago, comprobanteForm.fecha_emision, comprobanteForm.credito_dias]);

  // Aplicación masiva de margen de ganancia a fármacos nuevos
  const aplicarMargenGlobalNuevos = (porcentaje) => {
    let cant = 0;
    const nuevos = itemsFactura.map(it => {
      if (!it.encontrado || it.crear_como_nuevo) {
        cant++;
        const costo = parseFloat(it.precio_unitario) || 0;
        const sugerido = parseFloat((costo * (1 + (porcentaje / 100))).toFixed(2));
        return { ...it, precio_venta_sugerido: sugerido };
      }
      return it;
    });
    setItemsFactura(nuevos);
    toast.success(`Margen del +${porcentaje}% aplicado a ${cant} fármacos nuevos`);
  };

  // Conteo para los botones de filtros rápidos
  const statsFiltros = useMemo(() => {
    let nuevos = 0;
    let cambioPrecio = 0;
    let alertasFefo = 0;
    const hoyStr = new Date().toISOString().split('T')[0];

    itemsFactura.forEach(it => {
      if (!it.encontrado || it.crear_como_nuevo) nuevos++;
      if (it.hubo_cambio_precio) cambioPrecio++;
      if (it.fecha_vencimiento && it.fecha_vencimiento <= hoyStr) {
        alertasFefo++;
      } else if (it.fecha_vencimiento) {
        const hoy = new Date();
        const f = new Date(it.fecha_vencimiento);
        const difDias = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
        if (difDias <= 60) alertasFefo++;
      }
    });

    return { nuevos, cambioPrecio, alertasFefo };
  }, [itemsFactura]);

  const itemsFiltrados = useMemo(() => {
    let lista = itemsFactura;

    if (filtroTipo === 'NUEVOS') {
      lista = lista.filter(it => !it.encontrado || it.crear_como_nuevo);
    } else if (filtroTipo === 'CAMBIO_PRECIO') {
      lista = lista.filter(it => it.hubo_cambio_precio);
    } else if (filtroTipo === 'ALERTAS_FEFO') {
      const hoy = new Date();
      lista = lista.filter(it => {
        if (!it.fecha_vencimiento) return false;
        const f = new Date(it.fecha_vencimiento);
        const difDias = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
        return difDias <= 60;
      });
    }

    if (!filtroItems.trim()) return lista;
    const f = filtroItems.toLowerCase();
    return lista.filter(
      it => (it.nombre && it.nombre.toLowerCase().includes(f)) ||
            (it.nombre_catalogo && it.nombre_catalogo.toLowerCase().includes(f)) ||
            (it.numero_lote && it.numero_lote.toLowerCase().includes(f)) ||
            (it.registro_sanitario && it.registro_sanitario.toLowerCase().includes(f))
    );
  }, [itemsFactura, filtroTipo, filtroItems]);

  // Confirmar y guardar la compra en el sistema
  const handleGuardarFacturaCompleta = async () => {
    // Validaciones
    if (!proveedorSeleccionado.id && (!proveedorSeleccionado.ruc || !proveedorSeleccionado.razon_social)) {
      toast.error('Seleccione una droguería registrada o complete el RUC y Razón Social');
      return;
    }

    if (!comprobanteForm.numero.trim()) {
      toast.error('Ingrese el número del comprobante');
      return;
    }

    if (itemsFactura.length === 0) {
      toast.error('La factura debe tener al menos un medicamento');
      return;
    }

    // Validar estricto BPA DIGEMID: lotes y vencimiento obligatorio, bloqueo de caducados
    const hoyStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < itemsFactura.length; i++) {
      const it = itemsFactura[i];
      if (!it.numero_lote || !it.numero_lote.trim()) {
        toast.error(`El medicamento "${it.nombre || it.nombre_catalogo}" requiere un Número de Lote.`);
        return;
      }
      if (!it.fecha_vencimiento) {
        toast.error(`El medicamento "${it.nombre || it.nombre_catalogo}" requiere Fecha de Vencimiento para control FEFO.`);
        return;
      }
      if (it.fecha_vencimiento < hoyStr) {
        toast.error(`🚫 Bloqueo BPA DIGEMID: El medicamento "${it.nombre || it.nombre_catalogo}" (Lote: ${it.numero_lote}) ya está vencido (${it.fecha_vencimiento}). No se puede ingresar a stock vendible.`);
        return;
      }
      if (parseFloat(it.cantidad_cajas || 0) <= 0) {
        toast.error(`El medicamento "${it.nombre || it.nombre_catalogo}" debe tener una cantidad válida mayor a 0.`);
        return;
      }
    }

    try {
      setGuardando(true);

      const payload = {
        comprobante: {
          serie: comprobanteForm.serie,
          numero: comprobanteForm.numero,
          tipo_comprobante: comprobanteForm.tipo_comprobante,
          guia_remision: comprobanteForm.guia_remision ? comprobanteForm.guia_remision.trim() : null,
          fecha_emision: comprobanteForm.fecha_emision,
          fecha_vencimiento: comprobanteForm.fecha_vencimiento,
          tipo_pago: comprobanteForm.tipo_pago,
          moneda: comprobanteForm.moneda,
          subtotal: parseFloat((totalSumaItems / 1.18).toFixed(2)),
          igv: parseFloat((totalSumaItems - (totalSumaItems / 1.18)).toFixed(2)),
          total: parseFloat(totalSumaItems.toFixed(2)),
          formato_origen: comprobanteForm.formato_origen
        },
        id_proveedor: proveedorSeleccionado.id ? parseInt(proveedorSeleccionado.id) : null,
        proveedor_nuevo: proveedorSeleccionado.es_nuevo
          ? {
              ruc: proveedorSeleccionado.ruc,
              razon_social: proveedorSeleccionado.razon_social,
              direccion: datosCargados?.proveedor?.direccion || '',
              telefono: ''
            }
          : null,
        tipo_pago: comprobanteForm.tipo_pago,
        credito_dias: comprobanteForm.credito_dias,
        items: itemsFactura.map(it => ({
          id_medicamento: it.id_medicamento || null,
          crear_como_nuevo: !it.id_medicamento || it.crear_como_nuevo,
          codigo_barras: it.codigo_barras,
          nombre: it.nombre_catalogo || it.nombre,
          nombre_generico: it.nombre_generico || null,
          concentracion: it.concentracion,
          laboratorio: it.laboratorio,
          registro_sanitario: it.registro_sanitario ? it.registro_sanitario.trim() : null,
          numero_lote: it.numero_lote.trim().toUpperCase(),
          fecha_vencimiento: it.fecha_vencimiento,
          cantidad_cajas: parseFloat(it.cantidad_cajas),
          precio_unitario: parseFloat(it.precio_unitario),
          precio_venta_sugerido: it.precio_venta_sugerido || parseFloat((it.precio_unitario * 1.30).toFixed(2)),
          subtotal: it.subtotal
        }))
      };

      const res = await api.post('/compras/confirmar-carga', payload);
      if (res.success) {
        toast.success(`¡Factura ${payload.comprobante.serie}-${payload.comprobante.numero} cargada e inventario FEFO actualizado!`);
        alCompletar();
        alCerrar();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al guardar la factura de compras');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !guardando) alCerrar();
      }}
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] border border-slate-100 max-w-6xl w-full p-5 sm:p-7 space-y-5 shadow-2xl my-6 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-100/80 shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  Carga Inteligente de Facturas de Compras
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                  DIGEMID FEFO • BPA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Importación automatizada de Facturas Electrónicas SUNAT (XML UBL 2.1) y Plantillas Excel de Droguerías con conciliación automática.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarPlantilla}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Descargar plantilla Excel con formato oficial y columna de Registro Sanitario"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              Descargar Formato Excel
            </button>
            <button
              type="button"
              onClick={alCerrar}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Contenido Dinámico según Paso */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-modal-scroll">
          {paso === 1 && (
            <div className="space-y-6 py-2">
              {/* Selector / Dropzone de Archivo */}
              <div
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={handleDrop}
                onClick={() => inputArchivoRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  arrastrando
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".xml,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      manejarArchivo(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-emerald-600">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      {archivoSeleccionado
                        ? archivoSeleccionado.name
                        : 'Arrastra tu archivo aquí o haz clic para explorar'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Soporta Facturas Electrónicas SUNAT (.XML UBL 2.1) y hojas de cálculo (.XLSX, .XLS, .CSV)
                    </p>
                  </div>

                  {archivoSeleccionado ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      Archivo listo ({(archivoSeleccionado.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <span className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                      Examinar Archivos
                    </span>
                  )}
                </div>
              </div>

              {/* Tarjetas informativas de formatos aceptados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-100/80 space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                    <FileCode className="w-4 h-4 text-teal-600" />
                    <span>Factura Electrónica SUNAT (XML UBL 2.1)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formato oficial emitido por droguerías como <strong>Química Suiza, Albis, Medifarma, Hersil</strong>. Extrae automáticamente RUC, Guía de Remisión, Serie, Número, Medicamentos, Lotes y Precios pactados.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50/40 border border-blue-100/80 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Plantilla Excel de Droguería / DIGEMID</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hojas de cálculo con columnas de <em>Medicamento, Registro Sanitario, Lote, Vencimiento, Cantidad y Costo</em>. Puedes descargar la plantilla oficial con ejemplos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {paso === 2 && datosCargados && (
            <div className="space-y-4 py-1">
              {/* Tarjetas de Resumen Rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">Total Factura</span>
                  <span className="text-lg font-black text-slate-800 font-mono">
                    S/ {totalSumaItems.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Sub: S/ {(totalSumaItems / 1.18).toFixed(2)} | IGV: S/ {(totalSumaItems - (totalSumaItems / 1.18)).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                  <span className="text-[11px] font-bold text-emerald-700 block">En Catálogo</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    {itemsFactura.filter(i => i.encontrado).length} / {itemsFactura.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    Coincidencia automática
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100/80">
                  <span className="text-[11px] font-bold text-amber-700 block">Fármacos Nuevos</span>
                  <span className="text-lg font-black text-amber-800 font-mono">
                    {itemsFactura.filter(i => !i.encontrado).length}
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold block">
                    Se crearán en catálogo
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100/80">
                  <span className="text-[11px] font-bold text-teal-700 block">Formato Origen</span>
                  <span className="text-xs font-bold text-teal-800 truncate block mt-1">
                    {comprobanteForm.formato_origen === 'XML_SUNAT_UBL_2.1' ? 'XML SUNAT UBL' : 'Excel Droguería'}
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold block">
                    Control FEFO Listo
                  </span>
                </div>
              </div>

              {/* Banner de Bloqueo BPA si hay lotes vencidos */}
              {hayItemsVencidos && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3 font-medium animate-in fade-in shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-rose-800 font-black">
                      🚫 Bloqueo Regulatorio BPA DIGEMID:
                    </strong>
                    Se detectaron medicamentos con lotes expirados (resaltados en rojo). Las Buenas Prácticas de Almacenamiento prohíben ingresar productos caducados a stock vendible. Corrija las fechas o elimine los medicamentos para habilitar el registro.
                  </div>
                </div>
              )}

              {/* Cabecera del Comprobante (Editable) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Datos de la Factura y Proveedor
                  </span>
                  {proveedorSeleccionado.es_nuevo && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⚠️ Proveedor Nuevo (Se registrará en BD)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  {/* 1. Selector o Edición de Proveedor */}
                  <div>
                    <DropdownPill
                      label="Droguería / Proveedor"
                      required
                      value={proveedorSeleccionado.id || 'NUEVO'}
                      onChange={(val) => {
                        if (val === 'NUEVO') {
                          setProveedorSeleccionado({
                            id: '',
                            ruc: proveedorSeleccionado.ruc,
                            razon_social: proveedorSeleccionado.razon_social,
                            es_nuevo: true
                          });
                        } else {
                          const p = proveedores.find(x => x.id === parseInt(val));
                          if (p) {
                            setProveedorSeleccionado({
                              id: String(p.id),
                              ruc: p.numero_documento,
                              razon_social: p.razon_social,
                              es_nuevo: false
                            });
                          }
                        }
                      }}
                      options={opcionesProveedores}
                      icon={Building2}
                      searchPlaceholder="Buscar droguería por nombre o RUC..."
                    />
                  </div>

                  {/* 2. Serie y Número */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Serie y Número *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={comprobanteForm.serie}
                        onChange={(e) => setComprobanteForm({ ...comprobanteForm, serie: e.target.value.toUpperCase() })}
                        placeholder="F001"
                        className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-2 font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                      <input
                        type="text"
                        value={comprobanteForm.numero}
                        onChange={(e) => setComprobanteForm({ ...comprobanteForm, numero: e.target.value })}
                        placeholder="0001248"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* 3. Guía de Remisión (GRR) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Guía Remisión (GRR)
                    </label>
                    <input
                      type="text"
                      value={comprobanteForm.guia_remision}
                      onChange={(e) => setComprobanteForm({ ...comprobanteForm, guia_remision: e.target.value.toUpperCase() })}
                      placeholder="T001-0004521"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-800 uppercase text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
                      title="Número de Guía de Remisión remitente que acompaña el bulto"
                    />
                  </div>

                  {/* 4. Tipo Comprobante y Forma de Pago */}
                  <div>
                    <div className="flex gap-1.5 items-end">
                      <div className="flex-1">
                        <DropdownPill
                          label="Modalidad de Pago"
                          value={comprobanteForm.tipo_pago}
                          onChange={(val) => setComprobanteForm({ ...comprobanteForm, tipo_pago: val })}
                          options={OPCIONES_PAGO}
                          icon={DollarSign}
                        />
                      </div>
                      {comprobanteForm.tipo_pago === 'Credito' && (
                        <div className="w-16">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Plazo
                          </label>
                          <input
                            type="number"
                            value={comprobanteForm.credito_dias}
                            onChange={(e) => setComprobanteForm({ ...comprobanteForm, credito_dias: e.target.value })}
                            placeholder="30 d"
                            title="Días de crédito otorgados por la droguería"
                            className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-2 font-mono text-center text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                      )}
                    </div>
                    {comprobanteForm.tipo_pago === 'Credito' && fechaVencimientoCredito && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Vence pago: {fechaVencimientoCredito}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. Fecha de Emisión */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Fecha Emisión *
                    </label>
                    <input
                      type="date"
                      value={comprobanteForm.fecha_emision}
                      onChange={(e) => setComprobanteForm({ ...comprobanteForm, fecha_emision: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Barra de Herramientas y Filtros Rápidos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                {/* Filtros por píldoras */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filtros:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiltroTipo('TODOS')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      filtroTipo === 'TODOS'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Todos ({itemsFactura.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipo('NUEVOS')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      filtroTipo === 'NUEVOS'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Nuevos ({statsFiltros.nuevos})
                  </button>
                  {statsFiltros.cambioPrecio > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroTipo('CAMBIO_PRECIO')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        filtroTipo === 'CAMBIO_PRECIO'
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                      }`}
                    >
                      Cambio Costo ({statsFiltros.cambioPrecio})
                    </button>
                  )}
                  {statsFiltros.alertasFefo > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroTipo('ALERTAS_FEFO')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        filtroTipo === 'ALERTAS_FEFO'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Alertas FEFO ({statsFiltros.alertasFefo})
                    </button>
                  )}
                </div>

                {/* Herramienta de Margen Masivo para Nuevos */}
                {statsFiltros.nuevos > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-teal-600" />
                      Margen nuevos:
                    </span>
                    {[20, 25, 30, 35, 40].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => aplicarMargenGlobalNuevos(pct)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-teal-600 hover:text-white border border-teal-200 text-teal-700 text-[10px] font-bold transition-colors shadow-2xs"
                        title={`Fijar +${pct}% de ganancia sobre costo a todos los fármacos nuevos`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla de Medicamentos y Lotes */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">
                      Medicamentos y Lotes a Ingresar ({itemsFiltrados.length} de {itemsFactura.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Revisa lotes, Registro Sanitario y precios de venta sugeridos antes de ingresar.
                    </span>
                  </div>

                  {/* Buscador local de la tabla */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filtroItems}
                      onChange={(e) => setFiltroItems(e.target.value)}
                      placeholder="Buscar medicamento, lote o R.S..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[38vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Medicamento & Reg. Sanitario</th>
                        <th className="py-2.5 px-3">N° Lote (FEFO) *</th>
                        <th className="py-2.5 px-3">F. Vencimiento *</th>
                        <th className="py-2.5 px-3 text-center">Cajas</th>
                        <th className="py-2.5 px-3 text-right">Costo (S/)</th>
                        <th className="py-2.5 px-3 text-right">P. Venta Sug.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemsFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-8 text-center text-slate-400 text-xs">
                            No se encontraron medicamentos con ese criterio de búsqueda o filtro seleccionado.
                          </td>
                        </tr>
                      ) : (
                        itemsFiltrados.map((it, idx) => {
                          const realIdx = itemsFactura.findIndex(x => x === it);
                          const semaforo = calcularSemaforoFefo(it.fecha_vencimiento);

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                semaforo.esVencido
                                  ? 'bg-rose-50/70 border-l-4 border-l-rose-500'
                                  : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* Estado de Coincidencia */}
                              <td className="py-2.5 px-3">
                                {it.encontrado ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Catálogo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Sparkles className="w-3 h-3" />
                                    Nuevo
                                  </span>
                                )}
                              </td>

                              {/* Nombre, datos y Registro Sanitario */}
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 line-clamp-1">
                                  {it.nombre_catalogo || it.nombre}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{it.concentracion || 'Sin concentración'}</span>
                                  {it.laboratorio && <span>• {it.laboratorio}</span>}
                                  {it.codigo_barras && <span className="font-mono">({it.codigo_barras})</span>}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-bold">R.S.:</span>
                                  <input
                                    type="text"
                                    value={it.registro_sanitario || ''}
                                    onChange={(e) => actualizarItem(realIdx, 'registro_sanitario', e.target.value.toUpperCase())}
                                    placeholder="REG. SANITARIO"
                                    className="w-28 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-700 uppercase focus:outline-none focus:border-emerald-500 shadow-2xs"
                                    title="Registro Sanitario DIGEMID (ej. EE-04821)"
                                  />
                                </div>

                                {/* Si no fue encontrado, permitir vincular a uno existente */}
                                {!it.encontrado && (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <select
                                      onChange={(e) => reVincularMedicamento(realIdx, e.target.value)}
                                      className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                                    >
                                      <option value="">+ Crear como nuevo fármaco</option>
                                      {catalogoMedicamentos.slice(0, 15).map(m => (
                                        <option key={m.id} value={m.id}>
                                          Vincular a: {m.nombre_comercial}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </td>

                              {/* N° Lote */}
                              <td className="py-2.5 px-3">
                                <div className="space-y-0.5">
                                  <input
                                    type="text"
                                    required
                                    value={it.numero_lote}
                                    onChange={(e) => actualizarItem(realIdx, 'numero_lote', e.target.value.toUpperCase())}
                                    placeholder="LT-XXXXX"
                                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 uppercase"
                                  />
                                  {it.lote_autogenerado && (
                                    <span className="text-[9px] text-slate-400 block">Sugerido auto</span>
                                  )}
                                </div>
                              </td>

                              {/* F. Vencimiento con Semáforo FEFO */}
                              <td className="py-2.5 px-3">
                                <div className="space-y-1">
                                  <input
                                    type="date"
                                    required
                                    value={it.fecha_vencimiento}
                                    onChange={(e) => actualizarItem(realIdx, 'fecha_vencimiento', e.target.value)}
                                    className={`border rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white ${
                                      semaforo.esVencido
                                        ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                        : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                                    }`}
                                  />
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border inline-block ${semaforo.color}`}>
                                    {semaforo.texto}
                                  </span>
                                </div>
                              </td>

                              {/* Cantidad Cajas */}
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  required
                                  value={it.cantidad_cajas}
                                  onChange={(e) => actualizarItem(realIdx, 'cantidad_cajas', e.target.value)}
                                  className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                              </td>

                              {/* Precio Unitario Costo */}
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={it.precio_unitario}
                                  onChange={(e) => actualizarItem(realIdx, 'precio_unitario', e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-right font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                                {it.hubo_cambio_precio && (
                                  <span className="text-[9px] text-teal-600 block font-mono">
                                    Ant: S/ {it.precio_compra_actual?.toFixed(2)}
                                  </span>
                                )}
                              </td>

                              {/* Precio Venta Sugerido */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={it.precio_venta_sugerido || ''}
                                    onChange={(e) => actualizarItem(realIdx, 'precio_venta_sugerido', parseFloat(e.target.value) || 0)}
                                    className="w-16 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-right font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
                                    title="Precio sugerido de venta al público"
                                  />
                                  {it.precio_unitario > 0 && it.precio_venta_sugerido && (
                                    <span className="text-[9px] text-emerald-600 block font-mono text-right font-bold">
                                      +{Math.round(((it.precio_venta_sugerido - it.precio_unitario) / it.precio_unitario) * 100)}%
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Subtotal */}
                              <td className="py-2.5 px-3 text-right font-black font-mono text-slate-800">
                                S/ {parseFloat(it.subtotal || 0).toFixed(2)}
                              </td>

                              {/* Quitar Ítem */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarItem(realIdx)}
                                  className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Quitar medicamento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          )}
        </div>

        {/* Footer de Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Todos los lotes y registros sanitarios se conectan en tiempo real al motor FEFO y Kardex farmacéutico.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {paso === 1 ? (
              <>
                <button
                  type="button"
                  onClick={alCerrar}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!archivoSeleccionado || cargando}
                  onClick={procesarArchivoFactura}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2"
                >
                  {cargando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analizando Factura...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Continuar a Revisión
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar Archivo
                </button>

                <div className="text-right mr-2 hidden sm:block">
                  <span className="text-[10px] text-slate-400 block font-medium">Total a Ingresar</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    S/ {totalSumaItems.toFixed(2)}
                  </span>
                </div>

                {hayItemsVencidos && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 animate-pulse">
                    ⚠️ Resuelva lotes vencidos
                  </span>
                )}

                <button
                  type="button"
                  disabled={guardando || itemsFactura.length === 0 || hayItemsVencidos}
                  onClick={handleGuardarFacturaCompleta}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  title={hayItemsVencidos ? 'Corrija los lotes vencidos para poder ingresar la factura' : 'Confirmar e ingresar al inventario'}
                >
                  {guardando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando en Inventario...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirmar e Ingresar Lotes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
