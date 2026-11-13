import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
  RotateCcw,
  Plus,
  PlusCircle,
  Search,
  Filter,
  Truck,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Building2,
  DollarSign,
  Printer,
  X,
  Eye,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Package,
  Layers,
  FileCheck,
  CreditCard,
  ArrowLeftRight,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@heis/core';
import { useSettingsStore } from '@heis/core';
import DropdownPill from './components/DropdownPill';
import ModalRegistrarDrogueria from './components/ModalRegistrarDrogueria';

const MOTIVOS_DEVOLUCION = [
  { value: 'Vencimiento_Proximo', label: 'Canje por Vencimiento Próximo', desc: 'Canje acordado 3 a 6 meses antes de expirar' },
  { value: 'Producto_Vencido', label: 'Producto Vencido', desc: 'Merma no canjeada para nota de crédito' },
  { value: 'Deterioro_Empaque', label: 'Deterioro / Empaque Dañado', desc: 'Rechazo en recepción técnica (BPA)' },
  { value: 'Recall_DIGEMID', label: 'Alerta / Recall DIGEMID', desc: 'Retiro obligatorio del mercado por alerta sanitaria' },
  { value: 'Error_Despacho', label: 'Error de Despacho del Proveedor', desc: 'Producto no solicitado o cantidad excedente' },
  { value: 'Defecto_Calidad', label: 'Defecto de Fabricación / Calidad', desc: 'Precipitación, turbidez o alteración organoléptica' },
  { value: 'Sobre_Stock', label: 'Devolución por Sobre-stock', desc: 'Acuerdo comercial de retorno por baja rotación' },
  { value: 'Otro', label: 'Otro Motivo', desc: 'Detallado en observaciones' }
];

const ESTADOS_DEVOLUCION = [
  { id: 'TODOS', label: 'Todos los estados' },
  { id: 'Pendiente_Envio', label: 'Pendientes de Envío', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  { id: 'Entregado_Drogueria', label: 'Entregado a Droguería', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  { id: 'Aceptado_NC', label: 'Aceptado con Nota de Crédito', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  { id: 'Rechazado', label: 'Rechazado por Droguería', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' }
];

export default function DevolucionesProveedor() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const [devoluciones, setDevoluciones] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroProveedor, setFiltroProveedor] = useState('');

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalNuevaDrogueria, setModalNuevaDrogueria] = useState(false);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario Nueva Devolución
  const [idProveedorForm, setIdProveedorForm] = useState('');
  const [motivoForm, setMotivoForm] = useState('Vencimiento_Proximo');
  const [tipoCompensacionForm, setTipoCompensacionForm] = useState('Canje_Fisico');
  const [transportistaForm, setTransportistaForm] = useState({
    nombre: '',
    dni: '',
    placa: '',
    guia_remitente: ''
  });
  const [mostrarTransporte, setMostrarTransporte] = useState(false);
  const [observacionesForm, setObservacionesForm] = useState('');
  const [itemsForm, setItemsForm] = useState([
    { id_medicamento: '', id_lote: '', cantidad: 1, precio_unitario: 0, stock_disp: 0, lotes_disp: [] }
  ]);

  // Asistente de Lotes Semáforo
  const [modalSemaforo, setModalSemaforo] = useState(false);
  const [cargandoSemaforo, setCargandoSemaforo] = useState(false);
  const [lotesSemaforo, setLotesSemaforo] = useState([]);
  const [filtroTipoSemaforo, setFiltroTipoSemaforo] = useState('TODOS');
  const [busquedaSemaforo, setBusquedaSemaforo] = useState('');
  const [lotesSemaforoSeleccionados, setLotesSemaforoSeleccionados] = useState({});

  // Buscador predictivo rápido en el formulario
  const [busquedaFarmaRapida, setBusquedaFarmaRapida] = useState('');

  // Cargar lista de devoluciones y resumen KPI
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado !== 'TODOS') params.estado = filtroEstado;
      if (filtroProveedor) params.id_proveedor = filtroProveedor;
      if (busqueda && busqueda.trim()) params.busqueda = busqueda.trim();

      const [resDev, resRes, resProv, resMed] = await Promise.all([
        api.get('/devoluciones-proveedor', { params }),
        api.get('/devoluciones-proveedor/resumen'),
        api.get('/proveedores'),
        api.get('/medicamentos', { params: { limit: 500 } })
      ]);

      const dataDev = resDev?.data || resDev;
      const dataRes = resRes?.data || resRes;
      const dataProv = resProv?.data || resProv;
      const dataMed = resMed?.data || resMed;

      if (dataDev?.success) {
        setDevoluciones(dataDev.devoluciones || []);
      }
      if (dataRes?.success) {
        setResumen(dataRes.resumen || null);
      }
      if (dataProv?.proveedores) {
        setProveedores(dataProv.proveedores || []);
      }
      if (dataMed?.medicamentos) {
        setMedicamentos(dataMed.medicamentos || []);
      }
    } catch (err) {
      console.error('Error al cargar datos de devoluciones:', err);
      toast.error('Error al cargar el módulo de devoluciones a proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroProveedor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Manejo de Items en el formulario
  const handleMedicamentoChange = async (idx, idMed) => {
    const med = medicamentos.find((m) => String(m.id) === String(idMed));
    if (!med) return;

    try {
      // Consultar lotes del medicamento
      const resLotes = await api.get(`/lotes/medicamento/${idMed}`);
      const dataLotes = resLotes?.data || resLotes;
      const lotes = dataLotes?.lotes || [];
      const primerLote = lotes.find((l) => parseFloat(l.stock_cajas || 0) > 0) || lotes[0];

      setItemsForm((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          return {
            ...item,
            id_medicamento: idMed,
            id_lote: primerLote?.id || '',
            precio_unitario: med.precio_compra || 0,
            stock_disp: parseFloat(primerLote?.stock_cajas || med.stock_cajas || 0),
            lotes_disp: lotes
          };
        })
      );
    } catch {
      setItemsForm((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          return {
            ...item,
            id_medicamento: idMed,
            precio_unitario: med.precio_compra || 0,
            stock_disp: parseFloat(med.stock_cajas || 0),
            lotes_disp: []
          };
        })
      );
    }
  };

  const handleLoteChange = (idx, idLote) => {
    setItemsForm((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const lote = item.lotes_disp?.find((l) => String(l.id) === String(idLote));
        return {
          ...item,
          id_lote: idLote,
          stock_disp: parseFloat(lote?.stock_cajas || 0)
        };
      })
    );
  };

  const agregarFilaItem = () => {
    setItemsForm((prev) => [
      ...prev,
      { id_medicamento: '', id_lote: '', cantidad: 1, precio_unitario: 0, stock_disp: 0, lotes_disp: [] }
    ]);
  };

  const eliminarFilaItem = (idx) => {
    if (itemsForm.length <= 1) return;
    setItemsForm((prev) => prev.filter((_, i) => i !== idx));
  };

  const calcularTotalFormulario = () => {
    return itemsForm.reduce((acc, it) => {
      const cant = parseFloat(it.cantidad || 0);
      const pre = parseFloat(it.precio_unitario || 0);
      return acc + cant * pre;
    }, 0);
  };

  const abrirModalNuevo = () => {
    setIdProveedorForm(proveedores[0]?.id || '');
    setMotivoForm('Vencimiento_Proximo');
    setTipoCompensacionForm('Canje_Fisico');
    setTransportistaForm({ nombre: '', dni: '', placa: '', guia_remitente: '' });
    setMostrarTransporte(false);
    setObservacionesForm('');
    setBusquedaFarmaRapida('');
    setItemsForm([
      { id_medicamento: '', id_lote: '', cantidad: 1, precio_unitario: 0, stock_disp: 0, lotes_disp: [] }
    ]);
    setModalNuevo(true);
  };

  // Asistente Semáforo: Cargar Lotes por Vencer / Críticos
  const abrirAsistenteLotesSemaforo = async () => {
    try {
      setCargandoSemaforo(true);
      setFiltroTipoSemaforo('TODOS');
      setBusquedaSemaforo('');
      setModalSemaforo(true);
      const rawRes = await api.get('/lotes/semaforo');
      const dataSem = rawRes?.data || rawRes;
      if (dataSem?.success) {
        const { vencidos = [], criticos = [], proximos = [] } = dataSem;
        const lista = [
          ...vencidos.map(l => ({ ...l, categoriaSemaforo: 'Vencido', colorBadge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300' })),
          ...criticos.map(l => ({ ...l, categoriaSemaforo: 'Crítico (≤30d)', colorBadge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' })),
          ...proximos.map(l => ({ ...l, categoriaSemaforo: 'Próximo (31-90d)', colorBadge: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300' }))
        ];
        setLotesSemaforo(lista);
        const selInicial = {};
        lista.forEach(lt => {
          if (parseFloat(lt.stock_cajas || 0) > 0 || parseFloat(lt.stock_fraccion || 0) > 0) {
            selInicial[lt.id] = true;
          }
        });
        setLotesSemaforoSeleccionados(selInicial);
      }
    } catch (err) {
      console.error('Error al consultar semáforo de vencimientos:', err);
      toast.error('No se pudo consultar el semáforo de vencimientos.');
    } finally {
      setCargandoSemaforo(false);
    }
  };

  const lotesSemaforoFiltrados = lotesSemaforo.filter(lt => {
    if (filtroTipoSemaforo === 'VENCIDOS' && lt.categoriaSemaforo !== 'Vencido') return false;
    if (filtroTipoSemaforo === 'CRITICOS' && !lt.categoriaSemaforo.startsWith('Crítico')) return false;
    if (filtroTipoSemaforo === 'PROXIMOS' && !lt.categoriaSemaforo.startsWith('Próximo')) return false;

    if (busquedaSemaforo.trim()) {
      const q = busquedaSemaforo.toLowerCase();
      const medNom = (lt.medicamento?.nombre_comercial || '').toLowerCase();
      const numLote = (lt.numero_lote || '').toLowerCase();
      const lab = (lt.medicamento?.laboratorio || '').toLowerCase();
      return medNom.includes(q) || numLote.includes(q) || lab.includes(q);
    }
    return true;
  });

  const toggleSeleccionarLote = (id) => {
    setLotesSemaforoSeleccionados(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSeleccionarTodosSemaforo = (seleccionar) => {
    const nuevo = {};
    if (seleccionar) {
      lotesSemaforoFiltrados.forEach(lt => {
        nuevo[lt.id] = true;
      });
    }
    setLotesSemaforoSeleccionados(nuevo);
  };

  const aplicarLotesSemaforoSeleccionados = () => {
    const lotesElegidos = lotesSemaforo.filter(lt => lotesSemaforoSeleccionados[lt.id]);
    if (!lotesElegidos.length) {
      return toast.error('Seleccione al menos un lote para importar.');
    }

    const nuevosItems = lotesElegidos.map(lt => {
      const med = medicamentos.find(m => String(m.id) === String(lt.id_medicamento)) || lt.medicamento || {};
      const stockDisp = parseFloat(lt.stock_cajas || 0);
      return {
        id_medicamento: lt.id_medicamento || med.id,
        id_lote: lt.id,
        cantidad: stockDisp > 0 ? stockDisp : 1,
        precio_unitario: parseFloat(lt.costo_compra || lt.precio_compra || med.precio_compra || 0),
        stock_disp: stockDisp,
        lotes_disp: [
          {
            id: lt.id,
            numero_lote: lt.numero_lote,
            fecha_vencimiento: lt.fecha_vencimiento,
            stock_cajas: lt.stock_cajas
          }
        ]
      };
    });

    if (itemsForm.length === 1 && !itemsForm[0].id_medicamento) {
      setItemsForm(nuevosItems);
    } else {
      const idsLoteExistentes = new Set(itemsForm.map(i => i.id_lote).filter(Boolean));
      const filtrarNuevos = nuevosItems.filter(it => !idsLoteExistentes.has(it.id_lote));
      setItemsForm(prev => [...prev, ...filtrarNuevos]);
    }

    setModalSemaforo(false);
    toast.success(`${lotesElegidos.length} lote(s) cargado(s) a la devolución.`);
  };

  // Buscador predictivo rápido en formulario
  const resultadosFarmaRapidos = busquedaFarmaRapida.trim().length >= 2
    ? medicamentos.filter(m => {
        const q = busquedaFarmaRapida.toLowerCase();
        return (
          (m.nombre_comercial && m.nombre_comercial.toLowerCase().includes(q)) ||
          (m.principio_activo && m.principio_activo.toLowerCase().includes(q)) ||
          (m.laboratorio && m.laboratorio.toLowerCase().includes(q))
        );
      }).slice(0, 10)
    : [];

  const handleSeleccionarFarmaRapido = async (med) => {
    setBusquedaFarmaRapida('');
    try {
      const resLotes = await api.get(`/lotes/medicamento/${med.id}`);
      const lotes = resLotes.data?.lotes || [];
      const primerLote = lotes.find((l) => parseFloat(l.stock_cajas || 0) > 0) || lotes[0];
      const stockDisp = parseFloat(primerLote?.stock_cajas || med.stock_cajas || 0);

      const nuevoItem = {
        id_medicamento: med.id,
        id_lote: primerLote?.id || '',
        cantidad: stockDisp > 0 ? 1 : 1,
        precio_unitario: parseFloat(med.precio_compra || 0),
        stock_disp: stockDisp,
        lotes_disp: lotes
      };

      if (itemsForm.length === 1 && !itemsForm[0].id_medicamento) {
        setItemsForm([nuevoItem]);
      } else {
        setItemsForm(prev => [...prev, nuevoItem]);
      }
      toast.success(`${med.nombre_comercial} agregado.`);
    } catch {
      const nuevoItem = {
        id_medicamento: med.id,
        id_lote: '',
        cantidad: 1,
        precio_unitario: parseFloat(med.precio_compra || 0),
        stock_disp: parseFloat(med.stock_cajas || 0),
        lotes_disp: []
      };
      if (itemsForm.length === 1 && !itemsForm[0].id_medicamento) {
        setItemsForm([nuevoItem]);
      } else {
        setItemsForm(prev => [...prev, nuevoItem]);
      }
    }
  };

  // Validación de exceso de stock
  const hayExcesoStock = itemsForm.some(
    (it) => it.id_medicamento && parseFloat(it.cantidad || 0) > parseFloat(it.stock_disp || 0)
  );

  // Enviar formulario de Devolución
  const handleGuardarDevolucion = async (e) => {
    e.preventDefault();
    if (!idProveedorForm) {
      return toast.error('Seleccione la droguería o laboratorio receptor.');
    }

    const itemsValidos = itemsForm.filter((it) => it.id_medicamento && parseFloat(it.cantidad) > 0);
    if (!itemsValidos.length) {
      return toast.error('Indique al menos un medicamento con cantidad mayor a 0 para devolver.');
    }

    // Validación estricta de stock
    const itemExcedido = itemsValidos.find(it => parseFloat(it.cantidad) > parseFloat(it.stock_disp || 0));
    if (itemExcedido) {
      const medEx = medicamentos.find(m => String(m.id) === String(itemExcedido.id_medicamento));
      return toast.error(`Bloqueo de exceso: "${medEx?.nombre_comercial || 'Producto'}" supera el stock disponible (${itemExcedido.stock_disp} cajas).`);
    }

    try {
      setGuardando(true);
      const payload = {
        id_proveedor: idProveedorForm,
        motivo: motivoForm,
        tipo_compensacion: tipoCompensacionForm,
        transportista: transportistaForm,
        observaciones: observacionesForm,
        items: itemsValidos.map((it) => ({
          id_medicamento: it.id_medicamento,
          id_lote: it.id_lote || null,
          cantidad: parseFloat(it.cantidad),
          precio_unitario: parseFloat(it.precio_unitario || 0)
        }))
      };

      const rawRes = await api.post('/devoluciones-proveedor', payload);
      const res = rawRes?.data || rawRes;
      if (res?.success) {
        toast.success(res.message || 'Guía de devolución registrada con éxito.');
        setModalNuevo(false);
        cargarDatos();
      }
    } catch (err) {
      console.error('Error al registrar devolución:', err);
      toast.error(err.response?.data?.message || 'Error al registrar la devolución al proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado de una devolución
  const handleActualizarEstado = async (id, nuevoEstado) => {
    try {
      const rawRes = await api.put(`/devoluciones-proveedor/${id}/estado`, { estado: nuevoEstado });
      const res = rawRes?.data || rawRes;
      if (res?.success) {
        toast.success(`Estado actualizado a: ${nuevoEstado}`);
        cargarDatos();
        if (devolucionSeleccionada && devolucionSeleccionada.id === id) {
          setDevolucionSeleccionada((prev) => ({ ...prev, estado: nuevoEstado }));
        }
      }
    } catch (err) {
      toast.error('No se pudo actualizar el estado de la devolución.');
    }
  };

  // Atajo para cerrar modal con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalSemaforo) {
          setModalSemaforo(false);
          return;
        }
        if (modalNuevo && !guardando) setModalNuevo(false);
        if (modalDetalle) setModalDetalle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalNuevo, modalDetalle, modalSemaforo, guardando]);

  // Formato de badge de estado
  const renderBadgeEstado = (estado) => {
    const conf = ESTADOS_DEVOLUCION.find((e) => e.id === estado);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black border ${
          conf?.color || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{conf?.label || estado}</span>
      </span>
    );
  };

  const getNombreMotivo = (val) => {
    return MOTIVOS_DEVOLUCION.find((m) => m.value === val)?.label || val;
  };

  return (
    <div className="space-y-4 font-sora">
      {/* ─── TARJETA HEADER + KPIS DE DEVOLUCIONES ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <RotateCcw className="w-6 h-6 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  Devoluciones y Canjes a Proveedores
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-[#00B884]" />
                  BPA & Retornos
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Gestión formal de guías de salida por canjes de vencimiento, mermas de droguería y notas de crédito.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Devolución a Droguería</span>
          </button>
        </div>

        {/* Barra de 4 Indicadores Métricos (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>Total Devoluciones</span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
              {resumen?.totalDevoluciones || 0}
            </p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              Valorizado: S/ {parseFloat(resumen?.montoTotal || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[11px] font-bold">
              <span>Pendientes de Envío</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono mt-1">
              {resumen?.pendientes?.count || 0}
            </p>
            <p className="text-[10.5px] text-amber-600/80 dark:text-amber-400/70 font-medium mt-0.5">
              Por entregar: S/ {parseFloat(resumen?.pendientes?.monto || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-[11px] font-bold">
              <span>En Droguería / Trámite</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-lg font-black text-blue-700 dark:text-blue-300 font-mono mt-1">
              {resumen?.entregados?.count || 0}
            </p>
            <p className="text-[10.5px] text-blue-600/80 dark:text-blue-400/70 font-medium mt-0.5">
              En revisión: S/ {parseFloat(resumen?.entregados?.monto || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
              <span>Aceptados (Con N.C.)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
              {resumen?.aceptadosNC?.count || 0}
            </p>
            <p className="text-[10.5px] text-emerald-600/80 dark:text-emerald-400/70 font-medium mt-0.5">
              Recuperado: S/ {parseFloat(resumen?.aceptadosNC?.monto || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° Guía (GD-000001), observaciones..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownPill
            value={filtroEstado}
            onChange={(val) => setFiltroEstado(val)}
            options={ESTADOS_DEVOLUCION.map((st) => ({
              value: st.id,
              label: st.label
            }))}
            icon={Filter}
            placeholder="Filtrar por estado..."
            className="w-48 sm:w-52"
          />

          <DropdownPill
            value={filtroProveedor}
            onChange={(val) => setFiltroProveedor(val)}
            options={[
              { value: '', label: 'Todas las droguerías' },
              ...proveedores.map((p) => ({
                value: p.id,
                label: p.razon_social,
                subtitle: `${p.tipo_documento || 'RUC'}: ${p.numero_documento || p.ruc || 'S/N'}`
              }))
            ]}
            icon={Building2}
            placeholder="Todas las droguerías"
            searchPlaceholder="Buscar droguería..."
            className="w-48 sm:w-60"
          />

          <button
            type="button"
            onClick={cargarDatos}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── TABLA DE GUÍAS DE DEVOLUCIÓN ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl soft-card-shadow border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">N° Guía Devolución</th>
                <th className="py-3 px-4">Droguería / Proveedor</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Motivo BPA</th>
                <th className="py-3 px-4 text-center">Fármacos</th>
                <th className="py-3 px-4 text-right">Total Devuelto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <span>Cargando guías de devolución a droguerías...</span>
                    </div>
                  </td>
                </tr>
              ) : devoluciones.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Package className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        No hay guías de devolución registradas
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Crea una devolución para retirar productos vencidos o mermas y emitir la guía oficial de retorno.
                      </p>
                      <button
                        type="button"
                        onClick={abrirModalNuevo}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva Devolución</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                devoluciones.map((dev) => {
                  const itemsDev = Array.isArray(dev.detalles)
                    ? dev.detalles
                    : dev.detalles?.items || [];
                  const cantItems = itemsDev.length;
                  const tipoComp = dev.detalles?.tipo_compensacion || (dev.motivo === 'Vencimiento_Proximo' ? 'Canje_Fisico' : 'Nota_Credito');
                  const transportistaDev = dev.detalles?.transportista || {};
                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-slate-100">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                          {dev.numero_guia_devolucion}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                          {dev.proveedor?.razon_social || 'Proveedor Desconocido'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          RUC: {dev.proveedor?.numero_documento || dev.proveedor?.ruc || 'S/N'}
                        </p>
                        {transportistaDev.placa && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                            <Truck className="w-3 h-3 text-slate-400" />
                            Placa: {transportistaDev.placa}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(dev.createdAt || dev.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(dev.createdAt || dev.created_at).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[10.5px] font-bold">
                            {getNombreMotivo(dev.motivo)}
                          </span>
                          <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[9.5px] font-black border ${
                            tipoComp === 'Canje_Fisico'
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}>
                            {tipoComp === 'Canje_Fisico' ? (
                              <>
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                                <span>Canje Físico</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-2.5 h-2.5" />
                                <span>Nota Crédito</span>
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                        {cantItems} ítem(s)
                      </td>

                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                        S/ {parseFloat(dev.total_devuelto || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {renderBadgeEstado(dev.estado)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDevolucionSeleccionada(dev);
                              setModalDetalle(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Ver detalles e imprimir guía"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <select
                            value={dev.estado}
                            onChange={(e) => handleActualizarEstado(dev.id, e.target.value)}
                            className="bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] py-1 px-1.5 font-bold cursor-pointer hover:border-slate-400"
                            title="Cambiar estado de tramitación"
                          >
                            <option value="Pendiente_Envio">Pendiente Envío</option>
                            <option value="Entregado_Drogueria">Entregado Droguería</option>
                            <option value="Aceptado_NC">Aceptado (Con NC)</option>
                            <option value="Rechazado">Rechazado</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: REGISTRAR NUEVA DEVOLUCIÓN A DROGUERÍA ─── */}
      {modalNuevo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => !guardando && setModalNuevo(false)}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera Fija */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Registrar Guía de Devolución a Proveedor
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Salida de stock farmacéutico por canje, vencimiento o no conformidad BPA
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                disabled={guardando}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Formulario con cuerpo scrolleable y pie fijo */}
            <form onSubmit={handleGuardarDevolucion} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-modal-scroll">
                {/* Datos de Cabecera: Proveedor y Motivo con DropdownPills oficiales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Droguería / Laboratorio Destino <strong className="text-rose-500">*</strong>
                      </label>
                      <button
                        type="button"
                        onClick={() => setModalNuevaDrogueria(true)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer transition-all"
                        title="Registrar nueva droguería en SUNAT sin salir"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Nueva Droguería</span>
                      </button>
                    </div>
                    <DropdownPill
                      value={idProveedorForm}
                      onChange={(val) => setIdProveedorForm(val)}
                      options={proveedores.map((p) => ({
                        value: p.id,
                        label: p.razon_social,
                        subtitle: `${p.tipo_documento || 'RUC'}: ${p.numero_documento || p.ruc || 'S/N'}`
                      }))}
                      icon={Building2}
                      placeholder="Seleccionar droguería o laboratorio..."
                      searchPlaceholder="Buscar droguería por nombre o RUC..."
                      required
                    />
                  </div>

                  <div>
                    <DropdownPill
                      label="Motivo de Devolución BPA"
                      required
                      value={motivoForm}
                      onChange={(val) => {
                        const m = val;
                        setMotivoForm(m);
                        if (m === 'Vencimiento_Proximo') {
                          setTipoCompensacionForm('Canje_Fisico');
                        } else if (m === 'Producto_Vencido' || m === 'Deterioro_Empaque') {
                          setTipoCompensacionForm('Nota_Credito');
                        }
                      }}
                      options={MOTIVOS_DEVOLUCION.map((m) => ({
                        value: m.value,
                        label: m.label,
                        subtitle: m.desc
                      }))}
                      icon={AlertTriangle}
                      placeholder="Seleccionar motivo regulador BPA..."
                      searchPlaceholder="Buscar motivo..."
                    />
                  </div>
                </div>

                {/* ─── TIPO DE COMPENSACIÓN ACORDADA ─── */}
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                    Tipo de Compensación o Destino del Trámite <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTipoCompensacionForm('Canje_Fisico')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        tipoCompensacionForm === 'Canje_Fisico'
                          ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        tipoCompensacionForm === 'Canje_Fisico'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>Canje Físico de Lote</span>
                          {tipoCompensacionForm === 'Canje_Fisico' && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Reposición unidad por unidad con nuevo lote vigente (sin transacción contable).
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoCompensacionForm('Nota_Credito')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        tipoCompensacionForm === 'Nota_Credito'
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        tipoCompensacionForm === 'Nota_Credito'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>Nota de Crédito (NC)</span>
                          {tipoCompensacionForm === 'Nota_Credito' && (
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Deducción financiera del saldo pendiente o saldo a favor con la droguería.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ─── ASISTENTE DE CANJES BPA & BUSCADOR PREDICTIVO RÁPIDO ─── */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-slate-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/50 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          Asistente de Canjes y Lotes BPA
                        </span>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          Precarga automática de lotes vencidos o próximos a expirar según semáforo
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={abrirAsistenteLotesSemaforo}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cargar Lotes por Vencer</span>
                    </button>
                  </div>

                  {/* Buscador predictivo rápido */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={busquedaFarmaRapida}
                        onChange={(e) => setBusquedaFarmaRapida(e.target.value)}
                        placeholder="Escriba para buscar fármaco y agregarlo instantáneamente..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                      {busquedaFarmaRapida && (
                        <button
                          type="button"
                          onClick={() => setBusquedaFarmaRapida('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Menú de resultados predictivos */}
                    {busquedaFarmaRapida.trim().length >= 2 && resultadosFarmaRapidos.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl divide-y divide-slate-100 dark:divide-slate-700/60 custom-modal-scroll">
                        {resultadosFarmaRapidos.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handleSeleccionarFarmaRapido(med)}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50/70 dark:hover:bg-slate-700/60 flex items-center justify-between text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <p className="font-black text-slate-800 dark:text-slate-100">
                                {med.nombre_comercial}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {med.concentracion || med.presentacion || 'General'} • Lab: {med.laboratorio || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                parseFloat(med.stock_cajas || 0) > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                Stock: {med.stock_cajas || 0}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                P. Compra: S/ {parseFloat(med.precio_compra || 0).toFixed(2)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── LISTA DE FÁRMACOS Y LOTES A DEVOLVER ─── */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fármacos y Lotes a Devolver ({itemsForm.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={agregarFilaItem}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Agregar Fila</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itemsForm.map((item, idx) => {
                      const excedeStock = item.id_medicamento && parseFloat(item.cantidad || 0) > parseFloat(item.stock_disp || 0);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition-all space-y-2 text-xs ${
                            excedeStock
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                            {/* Selector Medicamento con DropdownPill */}
                            <div className="sm:col-span-5">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Medicamento #{idx + 1} <strong className="text-rose-500">*</strong>
                              </label>
                              <DropdownPill
                                value={item.id_medicamento}
                                onChange={(val) => handleMedicamentoChange(idx, val)}
                                options={medicamentos.map((m) => ({
                                  value: m.id,
                                  label: m.nombre_comercial,
                                  subtitle: `${m.concentracion || m.presentacion || 'General'} • Lab: ${m.laboratorio || 'N/A'} • Stock: ${m.stock_cajas || 0} cjs`
                                }))}
                                icon={Package}
                                placeholder="Seleccionar fármaco..."
                                searchPlaceholder="Buscar medicamento..."
                                direction="down"
                              />
                            </div>

                            {/* Selector Lote con DropdownPill */}
                            <div className="sm:col-span-3">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Lote / Vencimiento
                              </label>
                              <DropdownPill
                                value={item.id_lote}
                                onChange={(val) => handleLoteChange(idx, val)}
                                disabled={!item.lotes_disp || !item.lotes_disp.length}
                                options={
                                  item.lotes_disp && item.lotes_disp.length > 0
                                    ? item.lotes_disp.map((lt) => ({
                                        value: lt.id,
                                        label: `Lote ${lt.numero_lote}`,
                                        subtitle: `Vence: ${lt.fecha_vencimiento || 'S/F'} • Disp: ${lt.stock_cajas} cjs`
                                      }))
                                    : [{ value: '', label: 'Lote General / Sin asignar' }]
                                }
                                icon={Layers}
                                placeholder="Seleccionar lote..."
                                searchPlaceholder="Buscar lote..."
                                direction="down"
                              />
                            </div>

                            {/* Cantidad con botón [Máx] */}
                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[10px] uppercase font-bold text-slate-400">
                                  Cant. (Cajas)
                                </label>
                                {item.stock_disp > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setItemsForm((prev) =>
                                        prev.map((it, i) => (i === idx ? { ...it, cantidad: it.stock_disp } : it))
                                      );
                                    }}
                                    className="text-[9.5px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                                    title="Cargar stock máximo disponible"
                                  >
                                    [Máx: {item.stock_disp}]
                                  </button>
                                )}
                              </div>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.cantidad}
                                onChange={(e) =>
                                  setItemsForm((prev) =>
                                    prev.map((it, i) =>
                                      i === idx ? { ...it, cantidad: e.target.value } : it
                                    )
                                  )
                                }
                                className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none ${
                                  excedeStock
                                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 dark:text-rose-300 focus:border-rose-600'
                                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                                }`}
                              />
                            </div>

                            {/* Costo Unitario & Botón Eliminar */}
                            <div className="sm:col-span-2 flex items-center justify-between gap-1.5">
                              <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                  Costo S/
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.precio_unitario}
                                  onChange={(e) =>
                                    setItemsForm((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, precio_unitario: e.target.value } : it
                                      )
                                    )
                                  }
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              {itemsForm.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarFilaItem(idx)}
                                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0 mt-4"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Alerta si la cantidad supera el stock disponible */}
                          {excedeStock && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200/80 dark:border-rose-800/60">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>
                                Cantidad ({item.cantidad}) supera el stock disponible en botica ({item.stock_disp} cajas). Corrija antes de emitir.
                              </span>
                            </div>
                          )}

                          {/* Subtotal fila y stock */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 font-mono">
                            <span>Stock disponible: {item.stock_disp || 0} cajas</span>
                            <span>
                              Subtotal: <strong className="text-slate-900 dark:text-slate-100">S/ {((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)).toFixed(2)}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── DATOS DE DESPACHO Y TRANSPORTISTA (SUSTENTO BPA / SUNAT) ─── */}
                <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
                  <button
                    type="button"
                    onClick={() => setMostrarTransporte(!mostrarTransporte)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Datos del Transportista / Despacho (Sustento BPA & SUNAT)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {mostrarTransporte ? 'Visible' : 'Opcional'}
                      </span>
                    </div>
                    {mostrarTransporte ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {mostrarTransporte && (
                    <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] uppercase font-bold text-slate-500 block mb-1">
                            Nombre del Conductor / Transportista
                          </label>
                          <input
                            type="text"
                            value={transportistaForm.nombre}
                            onChange={(e) => setTransportistaForm((prev) => ({ ...prev, nombre: e.target.value }))}
                            placeholder="Ej. Juan Carlos Pérez Quispe"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] uppercase font-bold text-slate-500 block mb-1">
                            DNI / Licencia de Conducir
                          </label>
                          <input
                            type="text"
                            value={transportistaForm.dni}
                            onChange={(e) => setTransportistaForm((prev) => ({ ...prev, dni: e.target.value }))}
                            placeholder="Ej. 45892134"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] uppercase font-bold text-slate-500 block mb-1">
                            Placa de Vehículo / Furgón
                          </label>
                          <input
                            type="text"
                            value={transportistaForm.placa}
                            onChange={(e) => setTransportistaForm((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                            placeholder="Ej. ABC-789"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] uppercase font-bold text-slate-500 block mb-1">
                            N° Guía Remisión Remitente (Botica)
                          </label>
                          <input
                            type="text"
                            value={transportistaForm.guia_remitente}
                            onChange={(e) => setTransportistaForm((prev) => ({ ...prev, guia_remitente: e.target.value.toUpperCase() }))}
                            placeholder="Ej. T001-000452"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    Observaciones y Acuerdos de Retorno
                  </label>
                  <textarea
                    rows="2"
                    value={observacionesForm}
                    onChange={(e) => setObservacionesForm(e.target.value)}
                    placeholder="Ej. Canje acordado con el representante comercial. Entrega en furgón con control térmico..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pie de modal fijo */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total a Devolver
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    S/ {calcularTotalFormulario().toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNuevo(false)}
                    disabled={guardando}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || hayExcesoStock}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer ${
                      hayExcesoStock
                        ? 'bg-rose-500 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25 disabled:opacity-50'
                    }`}
                  >
                    {guardando ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generando Guía...</span>
                      </>
                    ) : hayExcesoStock ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Bloqueado: Exceso de Stock</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Emitir Guía de Devolución</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: DETALLE E IMPRESIÓN OFICIAL DE GUÍA ─── */}
      {modalDetalle && devolucionSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setModalDetalle(false)}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera Fija */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                      Guía {devolucionSeleccionada.numero_guia_devolucion}
                    </h3>
                    {renderBadgeEstado(devolucionSeleccionada.estado)}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Comprobante formal de retiro y recepción de mercadería
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalDetalle(false)}
                  className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition-all cursor-pointer group"
                >
                  <X className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Contenido imprimible de la guía */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-modal-scroll print:p-0">
              {(() => {
                const itemsDetalle = Array.isArray(devolucionSeleccionada.detalles)
                  ? devolucionSeleccionada.detalles
                  : devolucionSeleccionada.detalles?.items || [];
                const tipoCompDetalle = devolucionSeleccionada.detalles?.tipo_compensacion || (devolucionSeleccionada.motivo === 'Vencimiento_Proximo' ? 'Canje_Fisico' : 'Nota_Credito');
                const transportistaDetalle = devolucionSeleccionada.detalles?.transportista || {};

                return (
                  <>
                    {/* Encabezado formal de la guía */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Droguería Receptora
                          </span>
                          <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                            {devolucionSeleccionada.proveedor?.razon_social || 'N/A'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            RUC: {devolucionSeleccionada.proveedor?.numero_documento || devolucionSeleccionada.proveedor?.ruc || 'S/N'}
                          </p>
                          {devolucionSeleccionada.proveedor?.telefono && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Tel: {devolucionSeleccionada.proveedor.telefono}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Datos de Emisión & Trámite
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            Fecha: <strong>{new Date(devolucionSeleccionada.createdAt || devolucionSeleccionada.created_at).toLocaleString('es-PE')}</strong>
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                            Motivo: <strong className="text-indigo-600 dark:text-indigo-400">{getNombreMotivo(devolucionSeleccionada.motivo)}</strong>
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Autorizado por: {devolucionSeleccionada.usuario?.nombre || 'Administrador Q.F.'}
                          </p>
                        </div>
                      </div>

                      {/* Tipo de compensación */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] uppercase font-bold text-slate-400">
                            Compensación Acordada:
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                            tipoCompDetalle === 'Canje_Fisico'
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}>
                            {tipoCompDetalle === 'Canje_Fisico' ? (
                              <>
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Canje Físico de Lote (Reposición de Producto)</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Nota de Crédito (Deducción Financiera)</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Datos del transportista si existen */}
                      {(transportistaDetalle.nombre || transportistaDetalle.placa || transportistaDetalle.guia_remitente) && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1.5 mb-1">
                            <Truck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Despacho y Traslado Autorizado (BPA/SUNAT)</span>
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Conductor:</span>
                              <strong>{transportistaDetalle.nombre || 'No registrado'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">DNI:</span>
                              <strong>{transportistaDetalle.dni || 'S/N'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">Placa Vehículo:</span>
                              <strong>{transportistaDetalle.placa || 'S/N'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px]">N° Guía Remitente:</span>
                              <strong>{transportistaDetalle.guia_remitente || 'S/N'}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {devolucionSeleccionada.observaciones && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 italic">
                          «{devolucionSeleccionada.observaciones}»
                        </div>
                      )}
                    </div>

                    {/* Tabla de ítems devueltos */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Fármaco</th>
                            <th className="py-2.5 px-3">Lote</th>
                            <th className="py-2.5 px-3 text-center">Cant.</th>
                            <th className="py-2.5 px-3 text-right">P. Unit</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                          {itemsDetalle.length > 0 ? (
                            itemsDetalle.map((it, i) => (
                              <tr key={i}>
                                <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                  {it.nombre_medicamento || 'Medicamento'}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                  {it.numero_lote || 'LOTE-GRAL'}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold">
                                  {it.cantidad}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono">
                                  S/ {parseFloat(it.precio_unitario || 0).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  S/ {parseFloat(it.subtotal || (it.cantidad * it.precio_unitario) || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-4 text-center text-slate-400">
                                Sin detalle registrado
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 font-black font-mono">
                          <tr>
                            <td colSpan="5" className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-500">
                              Total Valorizado Devuelto:
                            </td>
                            <td className="py-2.5 px-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                              S/ {parseFloat(devolucionSeleccionada.total_devuelto || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Cuadros de Conformidad para Firma (Impresión) */}
                    <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                      <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Entregado por (Botica)
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          {devolucionSeleccionada.usuario?.nombre || 'Químico Farmacéutico'} / Reg. CQFP
                        </p>
                      </div>
                      <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Recibido Conforme (Droguería)
                        </p>
                        <p className="text-[10.5px] text-slate-400 font-mono">
                          {transportistaDetalle.nombre
                            ? `${transportistaDetalle.nombre} (DNI: ${transportistaDetalle.dni || 'S/N'})`
                            : 'Transportista / Nombre y DNI'}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Pie fijo */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setModalDetalle(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: ASISTENTE DE LOTES SEMÁFORO BPA (CANJES) ─── */}
      {modalSemaforo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setModalSemaforo(false)}
          className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[90vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Cabecera Fija */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                  <Clock className="w-5 h-5 text-amber-500" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Asistente de Canjes BPA: Lotes por Vencer</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Semáforo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Selecciona los lotes críticos o próximos a expirar para cargarlos con 1 clic a la devolución
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalSemaforo(false)}
                className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition-all cursor-pointer group"
              >
                <X className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Filtros rápidos y buscador interno */}
            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={busquedaSemaforo}
                  onChange={(e) => setBusquedaSemaforo(e.target.value)}
                  placeholder="Filtrar por fármaco, lote o laboratorio..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botones de filtro de categoría */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'CRITICOS', label: 'Críticos (≤30d)', dotColor: 'bg-rose-500' },
                  { id: 'PROXIMOS', label: 'Próximos (31-90d)', dotColor: 'bg-amber-500' },
                  { id: 'VENCIDOS', label: 'Vencidos', dotColor: 'bg-slate-700' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroTipoSemaforo(f.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filtroTipoSemaforo === f.id
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f.dotColor && <span className={`w-2 h-2 rounded-full ${f.dotColor}`} />}
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de lotes */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-2.5 custom-modal-scroll">
              {cargandoSemaforo ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Consultando semáforo oficial de vencimientos...</span>
                </div>
              ) : lotesSemaforoFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                    No se encontraron lotes para este criterio
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tu botica no registra lotes en riesgo para el filtro seleccionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>
                      Mostrando <strong>{lotesSemaforoFiltrados.length}</strong> lote(s) en riesgo
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSeleccionarTodosSemaforo(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                      >
                        Marcar todos
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => toggleSeleccionarTodosSemaforo(false)}
                        className="text-slate-500 hover:text-slate-700 font-bold underline cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  {lotesSemaforoFiltrados.map((lt) => {
                    const estaSel = !!lotesSemaforoSeleccionados[lt.id];
                    const med = lt.medicamento || {};
                    return (
                      <div
                        key={lt.id}
                        onClick={() => toggleSeleccionarLote(lt.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          estaSel
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1 rounded-lg shrink-0 ${
                            estaSel ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300'
                          }`}>
                            {estaSel ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                {med.nombre_comercial || 'Medicamento'}
                              </p>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${lt.colorBadge}`}>
                                {lt.categoriaSemaforo}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                              Lote: <strong className="text-slate-800 dark:text-slate-200">{lt.numero_lote}</strong> • Vence: <strong className="text-rose-600 dark:text-rose-400">{lt.fecha_vencimiento}</strong> • Lab: {med.laboratorio || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100 block">
                            {lt.stock_cajas || 0} cajas
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Costo: S/ {parseFloat(lt.costo_compra || lt.precio_compra || med.precio_compra || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie fijo */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {Object.values(lotesSemaforoSeleccionados).filter(Boolean).length} lote(s) marcado(s)
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalSemaforo(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={aplicarLotesSemaforoSeleccionados}
                  disabled={Object.values(lotesSemaforoSeleccionados).filter(Boolean).length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Importar a la Guía</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Registrar Nueva Droguería en línea */}
      <ModalRegistrarDrogueria
        isOpen={modalNuevaDrogueria}
        onClose={() => setModalNuevaDrogueria(false)}
        onSuccess={(nuevoProv) => {
          if (nuevoProv) {
            setProveedores((prev) => [nuevoProv, ...prev]);
            setIdProveedorForm(nuevoProv.id);
            toast.success(`Droguería "${nuevoProv.razon_social}" lista y seleccionada.`);
          }
        }}
      />
    </div>
  );
}
