import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
  Pill,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Check,
  Package,
  SlidersHorizontal,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Barcode,
  FileSpreadsheet,
  ChevronDown,
  Syringe,
  Droplets,
  FlaskConical,
  Sparkles,
  DollarSign,
  Tag,
  Snowflake,
  Sun,
  MapPin,
  Calendar,
  Percent,
  Calculator,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  FileText,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import ModalImportarMedicamentos from './components/ModalImportarMedicamentos';
import DropdownPill from './components/DropdownPill';
import DatePickerPill from './components/DatePickerPill';
import { useAuthStore } from '@heis/core';

const FORMAS_FARMACEUTICAS = [
  {
    id: 'Tableta',
    nombre: 'Tableta / Comprimido',
    subtitulo: 'Sólido oral ranurado o recubierto',
    icon: Pill,
    iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    tag: 'Oral'
  },
  {
    id: 'Cápsula',
    nombre: 'Cápsula',
    subtitulo: 'Gelatina blanda o dura con microgránulos',
    icon: Pill,
    iconColor: 'bg-teal-50 text-teal-600 border-teal-200/80',
    tag: 'Oral'
  },
  {
    id: 'Jarabe',
    nombre: 'Jarabe',
    subtitulo: 'Solución o elixir líquido azucarado',
    icon: FlaskConical,
    iconColor: 'bg-amber-50 text-amber-600 border-amber-200/80',
    tag: 'Líquido'
  },
  {
    id: 'Inyectable',
    nombre: 'Inyectable',
    subtitulo: 'Ampolla, vial o jeringa prellenada',
    icon: Syringe,
    iconColor: 'bg-sky-50 text-sky-600 border-sky-200/80',
    tag: 'Parenteral'
  },
  {
    id: 'Gotas',
    nombre: 'Gotas',
    subtitulo: 'Solución oftálmica, ótica o nasal',
    icon: Droplets,
    iconColor: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
    tag: 'Líquido'
  },
  {
    id: 'Crema',
    nombre: 'Crema / Pomada',
    subtitulo: 'Gel dérmico, ungüento o pasta tópica',
    icon: Layers,
    iconColor: 'bg-rose-50 text-rose-600 border-rose-200/80',
    tag: 'Tópico'
  },
  {
    id: 'Suspensión',
    nombre: 'Suspensión Oral',
    subtitulo: 'Polvo para reconstituir con agua',
    icon: FlaskConical,
    iconColor: 'bg-purple-50 text-purple-600 border-purple-200/80',
    tag: 'Líquido'
  },
  {
    id: 'Inhalador',
    nombre: 'Inhalador / Aerosol',
    subtitulo: 'Spray presurizado o nebulizador',
    icon: Sparkles,
    iconColor: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    tag: 'Inhalatorio'
  },
  {
    id: 'Óvulo',
    nombre: 'Óvulo / Supositorio',
    subtitulo: 'Presentación mucosal sólida',
    icon: Package,
    iconColor: 'bg-orange-50 text-orange-600 border-orange-200/80',
    tag: 'Mucosal'
  },
  {
    id: 'Sobre',
    nombre: 'Sobre / Sachet',
    subtitulo: 'Polvo granulado o sales efervescentes',
    icon: FileText,
    iconColor: 'bg-lime-50 text-lime-700 border-lime-200/80',
    tag: 'Polvo'
  }
];

// ─── Matriz Oficial de Compatibilidades Farmacéuticas (DIGEMID / BPA / BPD) ───
const MATRIZ_FARMACEUTICA = {
  Tableta: {
    unidadesMayor: [
      { value: 'Caja', label: 'Caja' },
      { value: 'Blister', label: 'Blíster' },
      { value: 'Frasco', label: 'Frasco' },
      { value: 'Pack', label: 'Pack' }
    ],
    unidadesMenor: [
      { value: 'Tableta', label: 'Tableta' },
      { value: 'Pastilla', label: 'Pastilla' },
      { value: 'Blister', label: 'Blíster' }
    ],
    defaultMayor: 'Caja',
    defaultMenor: 'Tableta',
    defaultUnidadesCaja: '100',
    fraccionableDefault: true,
    descripcion: 'Dispensación oral por blíster o pastilla/tableta unitaria.'
  },
  Cápsula: {
    unidadesMayor: [
      { value: 'Caja', label: 'Caja' },
      { value: 'Blister', label: 'Blíster' },
      { value: 'Frasco', label: 'Frasco' },
      { value: 'Pack', label: 'Pack' }
    ],
    unidadesMenor: [
      { value: 'Cápsula', label: 'Cápsula' },
      { value: 'Blister', label: 'Blíster' }
    ],
    defaultMayor: 'Caja',
    defaultMenor: 'Cápsula',
    defaultUnidadesCaja: '100',
    fraccionableDefault: true,
    descripcion: 'Dispensación oral por cápsula o blíster.'
  },
  Jarabe: {
    unidadesMayor: [
      { value: 'Frasco', label: 'Frasco' },
      { value: 'Caja', label: 'Caja con Frasco' },
      { value: 'Pack', label: 'Pack' }
    ],
    unidadesMenor: [
      { value: 'Frasco', label: 'Frasco' }
    ],
    defaultMayor: 'Frasco',
    defaultMenor: 'Frasco',
    defaultUnidadesCaja: '1',
    fraccionableDefault: false,
    descripcion: 'Solución líquida en frasco sellado íntegro (no divisible en pastillas).'
  },
  Inyectable: {
    unidadesMayor: [
      { value: 'Caja', label: 'Caja' },
      { value: 'Pack', label: 'Pack' },
      { value: 'Ampolla', label: 'Ampolla individual' }
    ],
    unidadesMenor: [
      { value: 'Ampolla', label: 'Ampolla' },
      { value: 'Vial', label: 'Vial / Frasco Ámpula' },
      { value: 'Jeringa', label: 'Jeringa Prellenada' },
      { value: 'Unidad', label: 'Unidad' }
    ],
    defaultMayor: 'Caja',
    defaultMenor: 'Ampolla',
    defaultUnidadesCaja: '5',
    fraccionableDefault: true,
    descripcion: 'Dispensación parenteral por ampolla o frasco vial.'
  },
  Gotas: {
    unidadesMayor: [
      { value: 'Frasco', label: 'Frasco Gotero' },
      { value: 'Caja', label: 'Caja con Gotero' }
    ],
    unidadesMenor: [
      { value: 'Frasco', label: 'Frasco Gotero' }
    ],
    defaultMayor: 'Frasco',
    defaultMenor: 'Frasco',
    defaultUnidadesCaja: '1',
    fraccionableDefault: false,
    descripcion: 'Solución oftálmica/ótica en frasco gotero sellado.'
  },
  Crema: {
    unidadesMayor: [
      { value: 'Tubo', label: 'Tubo' },
      { value: 'Pote', label: 'Pote' },
      { value: 'Caja', label: 'Caja con Tubo' }
    ],
    unidadesMenor: [
      { value: 'Tubo', label: 'Tubo' },
      { value: 'Pote', label: 'Pote' }
    ],
    defaultMayor: 'Tubo',
    defaultMenor: 'Tubo',
    defaultUnidadesCaja: '1',
    fraccionableDefault: false,
    descripcion: 'Semisólido dérmico en tubo o pomo sellado de fábrica.'
  },
  Suspensión: {
    unidadesMayor: [
      { value: 'Frasco', label: 'Frasco' },
      { value: 'Caja', label: 'Caja con Frasco' }
    ],
    unidadesMenor: [
      { value: 'Frasco', label: 'Frasco' }
    ],
    defaultMayor: 'Frasco',
    defaultMenor: 'Frasco',
    defaultUnidadesCaja: '1',
    fraccionableDefault: false,
    descripcion: 'Polvo para reconstituir en frasco sellado individual.'
  },
  Inhalador: {
    unidadesMayor: [
      { value: 'Inhalador', label: 'Inhalador / Aerosol' },
      { value: 'Caja', label: 'Caja con Inhalador' },
      { value: 'Frasco', label: 'Frasco Spray' }
    ],
    unidadesMenor: [
      { value: 'Inhalador', label: 'Inhalador' },
      { value: 'Unidad', label: 'Unidad' }
    ],
    defaultMayor: 'Inhalador',
    defaultMenor: 'Inhalador',
    defaultUnidadesCaja: '1',
    fraccionableDefault: false,
    descripcion: 'Dispositivo spray presurizado individual.'
  },
  Óvulo: {
    unidadesMayor: [
      { value: 'Caja', label: 'Caja' },
      { value: 'Blister', label: 'Blíster' }
    ],
    unidadesMenor: [
      { value: 'Óvulo', label: 'Óvulo' },
      { value: 'Supositorio', label: 'Supositorio' },
      { value: 'Blister', label: 'Blíster' }
    ],
    defaultMayor: 'Caja',
    defaultMenor: 'Óvulo',
    defaultUnidadesCaja: '7',
    fraccionableDefault: true,
    descripcion: 'Dispensación mucosal por óvulo o blíster.'
  },
  Sobre: {
    unidadesMayor: [
      { value: 'Caja', label: 'Caja' },
      { value: 'Paquete', label: 'Paquete' },
      { value: 'Display', label: 'Display' }
    ],
    unidadesMenor: [
      { value: 'Sobre', label: 'Sobre' },
      { value: 'Sachet', label: 'Sachet' },
      { value: 'Unidad', label: 'Unidad' }
    ],
    defaultMayor: 'Caja',
    defaultMenor: 'Sobre',
    defaultUnidadesCaja: '30',
    fraccionableDefault: true,
    descripcion: 'Dispensación unitaria por sobre o sachet.'
  }
};

const MATRIZ_FARMACEUTICA_DEFAULT = {
  unidadesMayor: [
    { value: 'Caja', label: 'Caja' },
    { value: 'Frasco', label: 'Frasco' },
    { value: 'Tubo', label: 'Tubo' },
    { value: 'Blister', label: 'Blíster' },
    { value: 'Pack', label: 'Pack' },
    { value: 'Unidad', label: 'Unidad' }
  ],
  unidadesMenor: [
    { value: 'Unidad', label: 'Unidad' },
    { value: 'Pastilla', label: 'Pastilla' },
    { value: 'Tableta', label: 'Tableta' },
    { value: 'Cápsula', label: 'Cápsula' },
    { value: 'Ampolla', label: 'Ampolla' },
    { value: 'Sobre', label: 'Sobre' },
    { value: 'Frasco', label: 'Frasco' }
  ],
  defaultMayor: 'Caja',
  defaultMenor: 'Unidad',
  defaultUnidadesCaja: '1',
  fraccionableDefault: false,
  descripcion: 'Presentación farmacéutica general.'
};

export default function Medicamentos() {
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';

  const [medicamentos, setMedicamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [medSeleccionado, setMedSeleccionado] = useState(null);
  const [ajusteData, setAjusteData] = useState({
    sentido: 'Salida', // 'Salida' (-) | 'Entrada' (+) | 'Desblistado' (🔄)
    tipo: 'Merma_Rotura',
    id_lote: '',
    formato: 'Caja',
    cantidad: '1',
    documento_referencia: '',
    motivo: '',
    enviar_cuarentena: false
  });
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  // Formulario Nuevo Medicamento (Estructura Farmacéutica Completa)
  const initialFormData = {
    codigo_barras: '',
    nombre_comercial: '',
    nombre_generico: '',
    concentracion: '',
    presentacion: 'Tableta',
    laboratorio: '',
    registro_sanitario: '',
    tipo_controlado: 'No_Controlado',
    requiere_receta: false,
    fraccionable: true,
    unidades_por_caja: '100',
    unidad_medida: 'Caja',
    unidad_fraccion: 'Tableta',
    precio_compra: '',
    precio_venta: '',
    precio_fraccion: '',
    stock_cajas: '',
    stock_fraccion: '0',
    stock_minimo: '5',
    ubicacion: '',
    id_categoria: '',
    temperatura_almacen: 'Ambiente',
    numero_lote_inicial: '',
    fecha_vencimiento_inicial: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [medicamentoEditando, setMedicamentoEditando] = useState(null);
  const [tabModal, setTabModal] = useState('ficha'); // 'ficha' | 'precios' | 'digemid'
  const [guardandoMedicamento, setGuardandoMedicamento] = useState(false);

  const resetForm = () => {
    setMedicamentoEditando(null);
    setFormData(initialFormData);
    setTabModal('ficha');
    setDropdownFormaOpen(false);
    setDropdownCategoriaOpen(false);
    setFiltroForma('');
    setFiltroCategoria('');
  };

  const abrirModalNuevo = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirModalEditar = (med) => {
    setMedicamentoEditando(med);
    let temp = 'Ambiente';
    let ubic = med.ubicacion || '';
    if (ubic.includes('[2-8°C]') || ubic.toLowerCase().includes('refrigerad')) {
      temp = 'Refrigerado';
      ubic = ubic.replace(/\[2-8°C\]\s*/i, '').replace(/\[Refrigerado 2-8°C\]\s*/i, '');
    }

    setFormData({
      codigo_barras: med.codigo_barras || '',
      nombre_comercial: med.nombre_comercial || '',
      nombre_generico: med.nombre_generico || '',
      concentracion: med.concentracion || '',
      presentacion: med.presentacion || 'Tableta',
      laboratorio: med.laboratorio || '',
      registro_sanitario: med.registro_sanitario || '',
      tipo_controlado: med.tipo_controlado || 'No_Controlado',
      requiere_receta: !!med.requiere_receta,
      fraccionable: !!med.fraccionable,
      unidades_por_caja: String(med.unidades_por_caja || '1'),
      unidad_medida: med.unidad_medida || 'Caja',
      unidad_fraccion: med.unidad_fraccion || 'Tableta',
      precio_compra: med.precio_compra !== undefined && med.precio_compra !== null ? String(med.precio_compra) : '',
      precio_venta: med.precio_venta !== undefined && med.precio_venta !== null ? String(med.precio_venta) : '',
      precio_fraccion: med.precio_fraccion !== undefined && med.precio_fraccion !== null ? String(med.precio_fraccion) : '',
      stock_cajas: String(med.stock_cajas || '0'),
      stock_fraccion: String(med.stock_fraccion || '0'),
      stock_minimo: String(med.stock_minimo || '5'),
      ubicacion: ubic,
      id_categoria: med.id_categoria ? String(med.id_categoria) : '',
      temperatura_almacen: temp,
      numero_lote_inicial: '',
      fecha_vencimiento_inicial: ''
    });
    setTabModal('ficha');
    setDropdownFormaOpen(false);
    setDropdownCategoriaOpen(false);
    setFiltroForma('');
    setFiltroCategoria('');
    setModalAbierto(true);
  };

  // Cambio inteligente de Forma Farmacéutica con actualización automática de compatibilidad
  const cambiarFormaFarmaceutica = (nuevaForma) => {
    const regla = MATRIZ_FARMACEUTICA[nuevaForma] || MATRIZ_FARMACEUTICA_DEFAULT;
    setFormData(prev => ({
      ...prev,
      presentacion: nuevaForma,
      fraccionable: regla.fraccionableDefault,
      unidad_medida: regla.defaultMayor,
      unidad_fraccion: regla.defaultMenor,
      unidades_por_caja: regla.defaultUnidadesCaja
    }));
  };

  // Validaciones del Wizard de 3 Pasos
  const validarPaso1 = () => {
    if (!formData.nombre_comercial || !formData.nombre_comercial.trim()) {
      toast.error('Indique el Nombre Comercial del medicamento en el Paso 1');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (!validarPaso1()) {
      setTabModal('ficha');
      return false;
    }
    const precioVenta = parseFloat(formData.precio_venta);
    if (isNaN(precioVenta) || precioVenta <= 0) {
      toast.error('Indique un Precio de Venta válido mayor a S/ 0.00 en el Paso 2');
      return false;
    }
    if (formData.fraccionable) {
      const uxc = parseInt(formData.unidades_por_caja);
      if (isNaN(uxc) || uxc < 1) {
        toast.error('Indique al menos 1 unidad por caja para dispensación fraccionada');
        return false;
      }
    }
    return true;
  };

  const intentarCambiarPaso = (destino) => {
    if (destino === 'ficha') {
      setTabModal('ficha');
      return;
    }
    if (destino === 'precios') {
      if (!validarPaso1()) {
        setTabModal('ficha');
        return;
      }
      setTabModal('precios');
      return;
    }
    if (destino === 'digemid') {
      if (!validarPaso1()) {
        setTabModal('ficha');
        return;
      }
      if (!validarPaso2()) {
        setTabModal('precios');
        return;
      }
      setTabModal('digemid');
      return;
    }
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await api.get('/categorias');
        const lista = res?.categorias || res?.data || [];
        if (Array.isArray(lista)) {
          setCategorias(lista);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    fetchCategorias();
  }, []);

  const generarCodigoInterno = () => {
    const code = '775' + Math.floor(100000000 + Math.random() * 900000000);
    setFormData(prev => ({ ...prev, codigo_barras: code }));
    toast.success(`Código interno EAN-13 generado: ${code}`);
  };

  const sugerirPrecioFraccion = () => {
    const venta = parseFloat(formData.precio_venta) || 0;
    const unidades = parseInt(formData.unidades_por_caja) || 1;
    if (venta > 0 && unidades > 0) {
      const sugerido = ((venta / unidades) * 1.15).toFixed(2);
      setFormData(prev => ({ ...prev, precio_fraccion: sugerido }));
      toast.success(`Precio sugerido de S/ ${sugerido} por ${formData.unidad_fraccion || 'unidad'} calculado`);
    } else {
      toast.error('Ingrese primero el Precio de Venta y las Unidades por Caja');
    }
  };

  // Bloquear scroll del fondo cuando cualquier modal esté abierto
  useEffect(() => {
    if (modalAbierto || modalAjusteAbierto || modalImportarAbierto) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [modalAbierto, modalAjusteAbierto, modalImportarAbierto]);

  // Selector personalizado de Forma Farmacéutica
  const [dropdownFormaOpen, setDropdownFormaOpen] = useState(false);
  const [filtroForma, setFiltroForma] = useState('');
  const dropdownFormaRef = useRef(null);
  const dropdownFormaMenuRef = useRef(null);

  // Selector personalizado de Categoría Terapéutica
  const [dropdownCategoriaOpen, setDropdownCategoriaOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const dropdownCategoriaRef = useRef(null);
  const dropdownCategoriaMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownFormaRef.current && !dropdownFormaRef.current.contains(event.target)) {
        setDropdownFormaOpen(false);
      }
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target)) {
        setDropdownCategoriaOpen(false);
      }
    }
    if (dropdownFormaOpen || dropdownCategoriaOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownFormaOpen, dropdownCategoriaOpen]);

  // Auto-scroll suave para enfocar completamente el menú de Forma Farmacéutica al abrirse
  useEffect(() => {
    if (dropdownFormaOpen) {
      const timer = setTimeout(() => {
        if (dropdownFormaMenuRef.current) {
          dropdownFormaMenuRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [dropdownFormaOpen]);

  // Auto-scroll suave para Categoría al abrirse hacia abajo
  useEffect(() => {
    if (dropdownCategoriaOpen) {
      const timer = setTimeout(() => {
        if (dropdownCategoriaMenuRef.current) {
          dropdownCategoriaMenuRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [dropdownCategoriaOpen]);

  const formaSeleccionada = FORMAS_FARMACEUTICAS.find(
    (f) => f.id.toLowerCase() === (formData.presentacion || '').toLowerCase()
  ) || {
    id: formData.presentacion || 'Tableta',
    nombre: formData.presentacion || 'Tableta',
    subtitulo: 'Presentación farmacéutica',
    icon: Pill,
    iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    tag: 'Oral'
  };
  const FormaIcon = formaSeleccionada.icon;

  const formasFiltradas = FORMAS_FARMACEUTICAS.filter((opc) => {
    if (!filtroForma.trim()) return true;
    const q = filtroForma.toLowerCase();
    return (
      opc.nombre.toLowerCase().includes(q) ||
      opc.subtitulo.toLowerCase().includes(q) ||
      opc.id.toLowerCase().includes(q) ||
      opc.tag.toLowerCase().includes(q)
    );
  });

  const abrirModalAjuste = (med) => {
    setMedSeleccionado(med);
    setAjusteData({
      sentido: 'Salida',
      tipo: 'Merma_Rotura',
      id_lote: med.lotes && med.lotes.length > 0 ? med.lotes[0].id : '',
      formato: 'Caja',
      cantidad: '1',
      documento_referencia: '',
      motivo: '',
      enviar_cuarentena: false
    });
    setModalAjusteAbierto(true);
  };

  const handleAjusteSubmit = async (e) => {
    e.preventDefault();
    const cantNum = parseFloat(ajusteData.cantidad);
    if (!cantNum || cantNum <= 0) {
      toast.error('Ingrese una cantidad válida mayor a 0');
      return;
    }
    if (!ajusteData.motivo.trim()) {
      toast.error('Debe indicar la justificación técnica para el Kardex DIGEMID');
      return;
    }

    // Validar disponibilidad si es salida o desblistado
    if (ajusteData.sentido === 'Desblistado') {
      const stockCajasDisp = parseFloat(medSeleccionado.stock_cajas) || 0;
      if (cantNum > stockCajasDisp) {
        toast.error(`Stock insuficiente para desblistar. Hay ${stockCajasDisp} caja(s) disponible(s).`);
        return;
      }
    } else if (ajusteData.sentido === 'Salida' && ajusteData.id_lote) {
      const loteActual = medSeleccionado.lotes?.find(l => String(l.id) === String(ajusteData.id_lote));
      if (loteActual) {
        const disp = ajusteData.formato === 'Caja'
          ? (parseFloat(loteActual.stock_cajas) || 0)
          : (parseInt(loteActual.stock_fraccion) || 0);
        if (cantNum > disp && disp > 0) {
          toast.error(`La cantidad (${cantNum}) supera el stock disponible en este lote (${disp} ${ajusteData.formato})`);
          return;
        }
      }
    }

    try {
      setGuardandoAjuste(true);
      const res = await api.post(`/medicamentos/${medSeleccionado.id}/ajuste`, {
        ...ajusteData,
        cantidad: cantNum
      });
      if (res.success) {
        toast.success(res.message || 'Ajuste registrado exitosamente en Kardex');
        setModalAjusteAbierto(false);
        cargarDatos();
      }
    } catch (error) {
      toast.error(error.message || 'Error al procesar ajuste');
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let url = `/medicamentos?limit=100`;
      if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
      const res = await api.get(url);
      if (res?.success) {
        const lista = res.medicamentos || res.data || [];
        setMedicamentos(Array.isArray(lista) ? lista : []);
      }
    } catch (e) {
      toast.error('Error al cargar catálogo');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [busqueda]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Si se presiona Enter en un input durante el Paso 1 o 2 en modo nuevo, avanzar ordenadamente
    if (!medicamentoEditando) {
      if (tabModal === 'ficha') {
        if (validarPaso1()) setTabModal('precios');
        return;
      }
      if (tabModal === 'precios') {
        if (validarPaso2()) setTabModal('digemid');
        return;
      }
    }

    // Validar que los pasos de datos y precios estén completos y correctos
    if (!validarPaso1()) {
      setTabModal('ficha');
      return;
    }
    if (!validarPaso2()) {
      setTabModal('precios');
      return;
    }

    // Si ingresó registro sanitario, validar formato DIGEMID oficial
    if (formData.registro_sanitario && formData.registro_sanitario.trim()) {
      const regexRS = /^(EN|EE|EB|BE|PN|PNE|PNN|GN|GE|DM|ED|NSOC)[\s\-]?[0-9A-Z\-]+$/i;
      if (!regexRS.test(formData.registro_sanitario.trim())) {
        toast.error('El Registro Sanitario no cumple el formato normativo DIGEMID (Ej: EN-04589, EE-12940, NSOC14589-22PE)');
        setTabModal('digemid');
        return;
      }
    }

    try {
      setGuardandoMedicamento(true);
      const ubicacionFinal = formData.temperatura_almacen === 'Refrigerado'
        ? (formData.ubicacion && formData.ubicacion.trim() ? `[2-8°C] ${formData.ubicacion.trim()}` : '[Refrigerado 2-8°C]')
        : (formData.ubicacion && formData.ubicacion.trim() ? formData.ubicacion.trim() : null);

      if (medicamentoEditando) {
        // En modo edición: Actualizar catálogo y precios
        const updatePayload = {
          codigo_barras: formData.codigo_barras ? formData.codigo_barras.trim() : null,
          nombre_comercial: formData.nombre_comercial.trim(),
          nombre_generico: formData.nombre_generico ? formData.nombre_generico.trim() : null,
          concentracion: formData.concentracion ? formData.concentracion.trim() : null,
          presentacion: formData.presentacion || 'Tableta',
          laboratorio: formData.laboratorio ? formData.laboratorio.trim() : null,
          registro_sanitario: formData.registro_sanitario ? formData.registro_sanitario.trim().toUpperCase() : null,
          tipo_controlado: formData.tipo_controlado || 'No_Controlado',
          requiere_receta: (formData.tipo_controlado && formData.tipo_controlado !== 'No_Controlado') ? true : !!formData.requiere_receta,
          fraccionable: !!formData.fraccionable,
          unidades_por_caja: parseInt(formData.unidades_por_caja) || 1,
          unidad_medida: formData.unidad_medida || 'Caja',
          unidad_fraccion: formData.unidad_fraccion || 'Tableta',
          precio_compra: parseFloat(formData.precio_compra) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          precio_fraccion: parseFloat(formData.precio_fraccion) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 0,
          ubicacion: ubicacionFinal,
          id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : null
        };

        const res = await api.put(`/medicamentos/${medicamentoEditando.id}`, updatePayload);
        if (res.success || res.medicamento) {
          toast.success('Medicamento y precios actualizados exitosamente');
          setModalAbierto(false);
          resetForm();
          cargarDatos();
        }
      } else {
        // En modo nuevo: Crear medicamento con lote inicial FEFO
        const payload = {
          codigo_barras: formData.codigo_barras ? formData.codigo_barras.trim() : null,
          nombre_comercial: formData.nombre_comercial.trim(),
          nombre_generico: formData.nombre_generico ? formData.nombre_generico.trim() : null,
          concentracion: formData.concentracion ? formData.concentracion.trim() : null,
          presentacion: formData.presentacion || 'Tableta',
          laboratorio: formData.laboratorio ? formData.laboratorio.trim() : null,
          registro_sanitario: formData.registro_sanitario ? formData.registro_sanitario.trim().toUpperCase() : null,
          tipo_controlado: formData.tipo_controlado || 'No_Controlado',
          requiere_receta: (formData.tipo_controlado && formData.tipo_controlado !== 'No_Controlado') ? true : !!formData.requiere_receta,
          fraccionable: !!formData.fraccionable,
          unidades_por_caja: parseInt(formData.unidades_por_caja) || 1,
          unidad_medida: formData.unidad_medida || 'Caja',
          unidad_fraccion: formData.unidad_fraccion || 'Tableta',
          precio_compra: parseFloat(formData.precio_compra) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          precio_fraccion: parseFloat(formData.precio_fraccion) || 0,
          stock_cajas: parseFloat(formData.stock_cajas) || 0,
          stock_fraccion: parseInt(formData.stock_fraccion) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 5,
          ubicacion: ubicacionFinal,
          id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : null,
          numero_lote_inicial: formData.numero_lote_inicial ? formData.numero_lote_inicial.trim() : null,
          fecha_vencimiento_inicial: formData.fecha_vencimiento_inicial || null
        };

        const res = await api.post('/medicamentos', payload);
        if (res.success || res.medicamento) {
          toast.success('Medicamento y lote inicial registrados exitosamente');
          setModalAbierto(false);
          resetForm();
          cargarDatos();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Error al guardar medicamento');
    } finally {
      setGuardandoMedicamento(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1700px] w-full mx-auto">
      {/* ─── PÍLDORA UNIFICADA DE BÚSQUEDA Y ACCIONES DEL CATÁLOGO ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-2.5 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Buscador Integrado en Píldora Flexible */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Nombre Comercial, Principio Activo DCI o Laboratorio..."
            className="w-full bg-[#F8FCFA] dark:bg-slate-800/80 hover:bg-white focus:bg-white dark:focus:bg-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#00B884]/20 focus:border-[#00B884] transition-all font-medium"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center bg-slate-200/60 hover:bg-slate-300"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Acciones: Importar Excel y Nuevo Medicamento */}
        {!esCajero ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setModalImportarAbierto(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] font-bold text-xs border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-sora"
              title="Importar catálogo masivo desde Excel o CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00855E] dark:text-[#5EEBB8]" />
              <span className="whitespace-nowrap">Importar Excel</span>
            </button>

            <button
              type="button"
              onClick={abrirModalNuevo}
              className="px-4 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-bold text-xs shadow-sm shadow-emerald-900/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-sora shrink-0"
              title="Registrar nuevo medicamento en el catálogo"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Nuevo Medicamento</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold shadow-2xs shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-[11px] font-sora">Modo Consulta (Solo Lectura)</span>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[28px] p-3.5 sm:p-5 soft-card-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 text-[10.5px]">
                <th className="py-3 px-3 font-extrabold uppercase min-w-[170px]">MEDICAMENTO</th>
                <th className="py-3 px-2.5 font-extrabold uppercase w-36 whitespace-nowrap">PRINCIPIO ACTIVO</th>
                <th className="py-3 px-2 font-extrabold uppercase w-28 whitespace-nowrap">LABORATORIO</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-28 whitespace-nowrap">CONDICIÓN</th>
                <th className="py-3 px-2 font-extrabold uppercase text-right w-20 whitespace-nowrap">P. CAJA</th>
                <th className="py-3 px-2 font-extrabold uppercase text-right w-22 whitespace-nowrap">P. FRACCIÓN</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-24 whitespace-nowrap">STOCK</th>
                {!esCajero && (
                  <th className="py-3 px-2.5 font-extrabold uppercase text-center w-36 whitespace-nowrap">ACCIONES</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={esCajero ? "7" : "8"} className="py-12 text-center text-slate-400 font-medium">Cargando medicamentos...</td>
                </tr>
              ) : (!medicamentos || medicamentos.length === 0) ? (
                <tr>
                  <td colSpan={esCajero ? "7" : "8"} className="py-12 text-center text-slate-400 font-medium">No se encontraron medicamentos en el catálogo.</td>
                </tr>
              ) : (
                (medicamentos || []).map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 min-w-[170px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-extrabold text-slate-800 text-xs">{med.nombre_comercial}</p>
                        {med.codigo_barras && (
                          <span className="font-mono text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-0.5 shrink-0" title={`Código de barras: ${med.codigo_barras}`}>
                            <Barcode className="w-2.5 h-2.5 text-slate-500" />
                            {med.codigo_barras}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{med.presentacion} • {med.concentracion}</p>
                    </td>
                    <td className="py-2.5 px-2.5 text-emerald-700 font-semibold max-w-[140px] truncate" title={med.nombre_generico}>
                      {med.nombre_generico || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 font-medium max-w-[110px] truncate" title={med.laboratorio || 'Genérico'}>
                      {med.laboratorio || 'Genérico'}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {med.requiere_receta ? (
                        <span className="inline-flex items-center justify-center bg-rose-50 text-rose-700 border border-rose-200/80 font-black px-2.5 py-0.5 rounded-full text-[10px] whitespace-nowrap shadow-2xs">
                          Bajo Receta
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black px-2.5 py-0.5 rounded-full text-[10px] whitespace-nowrap shadow-2xs">
                          Venta Libre
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold text-slate-900 font-sora whitespace-nowrap">
                      S/ {parseFloat(med.precio_venta).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold text-[#00855E] font-sora whitespace-nowrap">
                      {med.fraccionable && parseFloat(med.precio_fraccion) > 0 ? (
                        `S/ ${parseFloat(med.precio_fraccion).toFixed(2)}`
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className="font-extrabold text-slate-800 font-sora">
                        {med.stock_cajas} {med.unidad_medida}
                      </span>
                      {med.stock_fraccion > 0 && (
                        <span className="text-[10px] text-[#00855E] block font-semibold whitespace-nowrap font-sora">
                          +{med.stock_fraccion} {med.unidad_fraccion}s
                        </span>
                      )}
                    </td>
                    {!esCajero && (
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(med)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs group whitespace-nowrap active:scale-95"
                            title="Editar datos, precios y presentación del medicamento"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                            <span className="text-[11px] font-extrabold whitespace-nowrap">Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirModalAjuste(med)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs group whitespace-nowrap active:scale-95"
                            title="Ajuste de Stock / Registrar Merma o Vencimiento"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-600 shrink-0" />
                            <span className="text-[11px] font-extrabold whitespace-nowrap">Ajustar</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL NUEVO MEDICAMENTO (COMPLETO, MULTI-PASO Y CONFORME A DIGEMID/SUNAT) ─── */}
      {modalAbierto && typeof document !== 'undefined' && (() => {
        const precioCompraNum = parseFloat(formData.precio_compra) || 0;
        const precioVentaNum = parseFloat(formData.precio_venta) || 0;
        const gananciaCaja = precioVentaNum > 0 && precioCompraNum > 0 ? (precioVentaNum - precioCompraNum) : 0;
        const margenComercialPct = precioVentaNum > 0 && precioCompraNum > 0 ? ((gananciaCaja / precioVentaNum) * 100).toFixed(1) : null;
        const markupPct = precioCompraNum > 0 && gananciaCaja > 0 ? ((gananciaCaja / precioCompraNum) * 100).toFixed(0) : null;

        const regexRS = /^(EN|EE|EB|BE|PN|PNE|PNN|GN|GE|DM|ED|NSOC)[\s\-]?[0-9A-Z\-]+$/i;
        const tieneRS = formData.registro_sanitario && formData.registro_sanitario.trim() !== '';
        const esRSValido = !tieneRS || regexRS.test(formData.registro_sanitario.trim());

        const getSemaforoVencimiento = () => {
          if (!formData.fecha_vencimiento_inicial) return null;
          const hoy = new Date();
          const fVenc = new Date(formData.fecha_vencimiento_inicial + 'T00:00:00');
          const diffMeses = (fVenc - hoy) / (1000 * 60 * 60 * 24 * 30.4375);
          if (diffMeses <= 0) return { color: 'text-rose-700 bg-rose-50 border-rose-300', texto: '¡Lote Vencido!', estado: 'rojo' };
          if (diffMeses < 6) return { color: 'text-rose-700 bg-rose-50 border-rose-300', texto: `Crítico: Vence en ${Math.max(0, Math.round(diffMeses))} meses (< 6m)`, estado: 'rojo' };
          if (diffMeses <= 12) return { color: 'text-amber-700 bg-amber-50 border-amber-300', texto: `Alerta: Vence en ${Math.round(diffMeses)} meses (Próximo)`, estado: 'ambar' };
          return { color: 'text-emerald-700 bg-[#EBFDF6] border-[#A6F6D8]', texto: `Óptimo: Vence en ${Math.round(diffMeses)} meses (> 1 año)`, estado: 'verde' };
        };

        const semaforo = getSemaforoVencimiento();

        const categoriaSeleccionada = (categorias || []).find((c) => String(c.id) === String(formData.id_categoria));
        const categoriasFiltradas = (categorias || []).filter((c) => {
          if (!filtroCategoria.trim()) return true;
          const q = filtroCategoria.toLowerCase();
          return c.nombre.toLowerCase().includes(q) || (c.descripcion && c.descripcion.toLowerCase().includes(q));
        });

        return createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalAbierto(false);
                resetForm();
              }
            }}
            className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-150 dark:border-slate-800 my-auto animate-in zoom-in-95 duration-200 cursor-default relative h-[90vh] max-h-[760px] min-h-[580px] flex flex-col overflow-hidden"
            >
              {/* ─── Cabecera fija del modal ─── */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
                    <Pill className="w-5 h-5 text-[#00B884]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                        {medicamentoEditando ? 'Editar Medicamento & Precios' : 'Registrar Nuevo Medicamento'}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 font-sora">
                        <ShieldCheck className="w-3 h-3 text-[#00B884]" />
                        {medicamentoEditando ? `ID #${medicamentoEditando.id}` : 'BPA (DIGEMID / MINSA)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium truncate max-w-md">
                      {medicamentoEditando
                        ? `Modificando: ${medicamentoEditando.nombre_comercial} (${medicamentoEditando.laboratorio || 'Genérico'})`
                        : 'Catálogo oficial, valorización Kardex, control DIGEMID y lote inicial FEFO'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    resetForm();
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* ─── Pestañas Internas de Navegación ─── */}
              <div className="px-5 sm:px-7 pt-2.5 pb-2 bg-[#F8FCFA] dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => intentarCambiarPaso('ficha')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none font-sora ${
                      tabModal === 'ficha'
                        ? 'bg-white dark:bg-slate-900 text-[#00855E] dark:text-[#5EEBB8] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      tabModal === 'ficha' ? 'bg-[#00855E] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}>1</span>
                    <span className="truncate">Ficha Farmacológica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => intentarCambiarPaso('precios')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none font-sora ${
                      tabModal === 'precios'
                        ? 'bg-white dark:bg-slate-900 text-[#00855E] dark:text-[#5EEBB8] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      tabModal === 'precios' ? 'bg-[#00855E] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}>2</span>
                    <span className="truncate">Costos & Precios</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => intentarCambiarPaso('digemid')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none font-sora ${
                      tabModal === 'digemid'
                        ? 'bg-white dark:bg-slate-900 text-[#00855E] dark:text-[#5EEBB8] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      tabModal === 'digemid' ? 'bg-[#00855E] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}>3</span>
                    <span className="truncate">DIGEMID & Lote FEFO</span>
                  </button>
                </div>
              </div>

              {/* ─── Formulario Principal con Scroll Contenido ─── */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-modal-scroll px-5 sm:px-7 py-5 space-y-4">

                  {/* ═══════════════ PESTAÑA 1: FICHA FARMACOLÓGICA ═══════════════ */}
                  {tabModal === 'ficha' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      {/* Código de barras EAN-13 */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Código de Barras EAN-13 (Lector o Manual)</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                            Pistola de Escaneo Activa
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Apunte la pistola al código de barras o escriba..."
                            value={formData.codigo_barras}
                            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={generarCodigoInterno}
                            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200 dark:border-slate-700 hover:border-[#A6F6D8] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 font-sora shadow-2xs"
                            title="Generar código de barras interno 775..."
                          >
                            <RefreshCw className="w-3 h-3 text-[#00855E]" />
                            <span>Generar Código</span>
                          </button>
                        </div>
                      </div>

                      {/* Nombre Comercial y Principio Activo DCI */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Nombre Comercial *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Panadol Antigripal"
                            value={formData.nombre_comercial}
                            onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Principio Activo DCI (Denominación Común)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Paracetamol + Clorfenamina"
                            value={formData.nombre_generico}
                            onChange={(e) => setFormData({ ...formData, nombre_generico: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      {/* Concentración, Forma Farmacéutica y Laboratorio */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Concentración</label>
                          <input
                            type="text"
                            placeholder="Ej. 500 mg, 120mg/5ml"
                            value={formData.concentracion}
                            onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800"
                          />
                        </div>

                        {/* Selector Desplegable de Forma Farmacéutica */}
                        <div className={`relative transition-all ${dropdownFormaOpen ? 'z-50' : 'z-20'}`} ref={dropdownFormaRef}>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Forma Farmacéutica</label>
                          <button
                            type="button"
                            onClick={() => {
                              setDropdownCategoriaOpen(false);
                              setDropdownFormaOpen((prev) => !prev);
                            }}
                            className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border transition-all text-left cursor-pointer shadow-2xs ${
                              dropdownFormaOpen
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 shadow-2xs ${formaSeleccionada.iconColor}`}>
                                <FormaIcon className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {formaSeleccionada.id}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                                dropdownFormaOpen ? 'rotate-180 text-emerald-600' : ''
                              }`}
                            />
                          </button>

                          {/* Ventanita Desplegable Diseñada */}
                          {dropdownFormaOpen && (
                            <div
                              ref={dropdownFormaMenuRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-1.5 w-76 sm:w-80 max-w-[88vw] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/95 dark:border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 scroll-mb-6"
                              style={{ scrollMarginBottom: '24px' }}
                            >
                              <div className="px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                                    <Sparkles className="w-3 h-3" />
                                  </div>
                                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                                    Forma Farmacéutica
                                  </span>
                                </div>
                                <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                  DIGEMID / BPD
                                </span>
                              </div>

                              <div className="relative mb-2 px-0.5">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Buscar presentación (ej. Jarabe, Crema)..."
                                  value={filtroForma}
                                  onChange={(e) => setFiltroForma(e.target.value)}
                                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/70 dark:bg-slate-800"
                                  autoFocus
                                />
                              </div>

                              <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-0.5">
                                {formasFiltradas.length === 0 ? (
                                  <div className="py-4 px-2 text-center space-y-2">
                                    <p className="text-slate-400 text-xs">No coincide con ninguna opción estándar</p>
                                    {filtroForma.trim() && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          cambiarFormaFarmaceutica(filtroForma.trim());
                                          setDropdownFormaOpen(false);
                                          setFiltroForma('');
                                        }}
                                        className="w-full p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                      >
                                        Usar &quot;{filtroForma.trim()}&quot; como forma
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  formasFiltradas.map((opcion) => {
                                    const IconComponent = opcion.icon;
                                    const isSelected = (formData.presentacion || '').toLowerCase() === opcion.id.toLowerCase();

                                    return (
                                      <button
                                        key={opcion.id}
                                        type="button"
                                        onClick={() => {
                                          cambiarFormaFarmaceutica(opcion.id);
                                          setDropdownFormaOpen(false);
                                          setFiltroForma('');
                                        }}
                                        className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300/80 shadow-2xs'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${opcion.iconColor}`}>
                                            <IconComponent className="w-3.5 h-3.5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className={`text-xs font-black truncate ${isSelected ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {opcion.nombre}
                                              </span>
                                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 shrink-0">
                                                {opcion.tag}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                              {opcion.subtitulo}
                                            </p>
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Laboratorio</label>
                          <input
                            type="text"
                            placeholder="Ej. Bayer, Genfar, Medifarma..."
                            value={formData.laboratorio}
                            onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      {/* Categoría Terapéutica (Píldora Desplegable Estilizada Tema Botica) */}
                      <div className={`relative transition-all ${dropdownCategoriaOpen ? 'z-50' : 'z-10'}`} ref={dropdownCategoriaRef}>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Categoría / Familia Terapéutica</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Clasificación en POS y mostrador</span>
                        </label>

                        {/* Botón Principal Tipo Píldora */}
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownFormaOpen(false);
                            setDropdownCategoriaOpen((prev) => !prev);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border transition-all text-left cursor-pointer shadow-2xs font-sora ${
                            dropdownCategoriaOpen
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                              <Tag className="w-4 h-4 text-[#00B884]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                  {categoriaSeleccionada ? categoriaSeleccionada.nombre : 'General (Sin Categoría Especial)'}
                                </span>
                                {categoriaSeleccionada && (
                                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    {categoriaSeleccionada.total_medicamentos || 0} fármacos
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {categoriaSeleccionada
                                  ? 'Familia farmacológica vinculada para búsqueda rápida en caja'
                                  : 'Haga clic para clasificar en Analgésicos, Antibióticos, etc.'}
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                              dropdownCategoriaOpen ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </button>

                        {/* Ventana Desplegable Diseñada (Apertura hacia ABAJO con auto-scroll y z-index prioritario) */}
                        {dropdownCategoriaOpen && (
                          <div
                            ref={dropdownCategoriaMenuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full left-0 right-0 mt-2 origin-top bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/95 dark:border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col scroll-mb-6"
                            style={{ maxHeight: '260px', scrollMarginBottom: '24px' }}
                          >
                            {/* Cabecera compacta con buscador integrado */}
                            <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Filtrar categoría (ej. Analgésicos, Antibióticos)..."
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="w-full text-[11px] font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                                autoFocus
                              />
                              {filtroCategoria ? (
                                <button
                                  type="button"
                                  onClick={() => setFiltroCategoria('')}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer shrink-0"
                                  title="Limpiar búsqueda"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 font-sora shrink-0">
                                  DIGEMID
                                </span>
                              )}
                            </div>

                            {/* Listado de Categorías con primera opción garantizada en vista */}
                            <div className="space-y-1 overflow-y-auto custom-scrollbar pr-0.5 flex-1 min-h-0">
                              {/* Opción 1: General (Sin Categoría Específica) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, id_categoria: '' });
                                  setDropdownCategoriaOpen(false);
                                  setFiltroCategoria('');
                                }}
                                className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer font-sora ${
                                  !formData.id_categoria
                                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300/80 shadow-2xs'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-lg border border-slate-200/80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                    <Layers className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                                      General (Sin Categoría Específica)
                                    </span>
                                    <p className="text-[10px] text-slate-400">
                                      No agrupar en ninguna familia terapéutica
                                    </p>
                                  </div>
                                </div>
                                {!formData.id_categoria && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </button>

                              {/* Categorías dinámicas */}
                              {categoriasFiltradas.length === 0 && filtroCategoria.trim() ? (
                                <div className="py-3 px-2 text-center text-xs text-slate-400 font-medium">
                                  No se encontraron categorías que coincidan con &quot;{filtroCategoria}&quot;
                                </div>
                              ) : (
                                categoriasFiltradas.map((cat) => {
                                  const isSelected = String(formData.id_categoria) === String(cat.id);
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, id_categoria: cat.id });
                                        setDropdownCategoriaOpen(false);
                                        setFiltroCategoria('');
                                      }}
                                      className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer font-sora ${
                                        isSelected
                                          ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300/80 shadow-2xs'
                                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded-lg border border-[#A6F6D8] bg-[#EBFDF6] text-[#00855E] flex items-center justify-center shrink-0 shadow-2xs">
                                          <Tag className="w-3.5 h-3.5 text-[#00B884]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-black truncate ${isSelected ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                              {cat.nombre}
                                            </span>
                                            {cat.total_medicamentos !== undefined && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 shrink-0">
                                                {cat.total_medicamentos} med.
                                              </span>
                                            )}
                                          </div>
                                          {cat.descripcion && (
                                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                              {cat.descripcion}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>

                            {/* Pie con cierre */}
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 px-1 flex items-center justify-between text-[10px] text-slate-400 font-medium font-sora shrink-0">
                              <span>{(categorias || []).length} categorías registradas</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDropdownCategoriaOpen(false);
                                  setFiltroCategoria('');
                                }}
                                className="text-emerald-600 font-extrabold hover:underline cursor-pointer"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════ PESTAÑA 2: COSTOS & PRECIOS ═══════════════ */}
                  {tabModal === 'precios' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Bloque Precios y Costos de Adquisición */}
                      <div className="p-4 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/50 border border-[#D1F4E3] dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sora">
                            <DollarSign className="w-4 h-4 text-[#00855E]" />
                            <span>Precios de Compra y Venta por Caja (Moneda PEN S/)</span>
                          </p>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 font-sora">
                            Valorización Kardex SUNAT
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-bold mb-1">
                              Precio de Compra / Costo Adquisición (S/)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.precio_compra}
                              onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-black border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              placeholder="0.00"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Costo neto por caja registrado por proveedor</p>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-bold mb-1">
                              Precio de Venta Caja al Público (S/) *
                            </label>
                            <input
                              type="number"
                              step="0.10"
                              min="0"
                              required
                              value={formData.precio_venta}
                              onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-black border border-emerald-300 dark:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              placeholder="0.00"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Precio oficial de venta mostrado en POS</p>
                          </div>
                        </div>

                        {/* Tarjeta de Margen Dinámico en Vivo */}
                        {precioVentaNum > 0 && precioCompraNum > 0 && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-between flex-wrap gap-2 animate-in zoom-in-95">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-[#EBFDF6] text-[#00855E] shrink-0">
                                <TrendingUp className="w-4 h-4 text-[#00B884]" />
                              </span>
                              <div>
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 font-sora block">
                                  Ganancia Bruta: S/ {gananciaCaja.toFixed(2)} por caja
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Margen sobre Venta: <strong className="text-emerald-600">{margenComercialPct}%</strong> • Markup s/ costo: <strong className="text-emerald-600">+{markupPct}%</strong>
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Rentabilidad Positiva
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bloque Fraccionamiento y Unidades Farmacéuticas Compatibles */}
                      {(() => {
                        const reglaFarm = MATRIZ_FARMACEUTICA[formData.presentacion] || MATRIZ_FARMACEUTICA_DEFAULT;
                        const opcionesMayor = reglaFarm.unidadesMayor;
                        const opcionesMenor = reglaFarm.unidadesMenor;
                        const unidadMayorActual = opcionesMayor.some(o => o.value === formData.unidad_medida)
                          ? formData.unidad_medida
                          : reglaFarm.defaultMayor;
                        const unidadMenorActual = opcionesMenor.some(o => o.value === formData.unidad_fraccion)
                          ? formData.unidad_fraccion
                          : reglaFarm.defaultMenor;

                        return (
                          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="chkFracc"
                                  checked={formData.fraccionable}
                                  onChange={(e) => {
                                    const activo = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      fraccionable: activo,
                                      unidades_por_caja: activo ? (parseInt(prev.unidades_por_caja) > 1 ? prev.unidades_por_caja : reglaFarm.defaultUnidadesCaja) : '1',
                                      unidad_medida: unidadMayorActual,
                                      unidad_fraccion: unidadMenorActual
                                    }));
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300 cursor-pointer"
                                />
                                <label htmlFor="chkFracc" className="text-xs font-black text-slate-800 dark:text-slate-100 cursor-pointer select-none font-sora">
                                  Permitir Dispensación Fraccionada (por unidad menor)
                                </label>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Forma: <strong className="text-slate-700 dark:text-slate-200">{formData.presentacion}</strong> • DIGEMID BPD
                              </span>
                            </div>

                            {/* Detalle cuando NO es fraccionable (Producto cerrado, ej. Jarabes, Cremas individuales) */}
                            {!formData.fraccionable ? (
                              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 animate-in fade-in">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] shrink-0 border border-emerald-200/60">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sora">
                                      Venta como Unidad Comercial Entera ({formData.unidad_medida || reglaFarm.defaultMayor})
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {reglaFarm.descripcion} Se dispensa por producto cerrado sin división en mostrador.
                                    </p>
                                  </div>
                                  <div className="w-full sm:w-64">
                                    <DropdownPill
                                      label="Empaque Comercial"
                                      value={unidadMayorActual}
                                      onChange={(val) => setFormData(prev => ({ ...prev, unidad_medida: val }))}
                                      icon={Package}
                                      options={opcionesMayor}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Detalle cuando SÍ es fraccionable (Blísters, ampollas, pastillas compatibles) */
                              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                                      Unidades ({unidadMenorActual}) por {unidadMayorActual} *
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={formData.unidades_por_caja}
                                      onChange={(e) => setFormData({ ...formData, unidades_por_caja: e.target.value })}
                                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                      placeholder="100"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">Conversión Kardex</p>
                                  </div>

                                  <DropdownPill
                                    label="Unidad Mayor (Empaque)"
                                    value={unidadMayorActual}
                                    onChange={(val) => setFormData({ ...formData, unidad_medida: val })}
                                    icon={Package}
                                    options={opcionesMayor}
                                  />

                                  <DropdownPill
                                    label="Unidad Menor (Fracción)"
                                    value={unidadMenorActual}
                                    onChange={(val) => setFormData({ ...formData, unidad_fraccion: val })}
                                    icon={Pill}
                                    options={opcionesMenor}
                                  />
                                </div>

                                {/* Precio por Fracción y Botón de Cálculo Inteligente */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                                      Precio de Venta por {unidadMenorActual || 'Unidad'} (S/)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={sugerirPrecioFraccion}
                                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 font-sora"
                                      title="Calcular precio fraccional con +15% de margen sugerido"
                                    >
                                      <Calculator className="w-3 h-3" />
                                      <span>Sugerir Fracción (+15%)</span>
                                    </button>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    value={formData.precio_fraccion}
                                    onChange={(e) => setFormData({ ...formData, precio_fraccion: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono font-black border border-emerald-200/80 dark:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* ═══════════════ PESTAÑA 3: DIGEMID & LOTE FEFO ═══════════════ */}
                  {tabModal === 'digemid' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Registro Sanitario DIGEMID */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Registro Sanitario Oficial DIGEMID (D.S. 016-2011-SA)</span>
                          </label>
                          {tieneRS && (
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border font-sora ${
                              esRSValido
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {esRSValido ? '✓ Formato Válido' : '⚠ Formato no estándar'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Ej. EN-04589, EE-12940, NSOC14589-22PE, PN-0123"
                          value={formData.registro_sanitario}
                          onChange={(e) => setFormData({ ...formData, registro_sanitario: e.target.value.toUpperCase() })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800 ${
                            !esRSValido && tieneRS
                              ? 'border-amber-400 focus:ring-amber-500/20 text-amber-900'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100'
                          }`}
                        />
                        <p className="text-[10px] text-slate-400">
                          Prefijos oficiales: EN (Nacional), EE (Extranjero), NSOC (Cosméticos/Higiene), PN, GN, DM.
                        </p>
                      </div>

                      {/* Fiscalización y Condición de Venta DIGEMID */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>Condición de Venta & Fiscalización DIGEMID</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_controlado: 'No_Controlado', requiere_receta: false })}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer select-none font-sora ${
                              formData.tipo_controlado === 'No_Controlado' && !formData.requiere_receta
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-black block">Venta Libre (OTC)</span>
                            <span className="text-[10px] text-slate-500 block">Sin receta médica obligatoria</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_controlado: 'No_Controlado', requiere_receta: true })}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer select-none font-sora ${
                              formData.tipo_controlado === 'No_Controlado' && formData.requiere_receta
                                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-black block">Con Receta Médica</span>
                            <span className="text-[10px] text-slate-500 block">Exige prescripción médica facultativa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_controlado: 'Psicotropico_Lista_IV', requiere_receta: true })}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer select-none font-sora ${
                              formData.tipo_controlado === 'Psicotropico_Lista_IV'
                                ? 'bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-black block">Psicotrópico (Lista IV)</span>
                            <span className="text-[10px] text-slate-500 block">Libro oficial DIGEMID (Diazepam, etc.)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_controlado: 'Estupefaciente_Lista_II', requiere_receta: true })}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer select-none font-sora ${
                              formData.tipo_controlado === 'Estupefaciente_Lista_II'
                                ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-black block">Estupefaciente (Lista II)</span>
                            <span className="text-[10px] text-slate-500 block">Receta especial retenida (Codeína, etc.)</span>
                          </button>
                        </div>
                      </div>

                      {/* Buenas Prácticas de Almacenamiento (BPA) y Ubicación */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sora">
                          <MapPin className="w-3.5 h-3.5 text-[#00855E]" />
                          <span>Almacenamiento (BPA) & Ubicación en Botica</span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Selector Temperatura */}
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                              Rango de Temperatura
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, temperatura_almacen: 'Ambiente' })}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer font-sora ${
                                  formData.temperatura_almacen === 'Ambiente'
                                    ? 'bg-[#EBFDF6] text-[#00855E] border-[#A6F6D8] font-black'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Sun className="w-3 h-3 text-amber-500" />
                                <span>Ambiente</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, temperatura_almacen: 'Refrigerado' })}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer font-sora ${
                                  formData.temperatura_almacen === 'Refrigerado'
                                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-black'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Snowflake className="w-3 h-3 text-cyan-600" />
                                <span>2°C - 8°C</span>
                              </button>
                            </div>
                          </div>

                          {/* Ubicación Física */}
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                              Ubicación Física (Anaquel/Vitrina)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Anaquel B-2, Vitrina 1"
                              value={formData.ubicacion}
                              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>

                          {/* Stock Mínimo */}
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                              Stock Mínimo (Alerta de Reposición)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.stock_minimo}
                              onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              placeholder="5"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stock Inicial y Lote FEFO */}
                      {!medicamentoEditando ? (
                        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-sora">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>Stock y Lote Inicial (Trazabilidad FEFO DIGEMID)</span>
                            </p>
                            {semaforo && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border font-sora ${semaforo.color}`}>
                                {semaforo.texto}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                            <div>
                              <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                                Stock Inicial Cajas *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={formData.stock_cajas}
                                onChange={(e) => setFormData({ ...formData, stock_cajas: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-black border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                                N° de Lote de Fabricante
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. LOT-2026A"
                                value={formData.numero_lote_inicial}
                                onChange={(e) => setFormData({ ...formData, numero_lote_inicial: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                              />
                            </div>

                            <div>
                              <DatePickerPill
                                label="Fecha Vencimiento FEFO"
                                value={formData.fecha_vencimiento_inicial}
                                onChange={(val) => setFormData({ ...formData, fecha_vencimiento_inicial: val })}
                                direction="up"
                                align="right"
                                placeholder="Seleccionar fecha FEFO..."
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00855E] dark:text-[#5EEBB8] border border-emerald-200/70 dark:border-emerald-800/50">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sora">
                                Lotes Existentes & Auditoría de Stock
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Los lotes vigentes de este medicamento se administran desde el módulo de <b>Lotes</b> y los ajustes de mermas desde <b>Ajustar</b> en la tabla.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 block">
                              Stock Actual: {medicamentoEditando.stock_cajas || 0} {medicamentoEditando.unidad_medida || 'Caja'}s
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* ─── Botones de Acción (Fijos al pie de la tarjeta con wizard secuencial) ─── */}
                <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 rounded-b-3xl">
                  {/* Botón Volver / Paso Anterior */}
                  <div>
                    {tabModal === 'ficha' && (
                      <span className="text-[11px] text-slate-400 font-medium font-sora">
                        Paso 1 de 3: Identificación & Presentación
                      </span>
                    )}
                    {tabModal === 'precios' && (
                      <button
                        type="button"
                        onClick={() => setTabModal('ficha')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 font-sora"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Paso 1: Ficha</span>
                      </button>
                    )}
                    {tabModal === 'digemid' && (
                      <button
                        type="button"
                        onClick={() => setTabModal('precios')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 font-sora"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Paso 2: Precios</span>
                      </button>
                    )}
                  </div>

                  {/* Acciones Derecha (Cancelar y Siguiente / Guardar según el paso) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalAbierto(false);
                        resetForm();
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sora"
                    >
                      Cancelar
                    </button>

                    {/* Botón rápido Guardar Cambios en modo edición si está en paso 1 o 2 */}
                    {medicamentoEditando && (tabModal === 'ficha' || tabModal === 'precios') && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={guardandoMedicamento}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-sora disabled:opacity-50"
                        title="Guardar cambios de precio y datos inmediatamente"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Guardar Cambios</span>
                      </button>
                    )}

                    {/* Paso 1: Botón para avanzar a Costos & Precios */}
                    {tabModal === 'ficha' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (validarPaso1()) setTabModal('precios');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-sora"
                      >
                        <span>Siguiente: Costos & Precios</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Paso 2: Botón para avanzar a DIGEMID & Lote */}
                    {tabModal === 'precios' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (validarPaso2()) setTabModal('digemid');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-sora"
                      >
                        <span>Siguiente: DIGEMID & Lote</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Paso 3: Botón FINAL Guardar Medicamento (Solo accesible en Paso 3) */}
                    {tabModal === 'digemid' && (
                      <button
                        type="submit"
                        disabled={guardandoMedicamento}
                        className="px-6 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-sora disabled:opacity-50"
                      >
                        {guardandoMedicamento ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>{medicamentoEditando ? 'Actualizando Medicamento...' : 'Guardando en Catálogo...'}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>{medicamentoEditando ? 'Actualizar Medicamento' : 'Guardar Medicamento'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Modal Ajuste de Stock / Registro de Merma y Vencimiento */}
      {/* Modal Ajuste de Stock / Registro de Merma, Sobrante y Bajas DIGEMID */}
      {modalAjusteAbierto && medSeleccionado && typeof document !== 'undefined' && createPortal(
        (() => {
          const costoCaja = parseFloat(medSeleccionado.precio_compra) || 0;
          const uxc = Math.max(1, parseInt(medSeleccionado.unidades_por_caja) || 1);
          const costoFraccion = costoCaja / uxc;
          const costoUnitario = ajusteData.formato === 'Caja' ? costoCaja : costoFraccion;
          const cantNum = parseFloat(ajusteData.cantidad) || 0;
          const costoTotalImpacto = cantNum * costoUnitario;

          // Lote seleccionado y stock disponible
          const loteActual = medSeleccionado.lotes?.find(l => String(l.id) === String(ajusteData.id_lote));
          const stockDispLote = loteActual
            ? (ajusteData.formato === 'Caja' ? (parseFloat(loteActual.stock_cajas) || 0) : (parseInt(loteActual.stock_fraccion) || 0))
            : null;
          const stockDispGlobal = ajusteData.formato === 'Caja'
            ? (parseFloat(medSeleccionado.stock_cajas) || 0)
            : (parseInt(medSeleccionado.stock_fraccion) || 0);

          const stockAComparar = stockDispLote !== null ? stockDispLote : stockDispGlobal;
          const hayExcesoStock = (ajusteData.sentido === 'Salida' || ajusteData.sentido === 'Desblistado') && (
            ajusteData.sentido === 'Desblistado'
              ? cantNum > (parseFloat(medSeleccionado.stock_cajas) || 0)
              : cantNum > stockAComparar
          );

          // Opciones dinámicas de tipo según el sentido
          const opcionesTipo = ajusteData.sentido === 'Salida' ? [
            { value: 'Merma_Rotura', label: 'Merma por Rotura o Deterioro Físico', subtitle: 'Frasco quebrado, ampolla rota o daño en vitrina (Kardex Op. 13)' },
            { value: 'Vencimiento', label: 'Baja por Vencimiento / Caducidad (DIGEMID)', subtitle: 'Protocolo sanitario de desmedro y retiro de anaquel (Kardex Op. 13)' },
            { value: 'Faltante_Inventario', label: 'Faltante en Conteo Físico / Pérdida', subtitle: 'Diferencia negativa en arqueo de inventario (Kardex Op. 99)' },
            { value: 'Desmedro_Deterioro', label: 'Desmedro Sanitario / Envase Dañado', subtitle: 'Pérdida organoléptica o sello de seguridad roto (Kardex Op. 14)' }
          ] : ajusteData.sentido === 'Entrada' ? [
            { value: 'Sobrante_Inventario', label: 'Sobrante en Conteo Físico / Regularización', subtitle: 'Diferencia positiva detectada en inventario (Kardex Op. 99)' },
            { value: 'Ajuste_Ingreso', label: 'Ingreso Extraordinario / Recuperación', subtitle: 'Reincorporación formal por auditoría física (Kardex Op. 99)' }
          ] : [
            { value: 'Desblistado_Fraccionamiento', label: 'Apertura de Caja para Fraccionamiento en Mostrador', subtitle: 'Convierte cajas completas en unidades/pastillas sueltas' }
          ];

          return (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setModalAjusteAbierto(false);
              }}
              className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden"
              >
                {/* Cabecera del modal (Fija) */}
                <div className="flex items-center justify-between px-6 sm:px-7 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 shadow-2xs shrink-0">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-nowrap">
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora whitespace-nowrap">
                          Ajuste de Stock, Mermas & Cuarentena
                        </h3>
                        <span className="inline-flex items-center whitespace-nowrap shrink-0 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-sora tracking-wide">
                          Kardex SUNAT 13.1
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold truncate max-w-lg">
                        Auditoría física, mermas por rotura, bajas DIGEMID y regularización
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAjusteAbierto(false)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                    title="Cerrar ventana (Esc)"
                  >
                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>

                <form onSubmit={handleAjusteSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Cuerpo del modal con scroll acotado */}
                  <div className="flex-1 overflow-y-auto custom-modal-scroll px-6 sm:px-7 py-4 space-y-3.5">
                    {/* Ficha Resumen del Medicamento */}
                    <div className="p-3.5 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/50 border border-[#D1F4E3] dark:border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 text-xs font-sora">{medSeleccionado.nombre_comercial}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {medSeleccionado.nombre_generico ? `${medSeleccionado.nombre_generico} • ` : ''}
                            {medSeleccionado.presentacion} {medSeleccionado.concentracion}
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-sora">
                          {medSeleccionado.laboratorio || 'Genérico'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 dark:border-slate-800 text-xs font-sora">
                        <div>
                          <span className="text-slate-400 text-[10.5px] block font-medium">Stock en Sistema:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
                            {medSeleccionado.stock_cajas} {medSeleccionado.unidad_medida || 'Cajas'}
                            {medSeleccionado.stock_fraccion > 0 && ` + ${medSeleccionado.stock_fraccion} ${medSeleccionado.unidad_fraccion || 'unid'}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10.5px] block font-medium">Costo Compra Neto:</span>
                          <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                            S/ {costoCaja.toFixed(2)} por caja ({uxc > 1 ? `S/ ${costoFraccion.toFixed(2)} c/u` : 'No fracc.'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selector de Sentido de la Operación */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-sora">
                        Dirección del Movimiento Kardex *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setAjusteData(prev => ({
                            ...prev,
                            sentido: 'Salida',
                            tipo: 'Merma_Rotura'
                          }))}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-sora flex items-center gap-2 ${
                            ajusteData.sentido === 'Salida'
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-xs ring-1 ring-rose-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            ajusteData.sentido === 'Salida' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <ArrowDown className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate">Salida (-)</span>
                            <span className="text-[9.5px] text-slate-400 block truncate">Merma / Baja</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAjusteData(prev => ({
                            ...prev,
                            sentido: 'Entrada',
                            tipo: 'Sobrante_Inventario'
                          }))}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-sora flex items-center gap-2 ${
                            ajusteData.sentido === 'Entrada'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            ajusteData.sentido === 'Entrada' ? 'bg-[#00855E] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <ArrowUp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate">Entrada (+)</span>
                            <span className="text-[9.5px] text-slate-400 block truncate">Sobrante físico</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAjusteData(prev => ({
                            ...prev,
                            sentido: 'Desblistado',
                            tipo: 'Desblistado_Fraccionamiento',
                            formato: 'Caja'
                          }))}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-sora flex items-center gap-2 ${
                            ajusteData.sentido === 'Desblistado'
                              ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 shadow-xs ring-1 ring-cyan-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            ajusteData.sentido === 'Desblistado' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate">Desblistar</span>
                            <span className="text-[9.5px] text-slate-400 block truncate">Caja a fracciones</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Tipo de Operación Detallado */}
                    <DropdownPill
                      label="Motivo Farmacéutico / Operación SUNAT"
                      required
                      value={ajusteData.tipo}
                      onChange={(val) => setAjusteData({ ...ajusteData, tipo: val })}
                      options={opcionesTipo}
                    />

                    {/* Lote Afectado (FEFO) */}
                    <DropdownPill
                      label="Lote Afectado (FEFO)"
                      value={ajusteData.id_lote}
                      onChange={(val) => setAjusteData({ ...ajusteData, id_lote: val })}
                      placeholder="— Ninguno / Afectar sólo Stock Global —"
                      options={[
                        { value: '', label: '— Ninguno / Afectar sólo Stock Global —' },
                        ...(medSeleccionado.lotes && medSeleccionado.lotes.map((lote) => ({
                          value: lote.id,
                          label: `Lote: ${lote.numero_lote}`,
                          subtitle: `Vence: ${lote.fecha_vencimiento} • Stock: ${lote.stock_cajas} cajas${lote.stock_fraccion > 0 ? ` + ${lote.stock_fraccion} fracc.` : ''}`,
                          badge: `${lote.stock_cajas} cajas`
                        })) || [])
                      ]}
                    />

                    {/* Formato y Cantidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DropdownPill
                        label="Unidad de Medida"
                        required
                        disabled={ajusteData.sentido === 'Desblistado'}
                        value={ajusteData.formato}
                        onChange={(val) => setAjusteData({ ...ajusteData, formato: val })}
                        options={[
                          { value: 'Caja', label: `Caja Completa (${medSeleccionado.unidad_medida || 'Caja'})` },
                          ...(medSeleccionado.fraccionable && ajusteData.sentido !== 'Desblistado' ? [{ value: 'Fraccion', label: `Fracción (${medSeleccionado.unidad_fraccion || 'Unidad'})` }] : [])
                        ]}
                      />

                      <div>
                        <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-sora">
                          {ajusteData.sentido === 'Salida'
                            ? 'Cantidad a Descontar *'
                            : ajusteData.sentido === 'Entrada'
                            ? 'Cantidad a Incrementar *'
                            : 'Cajas a Desblistar (Abrir) *'}
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={ajusteData.cantidad}
                          onChange={(e) => setAjusteData({ ...ajusteData, cantidad: e.target.value })}
                          className={`w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 border outline-none font-black font-mono transition-all ${
                            hayExcesoStock
                              ? 'border-rose-400 ring-2 ring-rose-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                          }`}
                          placeholder="1"
                        />
                        {hayExcesoStock && (
                          <p className="text-[10px] text-rose-600 font-bold mt-1 font-sora flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>La cantidad supera el stock disponible ({stockAComparar} {ajusteData.formato})</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tarjeta de Impacto Económico / Valorización en Tiempo Real */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 animate-in zoom-in-95 font-sora ${
                      ajusteData.sentido === 'Salida'
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60'
                        : ajusteData.sentido === 'Entrada'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60'
                        : 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-800/60'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg shrink-0 ${
                          ajusteData.sentido === 'Salida'
                            ? 'bg-rose-100 text-rose-700'
                            : ajusteData.sentido === 'Entrada'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                            {ajusteData.sentido === 'Salida'
                              ? `Pérdida Valorizada: -S/ ${costoTotalImpacto.toFixed(2)}`
                              : ajusteData.sentido === 'Entrada'
                              ? `Incremento Activo: +S/ ${costoTotalImpacto.toFixed(2)}`
                              : `Conversión: ${cantNum} caja(s) = ${cantNum * uxc} ${medSeleccionado.unidad_fraccion || 'unidades'}`}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {ajusteData.sentido === 'Desblistado'
                              ? 'Operación interna sin pérdida financiera (Kardex Neutro)'
                              : `Calculado a costo unitario de compra: S/ ${costoUnitario.toFixed(2)} por ${ajusteData.formato}`}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        ajusteData.sentido === 'Salida'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : ajusteData.sentido === 'Entrada'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                      }`}>
                        {ajusteData.sentido === 'Salida' ? 'Egreso Kardex' : ajusteData.sentido === 'Entrada' ? 'Ingreso Kardex' : 'Reempaque'}
                      </span>
                    </div>

                    {/* Documento de Referencia / Acta */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-sora">
                        N° de Acta Interna / Referencia (Opcional)
                      </label>
                      <input
                        type="text"
                        value={ajusteData.documento_referencia}
                        onChange={(e) => setAjusteData({ ...ajusteData, documento_referencia: e.target.value })}
                        placeholder="Ej. ACTA-2026-004, INFORME-MERMA-01 o INV-02"
                        className="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      />
                    </div>

                    {/* Justificación Técnica Detallada */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-sora">
                        Justificación Técnica / Observación de Kardex *
                      </label>
                      <textarea
                        rows="2"
                        required
                        value={ajusteData.motivo}
                        onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                        placeholder={
                          ajusteData.sentido === 'Salida'
                            ? "Ej. Frasco quebrado al reponer en vitrina principal, o vencimiento cumplido según protocolo..."
                            : ajusteData.sentido === 'Entrada'
                            ? "Ej. Sobrante verificado en conteo físico de inventario de cierre de mes..."
                            : "Ej. Apertura de caja para surtir dispensación en mostrador de turno noche..."
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      ></textarea>
                    </div>

                    {/* Casilla BPA DIGEMID para Área de Bajas / Cuarentena */}
                    {ajusteData.sentido === 'Salida' && (ajusteData.tipo === 'Vencimiento' || ajusteData.tipo === 'Desmedro_Deterioro' || ajusteData.tipo === 'Merma_Rotura') && (
                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 cursor-pointer animate-in fade-in">
                        <input
                          type="checkbox"
                          checked={ajusteData.enviar_cuarentena}
                          onChange={(e) => setAjusteData({ ...ajusteData, enviar_cuarentena: e.target.checked })}
                          className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500/20 border-slate-300 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-amber-950 dark:text-amber-200 block font-sora">
                            Inmovilizar y Enviar al Área de Bajas / Cuarentena (BPA DIGEMID)
                          </span>
                          <span className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80 font-medium leading-tight block mt-0.5">
                            Genera automáticamente el registro oficial en el módulo de Bajas y Cuarentena para acta de destrucción o devolución según D.S. 014-2011-SA.
                          </span>
                        </div>
                      </label>
                    )}

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-relaxed">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Esta operación generará un movimiento con trazabilidad inmutable en el <b>Libro Oficial de Kardex Valorizado</b> y recalculará los saldos de la botica.
                      </span>
                    </div>

                  </div>

                  {/* Botones de Acción (Fijos abajo) */}
                  <div className="flex items-center justify-between gap-2.5 px-6 sm:px-7 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 rounded-b-3xl">
                    <button
                      type="button"
                      onClick={() => setModalAjusteAbierto(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sora"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoAjuste}
                      className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sora ${
                        ajusteData.sentido === 'Salida'
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                          : ajusteData.sentido === 'Entrada'
                          ? 'bg-[#00855E] hover:bg-[#00704F] shadow-emerald-900/20'
                          : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-900/20'
                      }`}
                    >
                      {guardandoAjuste ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Procesando Kardex...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>
                            {ajusteData.sentido === 'Salida'
                              ? 'Confirmar Salida en Kardex'
                              : ajusteData.sentido === 'Entrada'
                              ? 'Registrar Sobrante en Kardex'
                              : 'Confirmar Desblistado'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Modal de Importación Masiva Excel */}
      <ModalImportarMedicamentos
        abierto={modalImportarAbierto}
        alCerrar={() => setModalImportarAbierto(false)}
        alCompletar={() => cargarDatos()}
      />
    </div>
  );
}
