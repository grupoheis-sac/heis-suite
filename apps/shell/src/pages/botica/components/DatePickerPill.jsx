import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable: "15 Nov 2027"
 */
function formatearFechaLegible(fechaStr) {
  if (!fechaStr) return '';
  try {
    const [y, m, d] = fechaStr.split('-').map(Number);
    if (!y || !m || !d) return fechaStr;
    const mesCorto = MESES[m - 1]?.slice(0, 3) || '';
    return `${d} ${mesCorto} ${y}`;
  } catch {
    return fechaStr;
  }
}

/**
 * Calcula el diagnóstico de vencimiento FEFO para una fecha YYYY-MM-DD
 */
function calcularDiagnosticoFEFO(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fVenc = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fVenc.getTime())) return null;

  const diffMs = fVenc - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = diffDias / 30.4375;

  if (diffDias < 0) {
    return {
      estado: 'vencido',
      texto: '¡Lote Vencido!',
      detalle: `Caducó hace ${Math.abs(diffDias)} días`,
      color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      badgeColor: 'bg-rose-600 text-white',
      dotColor: 'bg-rose-500 ring-2 ring-rose-200'
    };
  }
  if (diffMeses < 6) {
    return {
      estado: 'critico',
      texto: `Crítico: < 6 meses (${Math.max(1, Math.round(diffMeses))}m)`,
      detalle: `Vence en ${diffDias} días (Inmovilización preventiva recomendada)`,
      color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      badgeColor: 'bg-rose-500 text-white',
      dotColor: 'bg-rose-500 ring-2 ring-rose-200'
    };
  }
  if (diffMeses <= 12) {
    return {
      estado: 'alerta',
      texto: `Alerta FEFO: ~${Math.round(diffMeses)} meses`,
      detalle: `Vence en ${diffDias} días (Priorizar salida en ventas)`,
      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
      badgeColor: 'bg-amber-500 text-white',
      dotColor: 'bg-amber-500 ring-2 ring-amber-200'
    };
  }
  return {
    estado: 'optimo',
    texto: `Óptimo DIGEMID: ~${Math.round(diffMeses)} meses`,
    detalle: `Vigencia adecuada (> 1 año)`,
    color: 'text-emerald-700 bg-[#EBFDF6] border-[#A6F6D8] dark:bg-emerald-950/60 dark:text-emerald-300',
    badgeColor: 'bg-emerald-600 text-white',
    dotColor: 'bg-emerald-500 ring-2 ring-emerald-200'
  };
}

/**
 * Calcula el diagnóstico fiscal SUNAT para una fecha de emisión YYYY-MM-DD
 */
function calcularDiagnosticoSUNAT(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fEmis = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fEmis.getTime())) return null;

  const diffMs = fEmis - hoy;
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias > 0) {
    return {
      estado: 'futuro',
      texto: 'Fecha Futura',
      detalle: 'SUNAT no admite comprobantes con fecha posterior a hoy',
      color: 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
      badgeColor: 'bg-amber-500 text-white',
      dotColor: 'bg-amber-500 ring-2 ring-amber-200'
    };
  }
  if (diffDias === 0) {
    return {
      estado: 'hoy',
      texto: 'Emisión de Hoy (SUNAT)',
      detalle: 'Comprobante emitido en la fecha actual',
      color: 'text-emerald-800 bg-[#EBFDF6] border-[#A6F6D8] dark:bg-emerald-950/60 dark:text-emerald-300',
      badgeColor: 'bg-[#00855E] text-white',
      dotColor: 'bg-emerald-500 ring-2 ring-emerald-200'
    };
  }
  if (diffDias >= -3) {
    return {
      estado: 'reciente',
      texto: `Plazo Ordinario SUNAT (${Math.abs(diffDias)} ${Math.abs(diffDias) === 1 ? 'día' : 'días'})`,
      detalle: 'Dentro del plazo regular de emisión electrónica',
      color: 'text-teal-800 bg-teal-50 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300',
      badgeColor: 'bg-teal-600 text-white',
      dotColor: 'bg-teal-500 ring-2 ring-teal-200'
    };
  }
  if (diffDias >= -7) {
    return {
      estado: 'habil',
      texto: `Rango Hábil SUNAT (${Math.abs(diffDias)} días)`,
      detalle: 'Dentro del plazo de envío y declaración OSE/SUNAT',
      color: 'text-cyan-800 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300',
      badgeColor: 'bg-cyan-600 text-white',
      dotColor: 'bg-cyan-500 ring-2 ring-cyan-200'
    };
  }
  return {
    estado: 'anterior',
    texto: `Emisión Anterior (${Math.abs(diffDias)} días atrás)`,
    detalle: 'Comprobante de periodo anterior. Verifique registro de compras',
    color: 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    badgeColor: 'bg-slate-600 text-white',
    dotColor: 'bg-slate-400 ring-2 ring-slate-200'
  };
}

/**
 * Calcula el diagnóstico para una fecha estimada de entrega
 */
function calcularDiagnosticoEntrega(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fEnt = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fEnt.getTime())) return null;

  const diffMs = fEnt - hoy;
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return {
      estado: 'vencida',
      texto: `Fecha Pasada (${Math.abs(diffDias)} ${Math.abs(diffDias) === 1 ? 'día' : 'días'})`,
      detalle: 'La fecha prevista de recepción ya transcurrió',
      color: 'text-rose-800 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      badgeColor: 'bg-rose-600 text-white',
      dotColor: 'bg-rose-500 ring-2 ring-rose-200'
    };
  }
  if (diffDias === 0) {
    return {
      estado: 'hoy',
      texto: 'Llegada Programada Hoy',
      detalle: 'Se espera la recepción del pedido durante el día',
      color: 'text-emerald-800 bg-[#EBFDF6] border-[#A6F6D8] dark:bg-emerald-950/60 dark:text-emerald-300',
      badgeColor: 'bg-[#00855E] text-white',
      dotColor: 'bg-emerald-500 ring-2 ring-emerald-200'
    };
  }
  if (diffDias === 1) {
    return {
      estado: 'manana',
      texto: 'Entrega Mañana (24h)',
      detalle: 'Recepción estimada para el día de mañana',
      color: 'text-teal-800 bg-teal-50 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300',
      badgeColor: 'bg-teal-600 text-white',
      dotColor: 'bg-teal-500 ring-2 ring-teal-200'
    };
  }
  if (diffDias <= 7) {
    return {
      estado: 'semana',
      texto: `En ${diffDias} días (Esta semana)`,
      detalle: 'Dentro del plazo regular de despacho de droguería',
      color: 'text-cyan-800 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300',
      badgeColor: 'bg-cyan-600 text-white',
      dotColor: 'bg-cyan-500 ring-2 ring-cyan-200'
    };
  }
  return {
    estado: 'programada',
    texto: `Programada en ${diffDias} días`,
    detalle: 'Entrega pactada a mediano plazo',
    color: 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    badgeColor: 'bg-slate-600 text-white',
    dotColor: 'bg-slate-400 ring-2 ring-slate-200'
  };
}

/**
 * Calcula el diagnóstico clínico para fecha de nacimiento de paciente / cliente
 */
function calcularDiagnosticoNacimiento(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fNac = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fNac.getTime())) return null;

  const diffMs = hoy - fNac;
  if (diffMs < 0) {
    return {
      estado: 'futuro',
      texto: 'Fecha Futura Inválida',
      detalle: 'La fecha de nacimiento no puede ser posterior a hoy',
      color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      badgeColor: 'bg-rose-600 text-white',
      dotColor: 'bg-rose-500 ring-2 ring-rose-200'
    };
  }

  let edad = hoy.getFullYear() - fNac.getFullYear();
  const m = hoy.getMonth() - fNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fNac.getDate())) {
    edad--;
  }

  if (edad === 0) {
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const meses = Math.floor(diffDias / 30.4375);
    const textoEdad = meses > 0 ? `${meses} meses` : `${diffDias} días`;
    return {
      estado: 'lactante',
      texto: `${textoEdad} • Lactante`,
      detalle: 'Paciente menor de 1 año (Dosificación pediátrica en gotas/suspensión)',
      color: 'text-sky-800 bg-sky-50 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
      badgeColor: 'bg-sky-600 text-white',
      dotColor: 'bg-sky-500 ring-2 ring-sky-200'
    };
  }

  if (edad < 12) {
    return {
      estado: 'pediatrico',
      texto: `${edad} años • Pediátrico`,
      detalle: 'Paciente pediátrico (Ajuste de dosis por peso/superficie)',
      color: 'text-cyan-800 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300',
      badgeColor: 'bg-cyan-600 text-white',
      dotColor: 'bg-cyan-500 ring-2 ring-cyan-200'
    };
  }

  if (edad < 18) {
    return {
      estado: 'adolescente',
      texto: `${edad} años • Adolescente`,
      detalle: 'Paciente adolescente (12 a 17 años)',
      color: 'text-indigo-800 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
      badgeColor: 'bg-indigo-600 text-white',
      dotColor: 'bg-indigo-500 ring-2 ring-indigo-200'
    };
  }

  if (edad >= 60) {
    return {
      estado: 'geriatrico',
      texto: `${edad} años • Adulto Mayor (60+)`,
      detalle: 'Paciente de la tercera edad (Atención a polifarmacia y función renal)',
      color: 'text-purple-800 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
      badgeColor: 'bg-purple-600 text-white',
      dotColor: 'bg-purple-500 ring-2 ring-purple-200'
    };
  }

  return {
    estado: 'adulto',
    texto: `${edad} años • Adulto`,
    detalle: 'Paciente adulto (18 a 59 años)',
    color: 'text-emerald-800 bg-[#EBFDF6] border-[#A6F6D8] dark:bg-emerald-950/60 dark:text-emerald-300',
    badgeColor: 'bg-[#00855E] text-white',
    dotColor: 'bg-emerald-500 ring-2 ring-emerald-200'
  };
}

/**
 * DatePickerPill - Calendario selector tipo píldora farmacéutica con diseño Tema Botica,
 * navegación ágil de año/mes, auto-alineación que evita desbordes y validación contextual.
 *
 * @param {string} value - Fecha en formato 'YYYY-MM-DD'
 * @param {function} onChange - Callback (fechaStr: 'YYYY-MM-DD') => void
 * @param {string} [label] - Etiqueta superior
 * @param {string} [placeholder]
 * @param {string} [direction='up'] - 'up' o 'down'
 * @param {string} [align='right'] - 'right' o 'left'
 * @param {boolean} [required=false]
 * @param {boolean} [disabled=false]
 * @param {string} [className='']
 * @param {string} [mode='fefo'] - 'fefo' (lotes y vencimientos) | 'emision' (comprobantes SUNAT) | 'entrega' (pedidos y órdenes) | 'nacimiento' (pacientes y clientes)
 */
export default function DatePickerPill({
  value = '',
  onChange,
  label,
  placeholder,
  direction = 'up',
  align = 'right',
  required = false,
  disabled = false,
  className = '',
  mode = 'fefo'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Inicializar vista de mes y año según valor o fecha actual
  const fechaInicial = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [vistaMes, setVistaMes] = useState(fechaInicial.getMonth());
  const [vistaAnio, setVistaAnio] = useState(fechaInicial.getFullYear());

  // Sincronizar vista cuando cambia el valor externamente
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        setVistaAnio(y);
        setVistaMes(m - 1);
      }
    }
  }, [value]);

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll vertical suave que enfoca y revela el calendario dentro del modal SIN provocar desplazamiento horizontal
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (menuRef.current) {
          const scrollParent = menuRef.current.closest('.overflow-y-auto, [class*="overflow-y"]');
          if (scrollParent) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            if (menuRect.top < parentRect.top) {
              scrollParent.scrollBy({ top: menuRect.top - parentRect.top - 16, behavior: 'smooth' });
            } else if (menuRect.bottom > parentRect.bottom) {
              scrollParent.scrollBy({ top: menuRect.bottom - parentRect.bottom + 16, behavior: 'smooth' });
            }
          }
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Matriz de días del mes actual (y días de relleno anterior y posterior)
  const celdasCalendario = useMemo(() => {
    // Primer día del mes
    const primerDia = new Date(vistaAnio, vistaMes, 1);
    // Día de la semana (0 = Domingo, 1 = Lunes, etc.). Convertimos a Lunes = 0, Domingo = 6
    let diaSemanaInicio = primerDia.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    // Total de días en el mes actual
    const diasEnMes = new Date(vistaAnio, vistaMes + 1, 0).getDate();

    // Total de días en el mes anterior
    const diasEnMesAnterior = new Date(vistaAnio, vistaMes, 0).getDate();

    const celdas = [];

    // Días del mes anterior
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = diasEnMesAnterior - i;
      const m = vistaMes === 0 ? 11 : vistaMes - 1;
      const y = vistaMes === 0 ? vistaAnio - 1 : vistaAnio;
      const fechaISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: false, fechaISO });
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaISO = `${vistaAnio}-${String(vistaMes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: true, fechaISO });
    }

    // Días del mes siguiente para completar múltiplos de 7 (hasta 35 o 42 celdas)
    const restante = (7 - (celdas.length % 7)) % 7;
    for (let d = 1; d <= restante; d++) {
      const m = vistaMes === 11 ? 0 : vistaMes + 1;
      const y = vistaMes === 11 ? vistaAnio + 1 : vistaAnio;
      const fechaISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: false, fechaISO });
    }

    return celdas;
  }, [vistaAnio, vistaMes]);

  const hoyISO = useMemo(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }, []);

  const diagnostico = useMemo(() => {
    if (mode === 'emision') {
      return calcularDiagnosticoSUNAT(value);
    }
    if (mode === 'entrega') {
      return calcularDiagnosticoEntrega(value);
    }
    if (mode === 'nacimiento') {
      return calcularDiagnosticoNacimiento(value);
    }
    return calcularDiagnosticoFEFO(value);
  }, [value, mode]);

  // Auto-detección inteligente de alineación para evitar que el calendario se salga por la derecha del modal o pantalla
  const [alineacionEfectiva, setAlineacionEfectiva] = useState(align);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let forzarDerecha = align === 'right';

      // 1. Detección frente a bordes de la ventana del navegador (ancho de calendario aprox. 320px)
      if (rect.left + 325 > window.innerWidth - 16) {
        forzarDerecha = true;
      }

      // 2. Detección frente a modal o tarjeta contenedora
      const contenedorPadre = containerRef.current.closest('[role="dialog"], [class*="max-w-"], .bg-white.rounded-3xl, .bg-white.rounded-2xl');
      if (contenedorPadre) {
        const parentRect = contenedorPadre.getBoundingClientRect();
        if (rect.left + 325 > parentRect.right - 16) {
          forzarDerecha = true;
        }
      }

      setAlineacionEfectiva(forzarDerecha ? 'right' : 'left');
    } else {
      setAlineacionEfectiva(align);
    }
  }, [isOpen, align]);

  // Navegación de meses
  const irMesAnterior = () => {
    if (vistaMes === 0) {
      setVistaMes(11);
      setVistaAnio((a) => a - 1);
    } else {
      setVistaMes((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (vistaMes === 11) {
      setVistaMes(0);
      setVistaAnio((a) => a + 1);
    } else {
      setVistaMes((m) => m + 1);
    }
  };

  const handleSeleccionarDia = (fechaISO) => {
    onChange && onChange(fechaISO);
    setIsOpen(false);
  };

  // Atajos para Vencimientos Farmacéuticos (FEFO)
  const aplicarAtajoAnios = (aniosSumar) => {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() + aniosSumar);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    const fechaISO = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    onChange && onChange(fechaISO);
    setVistaAnio(fecha.getFullYear());
    setVistaMes(fecha.getMonth());
    setIsOpen(false);
  };

  // Atajos para Emisión Fiscal SUNAT y Generales
  const aplicarAtajoHoy = () => {
    onChange && onChange(hoyISO);
    const hoy = new Date();
    setVistaAnio(hoy.getFullYear());
    setVistaMes(hoy.getMonth());
    setIsOpen(false);
  };

  const aplicarAtajoAyer = () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const iso = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;
    onChange && onChange(iso);
    setVistaAnio(ayer.getFullYear());
    setVistaMes(ayer.getMonth());
    setIsOpen(false);
  };

  const aplicarAtajoDiasAtras = (dias) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    onChange && onChange(iso);
    setVistaAnio(fecha.getFullYear());
    setVistaMes(fecha.getMonth());
    setIsOpen(false);
  };

  const aplicarAtajoPrimerDiaMes = () => {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    onChange && onChange(iso);
    setVistaAnio(hoy.getFullYear());
    setVistaMes(hoy.getMonth());
    setIsOpen(false);
  };

  // Atajos para Fechas de Entrega Futuras
  const aplicarAtajoDiasFuturo = (dias) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    onChange && onChange(iso);
    setVistaAnio(fecha.getFullYear());
    setVistaMes(fecha.getMonth());
    setIsOpen(false);
  };

  // Atajos para Fecha de Nacimiento de Paciente según edad cumplida
  const aplicarAtajoEdad = (edadAnios) => {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() - edadAnios);
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    onChange && onChange(iso);
    setVistaAnio(fecha.getFullYear());
    setVistaMes(fecha.getMonth());
    setIsOpen(false);
  };

  const limpiarFecha = (e) => {
    e.stopPropagation();
    onChange && onChange('');
  };

  // Rango dinámico de años según el modo
  const anioActual = new Date().getFullYear();
  const opcionesAnios = useMemo(() => {
    const lista = [];
    if (mode === 'emision') {
      // Para facturas/emisiones SUNAT: últimos 5 años hasta próximo año
      for (let a = anioActual - 5; a <= anioActual + 1; a++) {
        lista.push(a);
      }
    } else if (mode === 'entrega') {
      // Para pedidos/entregas: año actual y próximos 2 años
      for (let a = anioActual; a <= anioActual + 2; a++) {
        lista.push(a);
      }
    } else if (mode === 'nacimiento') {
      // Para fechas de nacimiento: desde año actual hasta 100 años atrás en orden descendente
      for (let a = anioActual; a >= anioActual - 100; a--) {
        lista.push(a);
      }
    } else {
      // Para vencimientos FEFO: año anterior hasta 8 años al futuro
      for (let a = anioActual - 1; a <= anioActual + 8; a++) {
        lista.push(a);
      }
    }
    if (value) {
      const [y] = value.split('-').map(Number);
      if (y && !lista.includes(y)) {
        lista.push(y);
        lista.sort((a, b) => (mode === 'nacimiento' ? b - a : a - b));
      }
    }
    return lista;
  }, [anioActual, mode, value]);

  const placeholderText = placeholder || (
    mode === 'emision'
      ? 'Seleccionar fecha de emisión...'
      : mode === 'entrega'
      ? 'Seleccionar fecha de entrega...'
      : mode === 'nacimiento'
      ? 'Seleccionar fecha de nacimiento...'
      : 'Seleccionar fecha FEFO...'
  );
  const isUp = direction === 'up';

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      {label && (
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            {label} {required && <strong className="text-rose-500">*</strong>}
          </span>
          {diagnostico && (
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border font-sora ${diagnostico.color}`}>
              {diagnostico.texto}
            </span>
          )}
        </label>
      )}

      {/* Botón Píldora Selector de Fecha */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border transition-all text-left cursor-pointer shadow-2xs font-sora ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          isOpen
            ? 'border-[#00855E] ring-4 ring-[#00855E]/10 bg-emerald-50/20 shadow-sm'
            : 'border-slate-200 dark:border-slate-700 hover:border-[#00855E] hover:bg-slate-50/70'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-[#00855E] dark:text-[#5EEBB8]" />
          </div>

          <div className="min-w-0 flex-1">
            <span className={`text-xs font-mono font-bold truncate block ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 font-sans'}`}>
              {value ? formatearFechaLegible(value) : placeholderText}
            </span>
            {value && (
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {value}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={limpiarFecha}
              title="Borrar fecha"
              className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <div className={`w-2 h-2 rounded-full ${diagnostico?.dotColor || 'bg-slate-300'}`} />
        </div>
      </button>

      {/* Ventana Desplegable del Calendario Farmacéutico */}
      {isOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            isUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
          } ${
            alineacionEfectiva === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          } w-[295px] sm:w-[315px] max-w-[calc(100vw-36px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/95 dark:border-slate-700 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-sora`}
        >
          {/* Cabecera: Navegación de Mes y Año */}
          <div className="flex items-center justify-between gap-1 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={irMesAnterior}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Selector de Mes */}
              <select
                value={vistaMes}
                onChange={(e) => setVistaMes(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00855E] cursor-pointer"
              >
                {MESES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Selector de Año */}
              <select
                value={vistaAnio}
                onChange={(e) => setVistaAnio(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00855E] cursor-pointer"
              >
                {opcionesAnios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={irMesSiguiente}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Atajos Rápidos Adaptados (SUNAT, Entrega, Nacimiento o FEFO) */}
          <div className="mb-2.5">
            {mode === 'emision' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1 font-sora">
                    <Clock className="w-2.5 h-2.5 text-teal-500" />
                    Atajos Rápidos SUNAT:
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">1-Clic</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={aplicarAtajoHoy}
                    className="px-1.5 py-1.5 rounded-lg bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-700/60 text-[10px] font-black transition-all cursor-pointer text-center shadow-2xs hover:scale-102 active:scale-98"
                    title="Emitido hoy"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={aplicarAtajoAyer}
                    className="px-1.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Emitido ayer"
                  >
                    Ayer
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoDiasAtras(3)}
                    className="px-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Plazo regular de envío OSE/SUNAT"
                  >
                    -3 Días
                  </button>
                  <button
                    type="button"
                    onClick={aplicarAtajoPrimerDiaMes}
                    className="px-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Primer día del mes en curso"
                  >
                    1° Mes
                  </button>
                </div>
              </div>
            ) : mode === 'entrega' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1 font-sora">
                    <Clock className="w-2.5 h-2.5 text-teal-500" />
                    Atajos de Entrega:
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">1-Clic</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={aplicarAtajoHoy}
                    className="px-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Llegada hoy mismo"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoDiasFuturo(1)}
                    className="px-1.5 py-1.5 rounded-lg bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-700/60 text-[10px] font-black transition-all cursor-pointer text-center shadow-2xs hover:scale-102 active:scale-98"
                    title="Llegada mañana (24h)"
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoDiasFuturo(3)}
                    className="px-1.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Llegada en 3 días"
                  >
                    +3 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoDiasFuturo(7)}
                    className="px-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Llegada en 1 semana"
                  >
                    +7 Días
                  </button>
                </div>
              </div>
            ) : mode === 'nacimiento' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-sora">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    Atajos Clínicos de Edad:
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">1-Clic</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mb-1.5">
                  <button
                    type="button"
                    onClick={() => aplicarAtajoEdad(20)}
                    className="px-1.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Adulto Joven (20 años)"
                  >
                    20 años
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoEdad(30)}
                    className="px-1.5 py-1 rounded-lg bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-700/60 text-[10px] font-black transition-all cursor-pointer text-center shadow-2xs hover:scale-102 active:scale-98"
                    title="Adulto (30 años)"
                  >
                    30 años
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoEdad(60)}
                    className="px-1.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Adulto Mayor (60 años)"
                  >
                    60 años
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoEdad(5)}
                    className="px-1.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold transition-all cursor-pointer text-center hover:scale-102 active:scale-98"
                    title="Pediátrico (5 años)"
                  >
                    5 años
                  </button>
                </div>
                {/* Selector rápido de Década para navegar de forma instantánea */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[8.5px] font-bold text-slate-400 shrink-0">Década:</span>
                  {[2010, 2000, 1990, 1980, 1970, 1960].map((decada) => (
                    <button
                      key={decada}
                      type="button"
                      onClick={() => {
                        setVistaAnio(decada);
                        setVistaMes(0);
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                        vistaAnio >= decada && vistaAnio < decada + 10
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {decada}s
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Atajos de Lote DIGEMID:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => aplicarAtajoAnios(1)}
                    className="px-1.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black transition-colors cursor-pointer text-center"
                  >
                    +1 Año
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoAnios(2)}
                    className="px-1.5 py-1 rounded-lg bg-[#EBFDF6] dark:bg-emerald-950/60 hover:bg-emerald-200 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-700 text-[10px] font-black transition-colors cursor-pointer text-center shadow-2xs"
                    title="Estándar común de caducidad"
                  >
                    +2 Años
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoAnios(3)}
                    className="px-1.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black transition-colors cursor-pointer text-center"
                  >
                    +3 Años
                  </button>
                  <button
                    type="button"
                    onClick={aplicarAtajoHoy}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Hoy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_SEMANA.map((dia, idx) => (
              <span
                key={dia}
                className={`text-[10px] font-black py-0.5 ${
                  idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}
              >
                {dia}
              </span>
            ))}
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1">
            {celdasCalendario.map((celda, idx) => {
              const esSeleccionado = celda.fechaISO === value;
              const esHoy = celda.fechaISO === hoyISO;

              return (
                <button
                  key={`${celda.fechaISO}-${idx}`}
                  type="button"
                  onClick={() => handleSeleccionarDia(celda.fechaISO)}
                  className={`h-7 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                    esSeleccionado
                      ? 'bg-[#00855E] text-white font-black shadow-md shadow-emerald-600/30 scale-105'
                      : esHoy
                      ? 'border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black bg-emerald-50/50'
                      : celda.esMesActual
                      ? 'text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#00855E]'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{celda.dia}</span>
                  {esHoy && !esSeleccionado && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pie de Diagnóstico Contextual (SUNAT, Entrega, Nacimiento o FEFO) */}
          {diagnostico && (
            <div className={`mt-2.5 p-2 rounded-xl border text-[10px] font-medium flex items-center gap-2 ${diagnostico.color}`}>
              {mode === 'nacimiento' ? (
                diagnostico.estado === 'futuro' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )
              ) : mode === 'emision' || mode === 'entrega' ? (
                diagnostico.estado === 'hoy' || diagnostico.estado === 'reciente' || diagnostico.estado === 'manana' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : diagnostico.estado === 'habil' || diagnostico.estado === 'semana' ? (
                  <Clock className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                ) : diagnostico.estado === 'futuro' || diagnostico.estado === 'vencida' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />
                )
              ) : (
                diagnostico.estado === 'optimo' ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                )
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{diagnostico.texto}</p>
                <p className="text-[9px] opacity-85 truncate">{diagnostico.detalle}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
