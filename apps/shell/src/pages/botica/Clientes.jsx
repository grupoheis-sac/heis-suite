import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from './api';
import {
  Users,
  Search,
  UserPlus,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gift,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Receipt,
  Clock,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ShieldAlert,
  Crown,
  Award,
  Percent,
  Sparkles,
  Building2,
  UserCheck,
  TrendingUp,
  HeartPulse,
  Baby,
  Smile,
  Printer,
  ShoppingBag,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import ModalImportarClientes from './components/ModalImportarClientes';
import DropdownPill from './components/DropdownPill';
import DatePickerPill from './components/DatePickerPill';
import { TicketImpresion } from '@heis/ui';

/**
 * Calcula la edad legible y el número de años a partir de una fecha YYYY-MM-DD
 */
function calcularEdad(fechaStr) {
  if (!fechaStr) return '';
  try {
    const fNac = new Date(fechaStr + 'T00:00:00');
    if (isNaN(fNac.getTime())) return '';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let anios = hoy.getFullYear() - fNac.getFullYear();
    const m = hoy.getMonth() - fNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fNac.getDate())) {
      anios--;
    }
    if (anios < 0) return 'Fecha futura';
    if (anios === 0) {
      const diffMs = hoy - fNac;
      const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const meses = Math.floor(dias / 30.4375);
      return meses > 0 ? `${meses} meses` : `${dias} días`;
    }
    return `${anios} años`;
  } catch {
    return '';
  }
}

/**
 * Clasificación de grupo etario para seguridad clínica farmacéutica (BPA)
 */
function obtenerGrupoEtario(fechaStr) {
  if (!fechaStr) return { grupo: 'Sin registrar', color: 'slate', anios: null };
  try {
    const fNac = new Date(fechaStr + 'T00:00:00');
    if (isNaN(fNac.getTime())) return { grupo: 'Sin registrar', color: 'slate', anios: null };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let anios = hoy.getFullYear() - fNac.getFullYear();
    const m = hoy.getMonth() - fNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fNac.getDate())) anios--;
    if (anios < 12) return { grupo: 'Pediátrico', color: 'amber', anios };
    if (anios >= 60) return { grupo: 'Adulto Mayor', color: 'purple', anios };
    return { grupo: 'Adulto', color: 'emerald', anios };
  } catch {
    return { grupo: 'Sin registrar', color: 'slate', anios: null };
  }
}

/**
 * Clasificación de nivel VIP y fidelización en Botica
 */
function obtenerNivelVIP(puntos = 0) {
  const pts = parseInt(puntos) || 0;
  if (pts >= 500) {
    return {
      nivel: 'VIP Oro',
      badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-amber-300 font-black',
      chip: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      icon: Crown
    };
  }
  if (pts >= 100) {
    return {
      nivel: 'VIP Plata',
      badge: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 border-slate-200 font-black',
      chip: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
      icon: Award
    };
  }
  return {
    nivel: 'Bronce',
    badge: 'bg-orange-100 text-orange-800 border-orange-200 font-bold',
    chip: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60',
    icon: Gift
  };
}

/**
 * Semáforo de riesgo y uso de línea de crédito farmacéutico
 */
function semaforoCredito(limite, deuda) {
  const lim = parseFloat(limite) || 0;
  const deu = parseFloat(deuda) || 0;
  if (lim <= 0) return { estado: 'Solo Contado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
  const uso = (deu / lim) * 100;
  if (uso >= 95) return { estado: 'Bloqueado en POS', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' };
  if (uso >= 75) return { estado: 'Alerta de Riesgo', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
  if (deu > 0) return { estado: 'Consumo Saludable', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
  return { estado: 'Línea Disponible', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
}

const TIPOS_DOC_CLIENTE = [
  { value: 'DNI', label: 'DNI (8 d.)', subtitle: 'Documento Nacional de Identidad' },
  { value: 'RUC', label: 'RUC (11 d.)', subtitle: 'Registro Único de Contribuyente' },
  { value: 'CE', label: 'C.E.', subtitle: 'Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte', subtitle: 'Documento Internacional' }
];

const ALERGENOS_COMUNES = [
  'Penicilina',
  'Amoxicilina',
  'AINEs (Ibuprofeno/Ketorolaco)',
  'Aspirina / ASA',
  'Sulfas / Cotrimoxazol',
  'Metamizol / Dipirona',
  'Paracetamol',
  'Eritromicina / Azitromicina'
];

const CONDICIONES_CLINICAS_COMUNES = [
  'Gestante / Embarazo',
  'Lactancia Materna',
  'Hipertensión Arterial',
  'Diabetes Mellitus',
  'Asma Bronquial',
  'Gastritis / Úlcera',
  'Insuficiencia Renal',
  'Insuficiencia Hepática'
];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDeuda, setFiltroDeuda] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modales
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [tabDetalle, setTabDetalle] = useState('compras'); // 'compras' | 'creditos' | 'clinica' | 'puntos'
  const [filtroBusquedaCompras, setFiltroBusquedaCompras] = useState('');
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [ventaParaTicket, setVentaParaTicket] = useState(null);
  const [cargandoTicket, setCargandoTicket] = useState(false);

  // Modales Especializados por Subcategoría
  const [modalAjusteCredito, setModalAjusteCredito] = useState(false);
  const [clienteCreditoSeleccionado, setClienteCreditoSeleccionado] = useState(null);
  const [formCredito, setFormCredito] = useState({ limite_credito: 0, dias_credito: 15 });
  const [guardandoCredito, setGuardandoCredito] = useState(false);

  const [modalGestionPuntos, setModalGestionPuntos] = useState(false);
  const [clientePuntosSeleccionado, setClientePuntosSeleccionado] = useState(null);
  const [puntosDelta, setPuntosDelta] = useState(50);
  const [tipoOperacionPuntos, setTipoOperacionPuntos] = useState('SUMAR'); // 'SUMAR' | 'RESTAR' | 'FIJAR'
  const [motivoPuntos, setMotivoPuntos] = useState('Bonificación de cortesía');
  const [guardandoPuntos, setGuardandoPuntos] = useState(false);

  const [modalFarmaco, setModalFarmaco] = useState(false);
  const [clienteFarmacoSeleccionado, setClienteFarmacoSeleccionado] = useState(null);
  const [formFarmaco, setFormFarmaco] = useState({ alergias: '', fecha_nacimiento: '', telefono: '' });
  const [guardandoFarmaco, setGuardandoFarmaco] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    limite_credito: 0,
    dias_credito: 15,
    alergias: '',
    fecha_nacimiento: '',
    condicion_sunat: ''
  });
  const [estadoSunat, setEstadoSunat] = useState(null);
  const [docDuplicadoAlerta, setDocDuplicadoAlerta] = useState(null);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clientes', {
        params: {
          busqueda: busqueda.trim() || undefined,
          con_deuda: filtroDeuda ? 'true' : undefined,
          page: pagina,
          limit: 20
        }
      });
      const payload = res?.clientes ? res : (res?.data || res || {});
      const lista = payload.clientes || (Array.isArray(payload) ? payload : []);
      setClientes(lista);
      setTotalPaginas(payload.paginas || 1);
    } catch (err) {
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [pagina, filtroDeuda]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      cargarClientes();
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const [buscandoDoc, setBuscandoDoc] = useState(false);

  // Detección preventiva de documento duplicado
  useEffect(() => {
    const doc = (formData.numero_documento || '').trim();
    if (doc.length >= 8) {
      const yaExiste = clientes.find(
        c => c.numero_documento === doc && (!clienteEditando || c.id !== clienteEditando.id)
      );
      if (yaExiste) {
        setDocDuplicadoAlerta(`Este documento ya pertenece a "${yaExiste.nombre}"`);
      } else {
        setDocDuplicadoAlerta(null);
      }
    } else {
      setDocDuplicadoAlerta(null);
    }
  }, [formData.numero_documento, clientes, clienteEditando]);

  const handleNumeroDocChange = (val) => {
    const limpio = (formData.tipo_documento === 'DNI' || formData.tipo_documento === 'RUC')
      ? val.replace(/\D/g, '')
      : val;
    setFormData(prev => ({ ...prev, numero_documento: limpio }));
    setEstadoSunat(null);
  };

  const agregarAlergiaRapida = (alergia) => {
    setFormData(prev => {
      const actual = prev.alergias ? prev.alergias.trim() : '';
      if (!actual) return { ...prev, alergias: alergia };
      if (actual.toLowerCase().includes(alergia.toLowerCase())) return prev;
      return { ...prev, alergias: `${actual}, ${alergia}` };
    });
  };

  const consultarDocumentoReniecSunat = async () => {
    const doc = (formData.numero_documento || '').trim();
    if (formData.tipo_documento === 'DNI') {
      if (doc.length !== 8) {
        return toast.error('El DNI debe tener 8 dígitos');
      }
      try {
        setBuscandoDoc(true);
        const res = await api.get(`/consultas/dni/${doc}`);
        const d = res.data?.data || res.data || res;
        if (d && (d.nombre_completo || d.nombres)) {
          const nombreCompleto = d.nombre_completo || `${d.nombres} ${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim();
          setFormData(prev => ({
            ...prev,
            nombre: nombreCompleto
          }));
          setEstadoSunat(null);
          toast.success(`Datos obtenidos de RENIEC: ${nombreCompleto}`);
        }
      } catch (e) {
        toast.error('No se pudo consultar el DNI en RENIEC');
      } finally {
        setBuscandoDoc(false);
      }
    } else if (formData.tipo_documento === 'RUC') {
      if (doc.length !== 11) {
        return toast.error('El RUC debe tener 11 dígitos');
      }
      try {
        setBuscandoDoc(true);
        const res = await api.get(`/consultas/ruc/${doc}`);
        const d = res.data?.data || res.data || res;
        if (d && (d.razon_social || d.nombre)) {
          const razonSocial = d.razon_social || d.nombre;
          setFormData(prev => ({
            ...prev,
            nombre: razonSocial,
            direccion: d.direccion || prev.direccion,
            condicion_sunat: `${d.estado || 'ACTIVO'} • ${d.condicion || 'HABIDO'}`
          }));
          setEstadoSunat({
            estado: d.estado || 'ACTIVO',
            condicion: d.condicion || 'HABIDO'
          });
          toast.success(`Datos obtenidos de SUNAT: ${razonSocial}`);
        }
      } catch (e) {
        toast.error('No se pudo consultar el RUC en SUNAT');
      } finally {
        setBuscandoDoc(false);
      }
    }
  };

  const abrirNuevoCliente = () => {
    setClienteEditando(null);
    setEstadoSunat(null);
    setDocDuplicadoAlerta(null);
    setFormData({
      tipo_documento: 'DNI',
      numero_documento: '',
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      limite_credito: 0,
      dias_credito: 15,
      alergias: '',
      fecha_nacimiento: '',
      condicion_sunat: ''
    });
    setModalFormulario(true);
  };

  const abrirEditarCliente = (cliente) => {
    setClienteEditando(cliente);
    setEstadoSunat(cliente.condicion_sunat ? { condicion: cliente.condicion_sunat, estado: 'REGISTRADO' } : null);
    setDocDuplicadoAlerta(null);
    setFormData({
      tipo_documento: cliente.tipo_documento || 'DNI',
      numero_documento: cliente.numero_documento || '',
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      limite_credito: cliente.limite_credito || 0,
      dias_credito: cliente.dias_credito || 15,
      alergias: cliente.alergias || '',
      fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.substring(0, 10) : '',
      condicion_sunat: cliente.condicion_sunat || ''
    });
    setModalFormulario(true);
  };

  const verFichaCliente = async (id) => {
    try {
      setCargandoDetalle(true);
      setModalDetalle(true);
      const res = await api.get(`/clientes/${id}`);
      const payload = res?.cliente ? res : (res?.data || res || {});
      if (payload.cliente) {
        setClienteDetalle(payload.cliente);
      }
    } catch (err) {
      toast.error('No se pudo cargar el historial del cliente');
      setModalDetalle(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirTicketImpresion = async (venta) => {
    if (!venta) return;
    try {
      setCargandoTicket(true);
      const res = await api.get(`/ventas/${venta.id}`);
      const payload = res?.data ? res.data : res;
      const ventaData = payload?.venta || (payload?.id ? payload : null);
      setVentaParaTicket(ventaData || venta);
      setMostrarTicket(true);
    } catch (err) {
      console.warn('Cargando ticket con datos locales:', err);
      setVentaParaTicket(venta);
      setMostrarTicket(true);
    } finally {
      setCargandoTicket(false);
    }
  };

  const imprimirEstadoCuentaCliente = (cliente) => {
    if (!cliente) return;
    const ventana = window.open('', '_blank', 'width=850,height=900');
    if (!ventana) {
      toast.error('Por favor permite las ventanas emergentes para imprimir el estado de cuenta');
      return;
    }
    const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const cuentas = cliente.cuentas_cobrar || [];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estado de Cuenta - ${cliente.nombre}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 28px; color: #0f172a; margin: 0; }
          .header { text-align: center; border-bottom: 2px solid #00B884; padding-bottom: 14px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 500; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 18px; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; line-height: 1.5; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; background: #ffffff; }
          .stat-title { font-size: 9.5px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
          .stat-val { font-size: 17px; font-weight: 900; margin-top: 4px; }
          .danger { color: #e11d48; }
          .success { color: #00855E; }
          .primary { color: #4338ca; }
          table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 10px; margin-bottom: 20px; }
          th { background: #f1f5f9; text-align: left; padding: 9px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 800; color: #334155; }
          td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .abonos-box { background: #f0fdf4; border-left: 3px solid #10b981; padding: 6px 10px; margin-top: 4px; border-radius: 4px; font-size: 10.5px; color: #065f46; }
          .badge-pagado { background: #dcfce7; color: #15803d; padding: 2px 7px; border-radius: 6px; font-weight: 800; font-size: 10px; }
          .badge-deuda { background: #ffe4e6; color: #be123c; padding: 2px 7px; border-radius: 6px; font-weight: 800; font-size: 10px; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SISTEMA BOTICA — ESTADO DE CUENTA Y CRÉDITOS</h1>
          <p>Reporte Oficial de Cuentas por Cobrar • Emitido el: ${fechaHoy}</p>
        </div>

        <div class="card">
          <div class="grid">
            <div><strong>Cliente:</strong> ${cliente.nombre}</div>
            <div><strong>Documento:</strong> ${cliente.tipo_documento}: ${cliente.numero_documento || '—'}</div>
            <div><strong>Teléfono:</strong> ${cliente.telefono || '—'}</div>
            <div><strong>Email:</strong> ${cliente.email || '—'}</div>
            <div><strong>Dirección:</strong> ${cliente.direccion || '—'}</div>
            <div><strong>Condición SUNAT:</strong> ${cliente.condicion_sunat || 'REGISTRADO'}</div>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-title">Límite de Crédito</div>
            <div class="stat-val">S/ ${parseFloat(cliente.limite_credito || 0).toFixed(2)}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Plazo: ${cliente.dias_credito || 15} días</div>
          </div>
          <div class="stat-card" style="border-color: #fecdd3; background: #fff1f2;">
            <div class="stat-title" style="color: #be123c;">Deuda Total Pendiente</div>
            <div class="stat-val danger">S/ ${(parseFloat(cliente.deuda_total) || 0).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Crédito Disponible</div>
            <div class="stat-val success">S/ ${parseFloat(cliente.credito_disponible || 0).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Puntos Club</div>
            <div class="stat-val primary">${cliente.puntos_fidelidad || 0} pts</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; margin: 0 0 4px;">Detalle de Créditos y Amortizaciones</h3>
        ${cuentas.length === 0 ? '<p style="color:#64748b; font-style:italic; font-size:12px;">El cliente no tiene cuentas por cobrar registradas en el sistema.</p>' : `
          <table>
            <thead>
              <tr>
                <th>N° Crédito</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th style="text-align:right;">Monto Original</th>
                <th style="text-align:right;">Total Abonado</th>
                <th style="text-align:right;">Saldo Deudor</th>
                <th style="text-align:center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${cuentas.map(cc => {
                const total = parseFloat(cc.monto_total || 0);
                const saldo = parseFloat(cc.saldo_pendiente || 0);
                const abonado = Math.max(0, total - saldo);
                const esPagado = saldo <= 0 || cc.estado === 'Pagado';
                return `
                  <tr>
                    <td><strong>#${cc.id}</strong></td>
                    <td>${cc.created_at ? new Date(cc.created_at).toLocaleDateString('es-PE') : '—'}</td>
                    <td>${cc.fecha_vencimiento || '—'}</td>
                    <td style="text-align:right;">S/ ${total.toFixed(2)}</td>
                    <td style="text-align:right; color:#059669;">S/ ${abonado.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:800; color:${esPagado ? '#059669' : '#be123c'};">S/ ${saldo.toFixed(2)}</td>
                    <td style="text-align:center;">
                      <span class="${esPagado ? 'badge-pagado' : 'badge-deuda'}">${esPagado ? 'Cancelado' : 'Pendiente'}</span>
                    </td>
                  </tr>
                  ${(cc.abonos && cc.abonos.length > 0) ? `
                    <tr>
                      <td colspan="7" style="background:#f8fafc; padding: 6px 12px;">
                        <div class="abonos-box">
                          <strong>Historial de Pagos / Abonos:</strong>
                          <ul style="margin: 4px 0 0 16px; padding: 0;">
                            ${cc.abonos.map(a => `
                              <li>${new Date(a.created_at).toLocaleDateString('es-PE')} • <strong>S/ ${parseFloat(a.monto).toFixed(2)}</strong> (${a.metodo_pago || 'Efectivo'})${a.notas ? ` — Nota: ${a.notas}` : ''}</li>
                            `).join('')}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                `;
              }).join('')}
            </tbody>
          </table>
        `}

        <div class="footer">
          <p>Documento de control interno de créditos y cobranzas farmacéuticas. Válido sin tachaduras ni enmendaduras.</p>
        </div>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 450);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      return toast.error('El nombre del cliente es obligatorio');
    }

    try {
      if (clienteEditando) {
        await api.put(`/clientes/${clienteEditando.id}`, formData);
        toast.success('Cliente actualizado correctamente');
      } else {
        await api.post('/clientes', formData);
        toast.success('Cliente registrado exitosamente');
      }
      setModalFormulario(false);
      cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const eliminarCliente = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de desactivar al cliente "${nombre}"?`)) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente desactivado');
      cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desactivar el cliente');
    }
  };

  // ─── HANDLERS: MODAL AJUSTAR LÍNEA DE CRÉDITO & RIESGO ───
  const abrirAjusteCredito = (cliente) => {
    setClienteCreditoSeleccionado(cliente);
    setFormCredito({
      limite_credito: cliente.limite_credito || 0,
      dias_credito: cliente.dias_credito || 15
    });
    setModalAjusteCredito(true);
  };

  const guardarAjusteCredito = async (e) => {
    e.preventDefault();
    if (!clienteCreditoSeleccionado) return;
    try {
      setGuardandoCredito(true);
      await api.put(`/clientes/${clienteCreditoSeleccionado.id}`, {
        limite_credito: parseFloat(formCredito.limite_credito) || 0,
        dias_credito: parseInt(formCredito.dias_credito) || 15
      });
      toast.success(`Línea de crédito actualizada para ${clienteCreditoSeleccionado.nombre}`);
      setModalAjusteCredito(false);
      cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar línea de crédito');
    } finally {
      setGuardandoCredito(false);
    }
  };

  // ─── HANDLERS: MODAL GESTIÓN DE PUNTOS CLUB ───
  const abrirGestionPuntos = (cliente) => {
    setClientePuntosSeleccionado(cliente);
    setPuntosDelta(50);
    setTipoOperacionPuntos('SUMAR');
    setMotivoPuntos('Bonificación de cortesía');
    setModalGestionPuntos(true);
  };

  const guardarGestionPuntos = async (e) => {
    e.preventDefault();
    if (!clientePuntosSeleccionado) return;
    const actual = parseInt(clientePuntosSeleccionado.puntos_fidelidad) || 0;
    const delta = parseInt(puntosDelta) || 0;
    let nuevoSaldo = actual;
    if (tipoOperacionPuntos === 'SUMAR') nuevoSaldo = actual + delta;
    else if (tipoOperacionPuntos === 'RESTAR') nuevoSaldo = Math.max(0, actual - delta);
    else if (tipoOperacionPuntos === 'FIJAR') nuevoSaldo = Math.max(0, delta);

    try {
      setGuardandoPuntos(true);
      await api.put(`/clientes/${clientePuntosSeleccionado.id}`, {
        puntos_fidelidad: nuevoSaldo
      });
      toast.success(`Puntos actualizados a ${nuevoSaldo} pts para ${clientePuntosSeleccionado.nombre}`);
      setModalGestionPuntos(false);
      cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar puntos de fidelidad');
    } finally {
      setGuardandoPuntos(false);
    }
  };

  const imprimirVoucherPuntos = (cliente, saldoFinal, motivoAjuste) => {
    if (!cliente) return;
    const ventana = window.open('', '_blank', 'width=420,height=600');
    if (!ventana) {
      toast.error('Permite las ventanas emergentes para imprimir el comprobante de puntos');
      return;
    }
    const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const vip = obtenerNivelVIP(saldoFinal);
    const descuento = (saldoFinal * 0.05).toFixed(2);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Voucher Puntos - ${cliente.nombre}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Courier New", monospace; width: 72mm; margin: 0 auto; padding: 12px; color: #000; font-size: 11px; text-align: center; }
          .header { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 14px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 10px; margin: 3px 0 0; }
          .data-box { text-align: left; margin-bottom: 10px; font-size: 11px; line-height: 1.4; }
          .pts-box { border: 2px solid #000; border-radius: 6px; padding: 10px; margin: 12px 0; background: #fff; }
          .pts-val { font-size: 24px; font-weight: 900; margin: 4px 0; }
          .footer { font-size: 9.5px; border-top: 1px dashed #000; padding-top: 8px; margin-top: 12px; color: #333; }
          @media print {
            body { width: 100%; margin: 0; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">BOTICA FARMACÉUTICA</p>
          <p class="subtitle">CLUB DE PUNTOS & FIDELIDAD</p>
          <p class="subtitle">Emisión: ${fecha}</p>
        </div>

        <div class="data-box">
          <div><strong>Socio:</strong> ${cliente.nombre}</div>
          <div><strong>Doc:</strong> ${cliente.tipo_documento}: ${cliente.numero_documento || '—'}</div>
          <div><strong>Nivel VIP:</strong> ${vip.nivel}</div>
          ${motivoAjuste ? `<div><strong>Operación:</strong> ${motivoAjuste}</div>` : ''}
        </div>

        <div class="pts-box">
          <div style="font-size:10px; font-weight:bold; letter-spacing:0.5px;">SALDO DISPONIBLE</div>
          <div class="pts-val">${saldoFinal} PTS</div>
          <div style="font-size:11px; font-weight:bold;">S/ ${descuento} DE DESCUENTO</div>
          <div style="font-size:9px; color:#555; margin-top:2px;">(Canjeable en tus compras de farmacia)</div>
        </div>

        <div class="footer">
          <p>¡Gracias por tu preferencia!<br>Acumula 1 punto por cada S/ 10 de compra.</p>
        </div>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 450);
  };

  const enviarWhatsAppPuntos = (cliente, saldoFinal) => {
    if (!cliente || !cliente.telefono) {
      toast.error('El cliente no tiene número de teléfono registrado');
      return;
    }
    const numLimpio = cliente.telefono.replace(/\D/g, '');
    const vip = obtenerNivelVIP(saldoFinal);
    const descuento = (saldoFinal * 0.05).toFixed(2);
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, te saludamos de nuestra Botica Farmacéutica. 🌟\n\n` +
      `Queremos informarte que en tu Club Fidelidad cuentas con *${saldoFinal} puntos* acumulados (Nivel ${vip.nivel}).\n` +
      `Esto equivale a *S/ ${descuento} de descuento directo* disponible para tu próxima compra en nuestro mostrador.\n\n` +
      `¡Gracias por tu preferencia y te esperamos pronto!`
    );
    window.open(`https://wa.me/51${numLimpio}?text=${mensaje}`, '_blank');
  };

  // ─── HANDLERS: MODAL FARMACOVIGILANCIA & ALERGIAS BPA ───
  const abrirFarmacovigilancia = (cliente) => {
    setClienteFarmacoSeleccionado(cliente);
    setFormFarmaco({
      alergias: cliente.alergias || '',
      fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.substring(0, 10) : '',
      telefono: cliente.telefono || ''
    });
    setModalFarmaco(true);
  };

  const toggleAlergenoEnForm = (alergeno) => {
    setFormFarmaco(prev => {
      const actualStr = prev.alergias || '';
      const list = actualStr.split(',').map(s => s.trim()).filter(Boolean);
      const existe = list.some(item => item.toLowerCase() === alergeno.toLowerCase());
      let nuevaLista;
      if (existe) {
        nuevaLista = list.filter(item => item.toLowerCase() !== alergeno.toLowerCase());
      } else {
        nuevaLista = [...list, alergeno];
      }
      return { ...prev, alergias: nuevaLista.join(', ') };
    });
  };

  const guardarFarmacovigilancia = async (e) => {
    e.preventDefault();
    if (!clienteFarmacoSeleccionado) return;
    try {
      setGuardandoFarmaco(true);
      await api.put(`/clientes/${clienteFarmacoSeleccionado.id}`, {
        alergias: formFarmaco.alergias ? formFarmaco.alergias.trim() : null,
        fecha_nacimiento: formFarmaco.fecha_nacimiento || null,
        telefono: formFarmaco.telefono ? formFarmaco.telefono.trim() : null
      });
      toast.success(`Ficha clínica BPA actualizada para ${clienteFarmacoSeleccionado.nombre}`);
      setModalFarmaco(false);
      cargarClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar ficha clínica');
    } finally {
      setGuardandoFarmaco(false);
    }
  };

  const imprimirCarnetBPA = (cliente, alergiasTexto, fechaNac, telefono) => {
    if (!cliente) return;
    const ventana = window.open('', '_blank', 'width=420,height=620');
    if (!ventana) {
      toast.error('Permite las ventanas emergentes para imprimir el Carnet BPA');
      return;
    }
    const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const grupo = obtenerGrupoEtario(fechaNac);
    const edad = calcularEdad(fechaNac);
    const listaAlergias = (alergiasTexto || '').split(',').map(s => s.trim()).filter(Boolean);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carnet BPA Farmacovigilancia - ${cliente.nombre}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace; width: 72mm; margin: 0 auto; padding: 12px; color: #000; font-size: 11px; text-align: center; }
          .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 13px; font-weight: 900; margin: 0; letter-spacing: 0.5px; }
          .subtitle { font-size: 10px; font-weight: bold; margin: 3px 0 0; color: #333; }
          .data-box { text-align: left; margin-bottom: 10px; font-size: 11px; line-height: 1.45; }
          .alert-box { border: 2px solid #b91c1c; border-radius: 6px; padding: 10px; margin: 12px 0; background: #fff5f5; text-align: left; }
          .alert-title { font-size: 11px; font-weight: 900; color: #b91c1c; margin-bottom: 6px; text-align: center; }
          .alert-item { font-size: 12px; font-weight: 800; color: #991b1b; padding: 2px 0; }
          .safe-box { border: 1.5px solid #047857; border-radius: 6px; padding: 10px; margin: 12px 0; background: #ecfdf5; font-weight: bold; color: #065f46; font-size: 11px; }
          .footer { font-size: 9px; border-top: 1px dashed #000; padding-top: 8px; margin-top: 12px; color: #444; line-height: 1.35; }
          @media print {
            body { width: 100%; margin: 0; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">BOTICA FARMACÉUTICA</p>
          <p class="subtitle">CARNET DE FARMACOVIGILANCIA (BPA)</p>
          <p style="font-size: 9.5px; margin: 2px 0 0; color: #555;">Emisión: ${fecha}</p>
        </div>

        <div class="data-box">
          <div><strong>Paciente:</strong> ${cliente.nombre}</div>
          <div><strong>Doc:</strong> ${cliente.tipo_documento}: ${cliente.numero_documento || 'S/D'}</div>
          <div><strong>Grupo Etario:</strong> ${grupo.grupo} ${edad ? `(${edad})` : ''}</div>
          ${telefono ? `<div><strong>Tel. Contacto:</strong> ${telefono}</div>` : ''}
        </div>

        ${listaAlergias.length > 0 ? `
          <div class="alert-box">
            <div class="alert-title">⚠️ ADVERTENCIAS CLÍNICAS & ALERGIAS</div>
            ${listaAlergias.map(al => `<div class="alert-item">• ${al}</div>`).join('')}
          </div>
        ` : `
          <div class="safe-box">
            ✓ SIN ALERGIAS NI CONDICIONES DE RIESGO DECLARADAS
          </div>
        `}

        <div class="footer">
          <p><strong>IMPORTANTE:</strong> Presentar este comprobante en mostrador o al médico tratante antes de recibir medicación.<br>
          En cumplimiento con Buenas Prácticas de Dispensación DIGEMID.</p>
        </div>
      </body>
      </html>
    `;
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 450);
  };

  const enviarWhatsAppFarmaco = (cliente, alergiasTexto, fechaNac) => {
    if (!cliente || !cliente.telefono) {
      toast.error('El paciente no tiene número de teléfono registrado');
      return;
    }
    const numLimpio = cliente.telefono.replace(/\D/g, '');
    const grupo = obtenerGrupoEtario(fechaNac);
    const edad = calcularEdad(fechaNac);
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, te saludamos de nuestra Botica Farmacéutica. 🛡️\n\n` +
      `Te confirmamos que tu *Ficha Clínica de Farmacovigilancia (BPA)* se encuentra registrada en nuestro sistema:\n` +
      `• *Grupo Etario:* ${grupo.grupo} ${edad ? `(${edad})` : ''}\n` +
      `• *Alergias & Condiciones:* ${alergiasTexto?.trim() ? alergiasTexto : 'Sin alergias ni contraindicaciones conocidas'}\n\n` +
      `Esta información nos permite proteger tu salud y evitar contraindicaciones durante tus compras en mostrador. Por favor comunícanos cualquier reacción adversa o cambio en tu historial médico.\n\n` +
      `¡Cuidamos tu salud y bienestar!`
    );
    window.open(`https://wa.me/51${numLimpio}?text=${mensaje}`, '_blank');
  };

  const abrirHistorialDesdeFarmaco = (cliente) => {
    setModalFarmaco(false);
    if (cliente?.id) {
      verFichaCliente(cliente.id);
      setTabDetalle('compras');
    }
  };

  const abrirDigemidNotiRAM = () => {
    window.open('https://vigiflow.who-umc.org/', '_blank');
    toast('Abriendo portal oficial de notificación de sospecha de RAM / DIGEMID', {
      icon: '🛡️',
      duration: 4000
    });
  };

  // Subcategorías & Tab Navigation
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'directorio';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    {
      id: 'directorio',
      label: 'Directorio de Clientes',
      sublabel: 'Pacientes & Empresas',
      tooltip: 'Padrón unificado de pacientes, personas naturales (DNI) y empresas (RUC)',
      icon: Users
    },
    {
      id: 'creditos',
      label: 'Líneas de Crédito & Riesgo',
      sublabel: 'Límites y Plazos en POS',
      tooltip: 'Gestión de límites autorizados en S/, plazos de pago, semáforo de riesgo y bloqueo en POS',
      icon: CreditCard
    },
    {
      id: 'fidelizacion',
      label: 'Fidelización & Puntos VIP',
      sublabel: 'Club Botica & Puntos',
      tooltip: 'Puntos acumulados en compras, ranking VIP y conversión a descuentos en POS',
      icon: Gift
    },
    {
      id: 'clinico',
      label: 'Seguridad Clínica & Alergias',
      sublabel: 'Farmacovigilancia BPA',
      tooltip: 'Advertencias de alergias (penicilina, AINEs), contraindicaciones y grupos etarios',
      icon: ShieldAlert
    }
  ];

  // Filtros rápidos específicos por subcategoría
  const [filtroDoc, setFiltroDoc] = useState('TODOS');
  const [filtroCredito, setFiltroCredito] = useState('TODOS');
  const [filtroVIP, setFiltroVIP] = useState('TODOS');
  const [filtroClinico, setFiltroClinico] = useState('TODOS');

  // Filtrado de clientes según subcategoría activa
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (activeTab === 'directorio') {
        if (filtroDoc === 'DNI') return c.tipo_documento === 'DNI';
        if (filtroDoc === 'RUC') return c.tipo_documento === 'RUC';
        if (filtroDoc === 'OTROS') return c.tipo_documento !== 'DNI' && c.tipo_documento !== 'RUC';
        return true;
      }
      if (activeTab === 'creditos') {
        const limite = parseFloat(c.limite_credito || 0);
        const deuda = parseFloat(c.deuda_total || 0);
        const uso = limite > 0 ? (deuda / limite) * 100 : 0;
        if (filtroCredito === 'CON_LINEA') return limite > 0;
        if (filtroCredito === 'LIBRE') return limite > 0 && deuda === 0;
        if (filtroCredito === 'MODERADO') return limite > 0 && deuda > 0 && uso < 80;
        if (filtroCredito === 'BLOQUEADO') return uso >= 80 || (deuda > 0 && limite === 0);
        return true;
      }
      if (activeTab === 'fidelizacion') {
        const pts = parseInt(c.puntos_fidelidad) || 0;
        if (filtroVIP === 'ORO') return pts >= 500;
        if (filtroVIP === 'PLATA') return pts >= 100 && pts < 500;
        if (filtroVIP === 'BRONCE') return pts < 100;
        return true;
      }
      if (activeTab === 'clinico') {
        const grupo = obtenerGrupoEtario(c.fecha_nacimiento);
        const alergias = (c.alergias || '').toLowerCase();
        if (filtroClinico === 'CON_ALERGIAS') return Boolean(c.alergias && c.alergias.trim());
        if (filtroClinico === 'PEDIATRICO') return grupo.grupo === 'Pediátrico';
        if (filtroClinico === 'ADULTO_MAYOR') return grupo.grupo === 'Adulto Mayor';
        if (filtroClinico === 'PENICILINA') return alergias.includes('penicilina');
        return true;
      }
      return true;
    });
  }, [clientes, activeTab, filtroDoc, filtroCredito, filtroVIP, filtroClinico]);

  // Ordenamiento para ranking de puntos en fidelización
  const listaMostrada = useMemo(() => {
    if (activeTab === 'fidelizacion') {
      return [...clientesFiltrados].sort((a, b) => (parseInt(b.puntos_fidelidad) || 0) - (parseInt(a.puntos_fidelidad) || 0));
    }
    return clientesFiltrados;
  }, [clientesFiltrados, activeTab]);

  // Métricas generales y por subcategoría
  const totalClientes = clientes.length;
  const totalDni = clientes.filter(c => c.tipo_documento === 'DNI').length;
  const totalRuc = clientes.filter(c => c.tipo_documento === 'RUC').length;
  const conTelefono = clientes.filter(c => Boolean(c.telefono && c.telefono.trim())).length;

  const clientesConDeuda = clientes.filter(c => c.tiene_deuda).length;
  const clientesConLinea = clientes.filter(c => (parseFloat(c.limite_credito) || 0) > 0).length;
  const clientesBloqueados = clientes.filter(c => {
    const lim = parseFloat(c.limite_credito || 0);
    const deu = parseFloat(c.deuda_total || 0);
    return lim > 0 ? (deu / lim) * 100 >= 80 : deu > 0;
  }).length;
  const deudaTotalAcumulada = clientes.reduce((acc, c) => acc + (parseFloat(c.deuda_total) || 0), 0);
  const limiteTotalOtorgado = clientes.reduce((acc, c) => acc + (parseFloat(c.limite_credito) || 0), 0);
  const creditoDisponibleTotal = clientes.reduce((acc, c) => acc + (parseFloat(c.credito_disponible) || 0), 0);

  const totalPuntos = clientes.reduce((acc, c) => acc + (parseInt(c.puntos_fidelidad) || 0), 0);
  const sociosOro = clientes.filter(c => (parseInt(c.puntos_fidelidad) || 0) >= 500).length;
  const sociosPlata = clientes.filter(c => {
    const pts = parseInt(c.puntos_fidelidad) || 0;
    return pts >= 100 && pts < 500;
  }).length;
  const valorTotalCanjeSoles = (totalPuntos * 0.05).toFixed(2);

  const conAlergiasCount = clientes.filter(c => Boolean(c.alergias && c.alergias.trim())).length;
  const pediatricosCount = clientes.filter(c => obtenerGrupoEtario(c.fecha_nacimiento).grupo === 'Pediátrico').length;
  const adultosMayoresCount = clientes.filter(c => obtenerGrupoEtario(c.fecha_nacimiento).grupo === 'Adulto Mayor').length;
  const coberturaClinicaPct = totalClientes > 0 
    ? Math.round((clientes.filter(c => c.alergias || c.fecha_nacimiento).length / totalClientes) * 100) 
    : 0;

  return (
    <div className="space-y-4 w-full max-w-[1700px] mx-auto pb-8 font-sora animate-in fade-in duration-200">
      {/* ─── 1. PÍLDORA UNIFICADA DE CLIENTES (ENCABEZADO + SUBCATEGORÍAS INTEGRADAS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-3 font-sora">
        {/* Fila Superior: Identidad del Módulo y Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <Users className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                  Directorio y Créditos de Clientes
                </h1>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                  <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                  Pacientes & Crédito
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
                Gestión integral de pacientes, líneas de crédito farmacéutico, club de fidelización y seguridad clínica BPA.
              </p>
            </div>
          </div>

          {/* Acciones principales e Indicador de Estado */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Indicador de Estado / Pestaña Activa (Igual que en Inventario y Compras) */}
            <div className="px-3 py-1.5 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/40 border border-[#A6F6D8] dark:border-emerald-800/50 text-xs font-bold text-[#00855E] dark:text-[#5EEBB8] flex items-center gap-1.5 font-sora">
              <span className="w-2 h-2 rounded-full bg-[#00B884] animate-pulse" />
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Activo:</span>
              <span className="text-[11px] font-black text-[#00855E] dark:text-[#5EEBB8]">
                {tabs.find((t) => t.id === activeTab)?.label || 'Directorio de Clientes'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModalImportarAbierto(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 font-extrabold text-xs shadow-2xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer font-sora"
              title="Importar cartera de clientes desde Excel o CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00B884] dark:text-[#5EEBB8]" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Botón de acción especializada según subcategoría activa */}
            {activeTab === 'creditos' && (
              <button
                type="button"
                onClick={() => {
                  if (clientes.length > 0) abrirAjusteCredito(clientes[0]);
                  else toast.error('No hay clientes registrados para ajustar crédito');
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer font-sora"
              >
                <CreditCard className="w-4 h-4" />
                <span>Ajustar Línea de Crédito</span>
              </button>
            )}

            {activeTab === 'fidelizacion' && (
              <button
                type="button"
                onClick={() => {
                  if (clientes.length > 0) abrirGestionPuntos(clientes[0]);
                  else toast.error('No hay clientes registrados para asignar puntos');
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer font-sora"
              >
                <Gift className="w-4 h-4" />
                <span>Gestionar Puntos Club</span>
              </button>
            )}

            {activeTab === 'clinico' && (
              <button
                type="button"
                onClick={() => {
                  if (clientes.length > 0) abrirFarmacovigilancia(clientes[0]);
                  else toast.error('No hay pacientes registrados para ficha clínica');
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer font-sora"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Ficha BPA Alergias</span>
              </button>
            )}

            <button
              type="button"
              onClick={abrirNuevoCliente}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer font-sora"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
          </div>
        </div>

        {/* Fila Inferior Integrada: Barra de Subcategorías en Píldoras */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-[#F8FCFA] dark:bg-slate-950/50 p-1.5 rounded-xl border border-[#D1F4E3]/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  title={t.tooltip}
                  className={`group relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none shrink-0 sm:shrink sm:flex-1 font-sora active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#00855E] text-white font-bold shadow-xs shadow-emerald-900/20 ring-1 ring-[#00855E]'
                      : 'bg-white hover:bg-[#EBFDF6] dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8] font-semibold border border-slate-200/70 hover:border-[#A6F6D8] dark:border-slate-700/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#00855E]'}`} />
                  <span className="font-bold tracking-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 2. TARJETAS DE INDICADORES / KPIS SEGÚN LA SUBCATEGORÍA ACTIVA ─── */}
      {activeTab === 'directorio' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
          {/* KPI 1: Total Pacientes y Clientes */}
          <div 
            onClick={() => setFiltroDoc('TODOS')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroDoc === 'TODOS'
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                  Padrón de Clientes
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {totalClientes}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Total registrados</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {filtroDoc === 'TODOS' ? 'Mostrando Todos' : 'Ver Todos'}
              </span>
            </div>
          </div>

          {/* KPI 2: Personas Naturales (DNI) */}
          <div 
            onClick={() => setFiltroDoc('DNI')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroDoc === 'DNI'
                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                  Personas Naturales (DNI)
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                  {totalDni}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Pacientes directos</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filtroDoc === 'DNI' ? 'Filtro Activo' : 'Filtrar DNI'}
              </span>
            </div>
          </div>

          {/* KPI 3: Empresas y RUC */}
          <div 
            onClick={() => setFiltroDoc('RUC')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroDoc === 'RUC'
                ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 truncate">
                  Empresas / Facturas RUC
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                  {totalRuc}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">RUC con condición SUNAT</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {filtroDoc === 'RUC' ? 'Filtro Activo' : 'Filtrar RUC'}
              </span>
            </div>
          </div>

          {/* KPI 4: Con Contacto / WhatsApp */}
          <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Contacto WhatsApp
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 font-mono">
                  {conTelefono}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Canal directo</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {totalClientes > 0 ? `${Math.round((conTelefono / totalClientes) * 100)}% cobertura` : '0%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'creditos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
          {/* KPI 1: Cupo Global Autorizado */}
          <div 
            onClick={() => setFiltroCredito('TODOS')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroCredito === 'TODOS'
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                  Cupo Global Autorizado
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  S/ {limiteTotalOtorgado.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Líneas en botica</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {clientesConLinea} autorizados
              </span>
            </div>
          </div>

          {/* KPI 2: Margen Libre en POS */}
          <div 
            onClick={() => setFiltroCredito('LIBRE')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroCredito === 'LIBRE'
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
                  Margen Libre en POS
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  S/ {creditoDisponibleTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Disponible para ventas</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {filtroCredito === 'LIBRE' ? 'Filtro Activo' : 'Ver Libres'}
              </span>
            </div>
          </div>

          {/* KPI 3: Consumo Actual de Cartera */}
          <div 
            onClick={() => setFiltroCredito('MODERADO')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroCredito === 'MODERADO'
                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                  Consumo Actual en Uso
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                  S/ {deudaTotalAcumulada.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Línea ocupada</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {limiteTotalOtorgado > 0 ? `${((deudaTotalAcumulada / limiteTotalOtorgado) * 100).toFixed(0)}% de cartera` : '0%'}
              </span>
            </div>
          </div>

          {/* KPI 4: Cuentas en Alerta / Bloqueadas */}
          <div 
            onClick={() => setFiltroCredito('BLOQUEADO')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroCredito === 'BLOQUEADO'
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
                  Alerta / Bloqueo en POS
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                  {clientesBloqueados}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Cupo superado (&gt;80%)</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {filtroCredito === 'BLOQUEADO' ? 'Filtro Activo' : 'Ver Riesgo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fidelizacion' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
          {/* KPI Puntos 1: Puntos en Cartera */}
          <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
                  Puntos en Cartera
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                  {totalPuntos} <span className="text-xs font-semibold text-indigo-500">pts</span>
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Puntos emitidos</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Canjeables
              </span>
            </div>
          </div>

          {/* KPI Puntos 2: Descuento Equivalente Soles */}
          <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
                  Valor Canjeable en POS
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                  <Percent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  S/ {valorTotalCanjeSoles}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Tasa: 100 pts = S/ 5.00</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Cashback
              </span>
            </div>
          </div>

          {/* KPI Puntos 3: Socios VIP Oro */}
          <div 
            onClick={() => setFiltroVIP('ORO')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroVIP === 'ORO'
                ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
                  Socios VIP Oro (≥500)
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                  {sociosOro}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Clientes más frecuentes</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                {filtroVIP === 'ORO' ? 'Filtro Activo' : 'Ver Oro'}
              </span>
            </div>
          </div>

          {/* KPI Puntos 4: Socios VIP Plata */}
          <div 
            onClick={() => setFiltroVIP('PLATA')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroVIP === 'PLATA'
                ? 'border-slate-500 bg-slate-100/50 dark:bg-slate-800/50 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 truncate">
                  Socios VIP Plata (100-499)
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {sociosPlata}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Crecimiento continuo</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filtroVIP === 'PLATA' ? 'Filtro Activo' : 'Ver Plata'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clinico' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
          {/* KPI Clínico 1: Pacientes con Alergias Declaradas */}
          <div 
            onClick={() => setFiltroClinico('CON_ALERGIAS')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroClinico === 'CON_ALERGIAS'
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
                  Alergias Registradas
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                  {conAlergiasCount}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Riesgo farmacológico</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {filtroClinico === 'CON_ALERGIAS' ? 'Filtro Activo' : 'Ver Alérgicos'}
              </span>
            </div>
          </div>

          {/* KPI Clínico 2: Pacientes Pediátricos */}
          <div 
            onClick={() => setFiltroClinico('PEDIATRICO')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroClinico === 'PEDIATRICO'
                ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
                  Pediátricos (&lt;12 años)
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                  <Baby className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                  {pediatricosCount}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Dosificación jarabes</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {filtroClinico === 'PEDIATRICO' ? 'Filtro Activo' : 'Ver Niños'}
              </span>
            </div>
          </div>

          {/* KPI Clínico 3: Pacientes Adultos Mayores */}
          <div 
            onClick={() => setFiltroClinico('ADULTO_MAYOR')}
            role="button"
            tabIndex={0}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
              filtroClinico === 'ADULTO_MAYOR'
                ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 truncate">
                  Adulto Mayor (≥60 años)
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                  {adultosMayoresCount}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Polimedicación</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {filtroClinico === 'ADULTO_MAYOR' ? 'Filtro Activo' : 'Ver Mayores'}
              </span>
            </div>
          </div>

          {/* KPI Clínico 4: Cobertura Ficha Clínica */}
          <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 truncate">
                  Cobertura Clínica BPA
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 font-mono">
                  {coberturaClinicaPct}%
                </span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10.5px] text-slate-400">Con edad o alergias</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                BPA Vigente
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS ESPECIALIZADOS ─── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 soft-card-shadow flex flex-col md:flex-row items-center justify-between gap-3 font-sora">
        {/* Input Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'directorio'
                ? 'Buscar por DNI, RUC, nombre o teléfono...'
                : activeTab === 'creditos'
                ? 'Buscar deudor por nombre o documento...'
                : activeTab === 'fidelizacion'
                ? 'Buscar socio en el club de puntos...'
                : 'Buscar paciente por nombre o alergia...'
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Pills de Filtrado Rápido según la subcategoría activa */}
        <div className="flex items-center gap-1.5 self-start md:self-auto w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
          {activeTab === 'directorio' && (
            <>
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'DNI', label: 'DNI (Personas)' },
                { id: 'RUC', label: 'RUC (Empresas)' },
                { id: 'OTROS', label: 'Otros Docs' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroDoc(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    filtroDoc === f.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'creditos' && (
            <>
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'CON_LINEA', label: 'Con Línea Autorizada' },
                { id: 'LIBRE', label: 'Línea Libre (0% Deuda)' },
                { id: 'MODERADO', label: 'Consumo Saludable (<80%)' },
                { id: 'BLOQUEADO', label: 'Bloqueado / Riesgo (≥80%)' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroCredito(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    filtroCredito === f.id
                      ? f.id === 'BLOQUEADO'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-[#00855E] text-white border-[#00855E] shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'fidelizacion' && (
            <>
              {[
                { id: 'TODOS', label: 'Todo el Club' },
                { id: 'ORO', label: 'VIP Oro (≥500)' },
                { id: 'PLATA', label: 'VIP Plata (100-499)' },
                { id: 'BRONCE', label: 'Iniciando (&lt;100)' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroVIP(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    filtroVIP === f.id
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'clinico' && (
            <>
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'CON_ALERGIAS', label: 'Alergias Declaradas' },
                { id: 'PENICILINA', label: 'Penicilina / AINEs' },
                { id: 'PEDIATRICO', label: 'Pediátrico (&lt;12a)' },
                { id: 'ADULTO_MAYOR', label: 'Adulto Mayor (≥60a)' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroClinico(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    filtroClinico === f.id
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ─── 4. TABLAS ESPECIALIZADAS POR SUBCATEGORÍA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 soft-card-shadow overflow-hidden font-sora">
        <div className="overflow-x-auto">
          {/* TABLA 1: DIRECTORIO DE CLIENTES */}
          {activeTab === 'directorio' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Paciente / Razón Social</th>
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Contacto Directo</th>
                  <th className="py-3 px-4">Edad / Nacimiento</th>
                  <th className="py-3 px-4">Condición SUNAT / Ficha</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                      Cargando directorio farmacéutico...
                    </td>
                  </tr>
                ) : listaMostrada.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center mb-3 shadow-2xs">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                          {filtroDoc !== 'TODOS' ? 'No hay clientes con este filtro' : 'Directorio de Clientes Vacío'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          {filtroDoc !== 'TODOS'
                            ? `No se encontraron registros de tipo ${filtroDoc}. Puedes restablecer el filtro o registrar uno nuevo.`
                            : 'Aún no tienes pacientes o clientes registrados en la botica. Comienza agregando el primero.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {filtroDoc !== 'TODOS' && (
                            <button
                              type="button"
                              onClick={() => setFiltroDoc('TODOS')}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Ver Todos los Clientes
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={abrirNuevoCliente}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Registrar Cliente</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listaMostrada.map((c) => {
                    const edad = calcularEdad(c.fecha_nacimiento);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center text-xs shrink-0">
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{c.nombre}</p>
                              {c.direccion && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                                  {c.direccion}
                                </p>
                              )}
                              {c.alergias && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 px-1.5 py-0.2 rounded-md mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  Alergia: {c.alergias}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 mr-1.5 font-sans">
                            {c.tipo_documento}
                          </span>
                          <span className="text-slate-800 dark:text-slate-100">{c.numero_documento || '—'}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            {c.telefono ? (
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{c.telefono}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Sin teléfono</span>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{c.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {c.fecha_nacimiento ? (
                            <div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                                {edad || c.fecha_nacimiento.substring(0, 10)}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Nac: {c.fecha_nacimiento.substring(0, 10)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No registrada</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {c.condicion_sunat ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                              <ShieldCheck className="w-3 h-3" />
                              {c.condicion_sunat}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <UserCheck className="w-3 h-3" />
                              Cliente Activo
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => verFichaCliente(c.id)}
                              title="Ver historial y estado de cuenta"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirEditarCliente(c)}
                              title="Editar datos"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarCliente(c.id, c.nombre)}
                              title="Desactivar"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TABLA 2: LÍNEAS DE CRÉDITO & RIESGO EN POS */}
          {activeTab === 'creditos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Paciente / Empresa</th>
                  <th className="py-3 px-4">Línea Autorizada & Plazo</th>
                  <th className="py-3 px-4">Consumo Actual (S/)</th>
                  <th className="py-3 px-4">Margen Libre en POS (S/)</th>
                  <th className="py-3 px-4">% Utilización de Cupo</th>
                  <th className="py-3 px-4">Semáforo de Riesgo en POS</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                      Cargando líneas de crédito y límites comerciales...
                    </td>
                  </tr>
                ) : listaMostrada.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center mb-3 shadow-2xs">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                          {filtroCredito !== 'TODOS' ? 'Sin clientes bajo este filtro de crédito' : 'Sin Líneas de Crédito Activas'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          {filtroCredito !== 'TODOS'
                            ? 'Prueba cambiando el filtro de semáforo o busca un cliente para autorizarle crédito comercial.'
                            : 'Asigna límites de crédito (S/.) y días de plazo a tus clientes o empresas para habilitar compras en POS.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {filtroCredito !== 'TODOS' ? (
                            <button
                              type="button"
                              onClick={() => setFiltroCredito('TODOS')}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Ver Todas las Líneas
                            </button>
                          ) : (
                            clientes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => abrirAjusteCredito(clientes[0])}
                                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Asignar Línea a {clientes[0].nombre.split(' ')[0]}</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={abrirNuevoCliente}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Nuevo Cliente</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listaMostrada.map((c) => {
                    const limite = parseFloat(c.limite_credito || 0);
                    const deuda = parseFloat(c.deuda_total || 0);
                    const disponible = parseFloat(c.credito_disponible || 0);
                    const porcentajeUso = limite > 0 ? Math.min(100, (deuda / limite) * 100) : 0;
                    const semaforo = semaforoCredito(limite, deuda);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center text-xs shrink-0">
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{c.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {c.tipo_documento}: {c.numero_documento || '—'} {c.telefono ? `• ${c.telefono}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono text-xs">
                            S/ {limite.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Plazo: {c.dias_credito || 15} días
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`font-black font-mono text-xs ${deuda > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            S/ {deuda.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-extrabold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            S/ {disponible.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {limite > 0 ? (
                            <div className="space-y-1 max-w-[140px]">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className={porcentajeUso > 80 ? 'text-rose-600' : 'text-slate-500'}>
                                  {porcentajeUso.toFixed(0)}% ocupado
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    porcentajeUso > 85
                                      ? 'bg-rose-500'
                                      : porcentajeUso > 50
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${porcentajeUso}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Sin línea</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${semaforo.color}`}>
                            {semaforo.estado}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {deuda > 0 && (
                              <button
                                onClick={() => navigate('/caja-finanzas?tab=cobrar')}
                                title="Ir a Caja Chica para registrar abono o cobro de dinero"
                                className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Cobrar en Caja</span>
                              </button>
                            )}
                            <button
                              onClick={() => verFichaCliente(c.id)}
                              title="Ver Ficha y Estado de Cuenta"
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ficha</span>
                            </button>
                            <button
                              onClick={() => abrirAjusteCredito(c)}
                              title="Ajustar Línea de Crédito y Plazo en Días"
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Línea</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TABLA 3: FIDELIZACIÓN & PUNTOS VIP */}
          {activeTab === 'fidelizacion' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-center">Ranking</th>
                  <th className="py-3 px-4">Socio / Cliente</th>
                  <th className="py-3 px-4">Nivel Club Botica</th>
                  <th className="py-3 px-4">Puntos Acumulados</th>
                  <th className="py-3 px-4">Descuento POS (S/)</th>
                  <th className="py-3 px-4">Notificación WhatsApp</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                      Cargando ranking de fidelización del club botica...
                    </td>
                  </tr>
                ) : listaMostrada.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center mb-3 shadow-2xs">
                          <Gift className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                          {filtroVIP !== 'TODOS' ? `Sin clientes en categoría VIP ${filtroVIP}` : 'Sin Puntos de Fidelización'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          {filtroVIP !== 'TODOS'
                            ? 'Ningún cliente cumple el umbral de puntos seleccionado. Puedes ver el ranking completo o bonificar puntos.'
                            : 'Fideliza a tus pacientes bonificando puntos por compras en mostrador POS para canjear descuentos.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {filtroVIP !== 'TODOS' ? (
                            <button
                              type="button"
                              onClick={() => setFiltroVIP('TODOS')}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Ver Todo el Club
                            </button>
                          ) : (
                            clientes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => abrirGestionPuntos(clientes[0])}
                                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Bonificar Puntos a {clientes[0].nombre.split(' ')[0]}</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={abrirNuevoCliente}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Nuevo Socio</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listaMostrada.map((c, idx) => {
                    const puntos = parseInt(c.puntos_fidelidad) || 0;
                    const vip = obtenerNivelVIP(puntos);
                    const IconVIP = vip.icon;
                    const descuentoSoles = (puntos * 0.05).toFixed(2);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-xs">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono font-bold text-xs">
                              #{idx + 1}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-xs shrink-0">
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{c.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {c.tipo_documento}: {c.numero_documento || '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${vip.chip}`}>
                            <IconVIP className="w-3 h-3" />
                            {vip.nivel}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs font-mono">
                            <Gift className="w-3.5 h-3.5 text-indigo-500" />
                            {puntos} pts
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-black font-mono text-xs text-emerald-700 dark:text-emerald-400">
                            S/ {descuentoSoles}
                          </span>
                          <p className="text-[9.5px] text-slate-400 font-medium">Canje en caja</p>
                        </td>

                        <td className="py-3 px-4">
                          {c.telefono ? (
                            <a
                              href={`https://wa.me/51${c.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(c.nombre)},%20tienes%20${puntos}%20puntos%20acumulados%20en%20nuestra%20botica%20equivalentes%20a%20S/%20${descuentoSoles}%20de%20descuento%20en%20tu%20proxima%20compra.`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg border border-teal-200/80 dark:border-teal-800/60"
                            >
                              <Phone className="w-3 h-3 text-teal-600" />
                              <span>{c.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin WhatsApp</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => abrirGestionPuntos(c)}
                              title="Bonificar o Ajustar Puntos Club"
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Puntos</span>
                            </button>
                            <button
                              onClick={() => verFichaCliente(c.id)}
                              title="Ver Historial de Compras y Ficha"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TABLA 4: SEGURIDAD CLÍNICA & ALERGIAS (FARMACOVIGILANCIA BPA) */}
          {activeTab === 'clinico' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Grupo Etario & Edad</th>
                  <th className="py-3 px-4">Alergias a Medicamentos (BPA)</th>
                  <th className="py-3 px-4">Nivel de Precaución POS</th>
                  <th className="py-3 px-4">Contacto Emergencia</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                      Cargando fichas clínicas y advertencias de farmacovigilancia...
                    </td>
                  </tr>
                ) : listaMostrada.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center mb-3 shadow-2xs">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                          {filtroClinico !== 'TODOS' ? 'Sin pacientes bajo este criterio clínico' : 'Sin Alertas Clínicas Registradas'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          {filtroClinico !== 'TODOS'
                            ? 'No hay pacientes que coincidan con la clasificación seleccionada. Restablece el filtro o registra una ficha.'
                            : 'Registra alérgenos de alto riesgo (Penicilina, AINEs) y fechas de nacimiento para activar alertas en POS.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {filtroClinico !== 'TODOS' ? (
                            <button
                              type="button"
                              onClick={() => setFiltroClinico('TODOS')}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Ver Todos los Pacientes
                            </button>
                          ) : (
                            clientes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => abrirFarmacovigilancia(clientes[0])}
                                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Registrar Ficha BPA para {clientes[0].nombre.split(' ')[0]}</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={abrirNuevoCliente}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Nuevo Paciente</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  listaMostrada.map((c) => {
                    const grupo = obtenerGrupoEtario(c.fecha_nacimiento);
                    const edad = calcularEdad(c.fecha_nacimiento);
                    const tieneAlergia = Boolean(c.alergias && c.alergias.trim());

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-xs shrink-0 ${
                              tieneAlergia 
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{c.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {c.tipo_documento}: {c.numero_documento || '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {c.fecha_nacimiento ? (
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                grupo.grupo === 'Pediátrico'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  : grupo.grupo === 'Adulto Mayor'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}>
                                {grupo.grupo} ({edad})
                              </span>
                              <p className="text-[9.5px] text-slate-400 font-mono">
                                F. Nac: {c.fecha_nacimiento.substring(0, 10)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Edad no registrada</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {tieneAlergia ? (
                            <div className="flex flex-wrap gap-1 max-w-[260px]">
                              {c.alergias.split(',').map((al, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  {al.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Sin alergias declaradas
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {tieneAlergia ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <ShieldAlert className="w-3 h-3 text-rose-700" />
                              Precaución Farmacéutica Alta
                            </span>
                          ) : grupo.grupo === 'Pediátrico' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              <Baby className="w-3 h-3 text-amber-700" />
                              Dosificación Pediátrica
                            </span>
                          ) : grupo.grupo === 'Adulto Mayor' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                              <HeartPulse className="w-3 h-3 text-purple-700" />
                              Monitoreo Geriátrico
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Dispensación Estándar
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {c.telefono ? (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{c.telefono}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin teléfono</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => abrirFarmacovigilancia(c)}
                              title="Ficha Rápida de Alergias y Farmacovigilancia BPA"
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Alergias BPA</span>
                            </button>
                            <button
                              onClick={() => verFichaCliente(c.id)}
                              title="Ver Historial"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación Común */}
        {totalPaginas > 1 && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-950/30">
            <span>Página {pagina} de {totalPaginas} ({clientes.length} clientes cargados)</span>
            <div className="flex gap-1.5">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer font-bold"
              >
                Anterior
              </button>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer font-bold"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL NUEVO / EDITAR CLIENTE (DISEÑO PÍLDORA BOTICA) ─── */}
      {modalFormulario && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalFormulario(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer font-sora"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/90 dark:border-slate-800 relative my-auto cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera Fija */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <span>{clienteEditando ? 'Actualizar Ficha de Paciente / Cliente' : 'Registrar Nuevo Paciente / Cliente'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      BPA & SUNAT
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Gestión de identidad, seguridad clínica por alergias y línea de crédito farmacéutico
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalFormulario(false)}
                className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center transition-all cursor-pointer group"
              >
                <X className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              <form id="form-cliente" onSubmit={guardarCliente} className="space-y-4">
                
                {/* ─── 1. IDENTIFICACIÓN Y CONSULTA EN LÍNEA ─── */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Identidad y Consulta Oficial (RENIEC / SUNAT)</span>
                    </label>
                    {estadoSunat && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        estadoSunat.estado === 'ACTIVO' && estadoSunat.condicion === 'HABIDO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {estadoSunat.estado} • {estadoSunat.condicion}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <DropdownPill
                        label="Tipo Documento"
                        value={formData.tipo_documento}
                        onChange={(val) => {
                          setFormData({ ...formData, tipo_documento: val, numero_documento: '' });
                          setEstadoSunat(null);
                          setDocDuplicadoAlerta(null);
                        }}
                        options={TIPOS_DOC_CLIENTE}
                        icon={CreditCard}
                      />
                    </div>

                    <div className="sm:col-span-7">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        N° de Documento <strong className="text-rose-500">*</strong>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          maxLength={formData.tipo_documento === 'RUC' ? 11 : formData.tipo_documento === 'DNI' ? 8 : 15}
                          value={formData.numero_documento}
                          onChange={(e) => handleNumeroDocChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              consultarDocumentoReniecSunat();
                            }
                          }}
                          placeholder={formData.tipo_documento === 'DNI' ? '8 dígitos (Presiona Enter)' : formData.tipo_documento === 'RUC' ? '11 dígitos (Presiona Enter)' : 'N° Documento'}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
                        />
                        {(formData.tipo_documento === 'DNI' || formData.tipo_documento === 'RUC') && (
                          <button
                            type="button"
                            onClick={consultarDocumentoReniecSunat}
                            disabled={buscandoDoc}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
                            title={formData.tipo_documento === 'DNI' ? 'Consultar RENIEC oficial' : 'Consultar padrón SUNAT'}
                          >
                            {buscandoDoc ? (
                              <span className="w-3.5 h-3.5 border-2 border-emerald-700 dark:border-emerald-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                            )}
                            <span>{formData.tipo_documento === 'DNI' ? 'RENIEC' : 'SUNAT'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alerta preventiva si el documento ya está registrado */}
                  {docDuplicadoAlerta && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>{docDuplicadoAlerta}</span>
                    </div>
                  )}

                  {/* Nombre Completo / Razón Social */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Nombre Completo o Razón Social <strong className="text-rose-500">*</strong>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej. María Elena Rodríguez Sánchez / Droguería Médica S.A.C."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                    />
                  </div>

                  {/* Grid Fecha de Nacimiento con DatePickerPill & Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <DatePickerPill
                        label="Fecha de Nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={(val) => setFormData({ ...formData, fecha_nacimiento: val })}
                        mode="nacimiento"
                        direction="down"
                        align="left"
                        placeholder="Seleccionar fecha de nacimiento..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Teléfono / Celular WhatsApp</span>
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="Ej. 984 512 340"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── 2. CONTACTO, EMAIL & DIRECCIÓN DE ENTREGA ─── */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Facturación Electrónica y Domicilio</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Correo para Comprobantes (Opcional)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="paciente@correo.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Dirección Domiciliaria o Fiscal</span>
                      </label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Av. Los Laureles 320, Int. B"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── 3. SEGURIDAD CLÍNICA: ALERGIAS Y ADVERTENCIAS FARMACÉUTICAS ─── */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Alergias a Medicamentos / Advertencias Clínicas</span>
                    </label>
                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">
                      Alerta visual en POS al despachar
                    </span>
                  </div>

                  <input
                    type="text"
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                    placeholder="Ej. Alergia a Penicilina, AINEs / Ibuprofeno, Sulfas, Hipertenso..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 shadow-2xs"
                  />

                  {/* Pills de inserción rápida de alergias frecuentes */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400">Frecuentes:</span>
                    {['Penicilina', 'AINEs / Ibuprofeno', 'Sulfas', 'Aspirina', 'Paracetamol'].map((al) => (
                      <button
                        key={al}
                        type="button"
                        onClick={() => agregarAlergiaRapida(al)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        + {al}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── 4. LÍNEA DE CRÉDITO FARMACÉUTICO Y PLAZO DE PAGO ─── */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Línea de Crédito Farmacéutico</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      0.00 = Exclusivo al Contado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Monto Límite Autorizado (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.limite_credito}
                        onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Plazo de Pago (Días de Crédito)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.dias_credito}
                        onChange={(e) => setFormData({ ...formData, dias_credito: e.target.value })}
                        placeholder="15 días"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Pie Fijo con Botones */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <button
                type="button"
                onClick={() => setModalFormulario(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-cliente"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{clienteEditando ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL DETALLE, HISTORIAL DE COMPRAS Y ESTADO DE CUENTA ─── */}
      {modalDetalle && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDetalle(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-[2.5px] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 cursor-pointer overflow-hidden font-sora"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden relative cursor-default animate-in zoom-in-95 duration-200"
          >
            {/* Cabecera Fija con Avatar, Identidad y Cerrar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20 shrink-0">
                  {clienteDetalle ? clienteDetalle.nombre.charAt(0).toUpperCase() : <Eye className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      {clienteDetalle ? clienteDetalle.nombre : 'Ficha de Historial & Estado de Cuenta'}
                    </h3>
                    {clienteDetalle && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {clienteDetalle.tipo_documento}: {clienteDetalle.numero_documento || 'S/D'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {clienteDetalle ? (
                      <>
                        {clienteDetalle.telefono ? `Tel: ${clienteDetalle.telefono}` : 'Sin teléfono'} • {clienteDetalle.condicion_sunat || 'Registrado'}
                      </>
                    ) : 'Cargando información clínica y financiera...'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDetalle(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Píldora Desplegable para Cambiar Cliente al instante */}
            {clientes.length > 1 && (
              <div className="px-5 sm:px-6 pt-3 pb-1 bg-slate-50/30 dark:bg-slate-950/20 shrink-0 border-b border-slate-100/60 dark:border-slate-800/40">
                <DropdownPill
                  label="Cambiar Paciente o Empresa a Consultar"
                  value={clienteDetalle?.id}
                  onChange={(val) => {
                    const id = parseInt(val);
                    if (id) verFichaCliente(id);
                  }}
                  options={clientes.map(c => ({
                    value: c.id,
                    label: c.nombre,
                    subtitle: `${c.tipo_documento}: ${c.numero_documento || '—'}${c.telefono ? ` • Tel: ${c.telefono}` : ''}`,
                    badge: parseFloat(c.deuda_total || 0) > 0 
                      ? `Deuda: S/ ${parseFloat(c.deuda_total).toFixed(2)}` 
                      : (parseFloat(c.limite_credito || 0) > 0 ? `Límite: S/ ${parseFloat(c.limite_credito).toFixed(2)}` : 'Sin crédito')
                  }))}
                  icon={Users}
                  searchable={true}
                  searchPlaceholder="Buscar por nombre, DNI o RUC..."
                  placeholder="Seleccionar paciente o empresa..."
                />
              </div>
            )}

            {/* Barra de Pestañas (Tabs) Segmentadas */}
            <div className="px-5 sm:px-6 py-2.5 bg-slate-50/60 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-black overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setTabDetalle('compras')}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    tabDetalle === 'compras'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Historial Compras</span>
                  {clienteDetalle?.ventas && clienteDetalle.ventas.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {clienteDetalle.ventas.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTabDetalle('creditos')}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    tabDetalle === 'creditos'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Estado de Cuenta</span>
                  {parseFloat(clienteDetalle?.deuda_total || 0) > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold">
                      Deuda
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      Al día
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTabDetalle('clinica')}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    tabDetalle === 'clinica'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ficha Clínica & BPA</span>
                  {clienteDetalle?.alergias && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold">
                      Alergia
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTabDetalle('puntos')}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    tabDetalle === 'puntos'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Club Puntos VIP</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold">
                    {clienteDetalle?.puntos_fidelidad || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Contenido Scrolleable según Pestaña */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {cargandoDetalle || !clienteDetalle ? (
                <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
                  <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Cargando historial clínico, compras y estado de cuenta...</p>
                </div>
              ) : (
                <>
                  {/* ─── PESTAÑA 1: HISTORIAL DE COMPRAS ─── */}
                  {tabDetalle === 'compras' && (() => {
                    const ventas = clienteDetalle.ventas || [];
                    const totalGastado = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
                    const promedioTicket = ventas.length > 0 ? (totalGastado / ventas.length) : 0;
                    const q = filtroBusquedaCompras.trim().toLowerCase();
                    const ventasFiltradas = q ? ventas.filter(v => {
                      const num = (v.numero || '').toLowerCase();
                      const tipo = (v.tipo_pago || '').toLowerCase();
                      const comps = (v.detalles || []).map(d => d.medicamento?.nombre_comercial || '').join(' ').toLowerCase();
                      return num.includes(q) || tipo.includes(q) || comps.includes(q);
                    }) : ventas;

                    return (
                      <div className="space-y-4">
                        {/* Métricas Rápidas de Compra */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Histórico en Compras</span>
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">S/ {totalGastado.toFixed(2)}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Transacciones Realizadas</span>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{ventas.length} ventas</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Ticket Promedio</span>
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">S/ {promedioTicket.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Buscador de Compras Local */}
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={filtroBusquedaCompras}
                            onChange={(e) => setFiltroBusquedaCompras(e.target.value)}
                            placeholder="Buscar por N° comprobante (ej. B001), método de pago o medicamento comprado..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>

                        {/* Listado de Compras */}
                        {ventasFiltradas.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {ventas.length === 0 ? 'No hay compras registradas a nombre de este cliente.' : 'No se encontraron compras con los criterios de búsqueda.'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {ventas.length === 0 ? 'Las ventas emitidas desde el POS o Facturación aparecerán reflejadas aquí.' : 'Prueba buscando con otro término o número de documento.'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {ventasFiltradas.map((v) => (
                              <div
                                key={v.id}
                                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all shadow-2xs space-y-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                                      <Receipt className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">{v.numero}</span>
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                          {v.tipo_pago || 'Contado'}
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                                        {new Date(v.created_at).toLocaleDateString('es-PE')} • {new Date(v.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3">
                                    <div className="text-left sm:text-right">
                                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                                        S/ {parseFloat(v.total || 0).toFixed(2)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => abrirTicketImpresion(v)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                                      title="Ver comprobante e imprimir ticket térmico o A4"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Ver Ticket</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Desglose de Productos Comprados */}
                                {v.detalles && v.detalles.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-1.5">
                                    {v.detalles.map((d, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-medium"
                                      >
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{d.cantidad}x</span>
                                        <span className="truncate max-w-[200px]">{d.medicamento?.nombre_comercial || 'Medicamento'}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ─── PESTAÑA 2: ESTADO DE CUENTA & CRÉDITOS ─── */}
                  {tabDetalle === 'creditos' && (
                    <div className="space-y-4">
                      {/* Resumen Financiero */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Límite Asignado</p>
                          <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">S/ {parseFloat(clienteDetalle.limite_credito || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Plazo: {clienteDetalle.dias_credito || 15} días</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                          <p className="text-[10px] uppercase font-bold text-rose-500">Deuda Total</p>
                          <p className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5">S/ {(parseFloat(clienteDetalle.deuda_total) || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-rose-600/80 font-mono mt-0.5">Pendiente de cobro</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                          <p className="text-[10px] uppercase font-bold text-emerald-600">Crédito Disponible</p>
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">S/ {parseFloat(clienteDetalle.credito_disponible || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-emerald-600/80 font-mono mt-0.5">Para ventas al crédito</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Riesgo en POS</p>
                          {(() => {
                            const sem = semaforoCredito(clienteDetalle.limite_credito, clienteDetalle.deuda_total);
                            return (
                              <span className={`inline-block mt-1 text-[11px] font-black px-2 py-0.5 rounded-lg border ${sem.color}`}>
                                {sem.estado}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Botones de Acción de Crédito */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imprimirEstadoCuentaCliente(clienteDetalle)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                            title="Imprimir Estado de Cuenta Oficial para el cliente"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span>Imprimir Estado de Cuenta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModalDetalle(false);
                              abrirAjusteCredito(clienteDetalle);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Ajustar Límite / Días</span>
                          </button>
                        </div>

                        {parseFloat(clienteDetalle.deuda_total || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalDetalle(false);
                              navigate('/caja-finanzas?tab=cobrar');
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Cobrar en Caja Chica</span>
                          </button>
                        )}
                      </div>

                      {/* Lista de Cuentas por Cobrar */}
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                          <span>Desglose de Créditos & Cuentas por Cobrar</span>
                        </h4>

                        {(!clienteDetalle.cuentas_cobrar || clienteDetalle.cuentas_cobrar.length === 0) ? (
                          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">El cliente no tiene deudas pendientes registradas.</p>
                            <p className="text-[11px] text-slate-400">Cuenta con una línea de crédito disponible y sin mora.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {clienteDetalle.cuentas_cobrar.map((cc) => {
                              const total = parseFloat(cc.monto_total || 0);
                              const saldo = parseFloat(cc.saldo_pendiente || 0);
                              const abonado = Math.max(0, total - saldo);
                              const esPagado = saldo <= 0 || cc.estado === 'Pagado';

                              return (
                                <div
                                  key={cc.id}
                                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs space-y-2.5"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">Crédito ID #{cc.id}</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${esPagado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                          {esPagado ? 'Cancelado' : 'Pendiente'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Vencimiento: <strong className={esPagado ? 'text-slate-600' : 'text-rose-600'}>{cc.fecha_vencimiento || 'Sin fecha'}</strong>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Monto Total: S/ {total.toFixed(2)}</div>
                                        <div className={`text-xs font-black ${esPagado ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          Saldo Deudor: S/ {saldo.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Desglose de Abonos */}
                                  {cc.abonos && cc.abonos.length > 0 && (
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        Amortizaciones Realizadas ({cc.abonos.length}):
                                      </span>
                                      <div className="space-y-1">
                                        {cc.abonos.map((a) => (
                                          <div key={a.id} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                            <span>
                                              {new Date(a.created_at).toLocaleDateString('es-PE')} • {a.metodo_pago || 'Efectivo'} {a.notas ? `(${a.notas})` : ''}
                                            </span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">+S/ {parseFloat(a.monto).toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── PESTAÑA 3: FICHA CLÍNICA & SEGURIDAD BPA ─── */}
                  {tabDetalle === 'clinica' && (
                    <div className="space-y-4">
                      {/* Advertencia Destacada de Alergias */}
                      {clienteDetalle.alergias ? (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black uppercase text-rose-800 dark:text-rose-200 tracking-tight">
                              Alerta de Seguridad Clínica Farmacéutica (BPA)
                            </h4>
                            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                              El paciente tiene alergia declarada a: <strong className="underline decoration-rose-500">{clienteDetalle.alergias}</strong>.
                            </p>
                            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                              ⚠️ Verificar principios activos antes de cualquier dispensación para evitar shock anafiláctico o reacciones adversas.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                              Sin Alergias Medicamentosas Registradas
                            </h4>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                              El paciente no ha reportado hipersensibilidad a antibióticos o AINEs comunes.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Clasificación de Grupo Etario y Datos Médicos */}
                      {(() => {
                        const etario = obtenerGrupoEtario(clienteDetalle.fecha_nacimiento);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Grupo Etario Clínico</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black text-${etario.color}-700 dark:text-${etario.color}-300`}>
                                  {etario.grupo}
                                </span>
                                {clienteDetalle.fecha_nacimiento && (
                                  <span className="text-xs text-slate-500 font-mono">
                                    ({calcularEdad(clienteDetalle.fecha_nacimiento)})
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-400">
                                {etario.grupo === 'Pediátrico' ? 'Requiere dosificación por peso y cálculo de posología pediátrica.' : (
                                  etario.grupo === 'Adulto Mayor' ? 'Monitorear interacciones y función renal/hepática en polifarmacia.' : 'Dosificación habitual en adultos.'
                                )}
                              </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Condición Tributaria / SUNAT</span>
                              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                                {clienteDetalle.condicion_sunat || 'REGISTRADO EN SISTEMA'}
                              </p>
                              <p className="text-[10.5px] text-slate-400">
                                Habilitado para emisión electrónica de Boletas y Facturas.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Datos de Contacto y Residencia */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                          Directorio de Contacto y Entrega
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono / Celular</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{clienteDetalle.telefono || 'No registrado'}</span>
                              {clienteDetalle.telefono && (
                                <a
                                  href={`https://wa.me/51${clienteDetalle.telefono.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Electrónico</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{clienteDetalle.email || 'No registrado'}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dirección Fiscal / Domiciliaria</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{clienteDetalle.direccion || 'No registrada'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Actualizar Ficha BPA */}
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setModalDetalle(false);
                            abrirFarmacovigilancia(clienteDetalle);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-rose-600/20"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Actualizar Ficha de Seguridad BPA & Alergias</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── PESTAÑA 4: CLUB DE PUNTOS VIP ─── */}
                  {tabDetalle === 'puntos' && (() => {
                    const vip = obtenerNivelVIP(clienteDetalle.puntos_fidelidad);
                    const pts = parseInt(clienteDetalle.puntos_fidelidad) || 0;
                    const descuentoEstimado = (pts / 20).toFixed(2);
                    const IconVIP = vip.icon;

                    return (
                      <div className="space-y-4">
                        {/* Tarjeta de Nivel VIP y Saldo (Tema Claro Farmacéutico) */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                          <div className="flex items-center justify-between relative z-10">
                            <div>
                              <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-700 dark:text-indigo-400">Club Fidelidad de Botica</span>
                              <div className="flex items-center gap-2.5 mt-1.5">
                                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-lg border shadow-2xs ${vip.chip}`}>
                                  {vip.nivel}
                                </span>
                              </div>
                              <div className="mt-3">
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">{pts}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-bold">PUNTOS ACUMULADOS</span>
                              </div>
                            </div>

                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
                              <IconVIP className="w-7 h-7" />
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span>Valor en canje mostrador:</span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-lg text-sm">
                              S/ {descuentoEstimado} de descuento
                            </span>
                          </div>
                        </div>

                        {/* Escala de Beneficios del Club */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className={`p-3 rounded-2xl border ${pts < 100 ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                            <span className="font-black text-amber-800 dark:text-amber-300 block">Nivel Bronce</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">0 a 99 puntos. Acumula 1 punto por cada S/ 5 de compra.</p>
                          </div>
                          <div className={`p-3 rounded-2xl border ${pts >= 100 && pts < 500 ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                            <span className="font-black text-slate-800 dark:text-slate-200 block">VIP Plata</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">100 a 499 puntos. Promociones especiales y canjes directos.</p>
                          </div>
                          <div className={`p-3 rounded-2xl border ${pts >= 500 ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                            <span className="font-black text-amber-700 dark:text-amber-300 block">VIP Oro</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">500+ puntos. Doble puntaje en aniversarios y descuentos prémium.</p>
                          </div>
                        </div>

                        {/* Botón de Gestión de Puntos */}
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setModalDetalle(false);
                              abrirGestionPuntos(clienteDetalle);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Sumar / Ajustar Puntos Club</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Pie Fijo con Botones */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2">
                {clienteDetalle && parseFloat(clienteDetalle.deuda_total || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetalle(false);
                      navigate('/caja-finanzas?tab=cobrar');
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 text-xs font-black transition-all cursor-pointer shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Cobrar Deuda en Caja</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalDetalle(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Importación Masiva de Clientes */}
      <ModalImportarClientes
        abierto={modalImportarAbierto}
        alCerrar={() => setModalImportarAbierto(false)}
        alCompletar={() => cargarClientes()}
      />

      {/* ─── MODAL ESPECIALIZADO 1: AJUSTAR LÍNEA DE CRÉDITO & RIESGO EN POS ─── */}
      {modalAjusteCredito && clienteCreditoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAjusteCredito(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-[2.5px] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 relative my-auto cursor-default animate-in zoom-in-95 duration-200 font-sora max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera Fija */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    Línea de Crédito & Riesgo en POS
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {clienteCreditoSeleccionado.nombre} • <span className="font-mono">{clienteCreditoSeleccionado.tipo_documento}: {clienteCreditoSeleccionado.numero_documento || '—'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAjusteCredito(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Formulario con cuerpo scrolleable y pie fijo */}
            <form onSubmit={guardarAjusteCredito} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {/* Selector con diseño Píldora Farmacéutica idéntico a otros modales */}
                {clientes.length > 1 && (
                  <div className="mb-1">
                    <DropdownPill
                      label="Cambiar Paciente o Empresa a Configurar"
                      value={clienteCreditoSeleccionado.id}
                      onChange={(val) => {
                        const id = parseInt(val);
                        const cl = clientes.find(c => c.id === id);
                        if (cl) abrirAjusteCredito(cl);
                      }}
                      options={clientes.map(c => ({
                        value: c.id,
                        label: c.nombre,
                        subtitle: `${c.tipo_documento}: ${c.numero_documento || '—'}${c.telefono ? ` • Tel: ${c.telefono}` : ''}`,
                        badge: parseFloat(c.deuda_total || 0) > 0 
                          ? `Deuda: S/ ${parseFloat(c.deuda_total).toFixed(2)}` 
                          : (parseFloat(c.limite_credito || 0) > 0 ? `Límite: S/ ${parseFloat(c.limite_credito).toFixed(2)}` : 'Sin crédito')
                      }))}
                      icon={Users}
                      searchable={true}
                      searchPlaceholder="Buscar por nombre, DNI o RUC..."
                      placeholder="Seleccionar paciente o empresa..."
                    />
                  </div>
                )}

                {/* Tarjeta de Diagnóstico y Estado Financiero Actual */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">Estado de Riesgo POS</span>
                    {(() => {
                      const lim = parseFloat(formCredito.limite_credito || 0);
                      const deuda = parseFloat(clienteCreditoSeleccionado.deuda_total || 0);
                      if (lim === 0) {
                        return (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Solo Contado (Sin Crédito)
                          </span>
                        );
                      }
                      if (deuda > lim) {
                        return (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Bloqueado en POS (Excedido)
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Habilitado para Compras al Crédito
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Deuda Pendiente Actual</span>
                      <span className={`text-base font-black font-mono ${parseFloat(clienteCreditoSeleccionado.deuda_total || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        S/ {parseFloat(clienteCreditoSeleccionado.deuda_total || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Margen Libre Estimado</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        S/ {Math.max(0, (parseFloat(formCredito.limite_credito) || 0) - (parseFloat(clienteCreditoSeleccionado.deuda_total) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Atajo rápido si tiene deuda para ver detalle o cobrar */}
                  {parseFloat(clienteCreditoSeleccionado.deuda_total || 0) > 0 && (
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">¿Deseas revisar o amortizar deudas?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalAjusteCredito(false);
                          verFichaCliente(clienteCreditoSeleccionado.id);
                        }}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Ficha de Cuentas</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Límite de Crédito con Atajos */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tope / Límite Autorizado (S/.)</span>
                    <span className="text-[10px] font-bold text-slate-400 lowercase font-mono">0.00 = sin crédito</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-xs">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formCredito.limite_credito}
                      onChange={(e) => setFormCredito({ ...formCredito, limite_credito: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                    />
                  </div>
                  {/* Botones de sugerencia rápida */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                    {[0, 100, 200, 500, 1000, 2500].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => setFormCredito({ ...formCredito, limite_credito: monto })}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                          parseFloat(formCredito.limite_credito) === monto
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {monto === 0 ? 'Sin Línea (0)' : `S/ ${monto}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Días de Crédito (Plazo de Pago) */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Plazo de Pago Máximo (Días)</span>
                    <span className="text-[10px] font-bold text-slate-400 lowercase">vencimiento en ventanilla</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={formCredito.dias_credito}
                      onChange={(e) => setFormCredito({ ...formCredito, dias_credito: e.target.value })}
                      className="w-28 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                    />
                    <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
                      {[7, 15, 30, 45, 60].map((dias) => (
                        <button
                          key={dias}
                          type="button"
                          onClick={() => setFormCredito({ ...formCredito, dias_credito: dias })}
                          className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                            parseInt(formCredito.dias_credito) === dias
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {dias} días
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerta de bloqueo automático si la deuda excede el límite */}
                {parseFloat(clienteCreditoSeleccionado.deuda_total || 0) > parseFloat(formCredito.limite_credito || 0) && parseFloat(formCredito.limite_credito || 0) > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>La deuda actual (S/ {parseFloat(clienteCreditoSeleccionado.deuda_total).toFixed(2)}) supera el límite fijado. El cliente figurará <strong>bloqueado en POS</strong> hasta registrar abonos.</span>
                  </div>
                )}
              </div>

              {/* Pie Fijo con Botones de Acción */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAjusteCredito(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCredito}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {guardandoCredito ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Línea de Crédito</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL ESPECIALIZADO 2: GESTIÓN DE PUNTOS CLUB & FIDELIZACIÓN ─── */}
      {modalGestionPuntos && clientePuntosSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalGestionPuntos(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-[2.5px] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer font-sora"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 relative my-auto cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera Fija */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    Club de Puntos & Fidelización
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Socio: {clientePuntosSeleccionado.nombre} • {clientePuntosSeleccionado.tipo_documento}: {clientePuntosSeleccionado.numero_documento || 'S/D'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalGestionPuntos(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Formulario con cuerpo scrolleable y pie fijo */}
            {(() => {
              const actual = parseInt(clientePuntosSeleccionado.puntos_fidelidad) || 0;
              const delta = parseInt(puntosDelta) || 0;
              let nuevo = actual;
              if (tipoOperacionPuntos === 'SUMAR') nuevo = actual + delta;
              else if (tipoOperacionPuntos === 'RESTAR') nuevo = Math.max(0, actual - delta);
              else if (tipoOperacionPuntos === 'FIJAR') nuevo = Math.max(0, delta);

              const nivelActual = obtenerNivelVIP(actual);
              const nivelNuevo = obtenerNivelVIP(nuevo);

              // Cálculo de progreso al siguiente nivel
              let progreso = 0;
              let meta = 100;
              let faltan = 0;
              let proximoNivelNombre = 'VIP Plata';
              if (actual < 100) {
                progreso = Math.min(100, Math.round((actual / 100) * 100));
                meta = 100;
                faltan = 100 - actual;
                proximoNivelNombre = 'VIP Plata';
              } else if (actual < 500) {
                progreso = Math.min(100, Math.round(((actual - 100) / 400) * 100));
                meta = 500;
                faltan = 500 - actual;
                proximoNivelNombre = 'VIP Oro';
              } else {
                progreso = 100;
                faltan = 0;
                proximoNivelNombre = 'VIP Oro (Nivel Máximo)';
              }

              return (
                <form onSubmit={guardarGestionPuntos} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    {/* Selector rápido de socio del club con DropdownPill */}
                    {clientes.length > 1 && (
                      <div className="mb-1">
                        <DropdownPill
                          label="Cambiar Socio o Paciente del Club"
                          value={clientePuntosSeleccionado.id}
                          onChange={(val) => {
                            const id = parseInt(val);
                            const cl = clientes.find(c => c.id === id);
                            if (cl) abrirGestionPuntos(cl);
                          }}
                          options={clientes.map(c => ({
                            value: c.id,
                            label: c.nombre,
                            subtitle: `${c.tipo_documento}: ${c.numero_documento || '—'}${c.telefono ? ` • Tel: ${c.telefono}` : ''}`,
                            badge: `${parseInt(c.puntos_fidelidad) || 0} pts`
                          }))}
                          icon={Gift}
                          searchable={true}
                          searchPlaceholder="Buscar por nombre, DNI o RUC..."
                          placeholder="Seleccionar socio del club..."
                        />
                      </div>
                    )}

                    {/* Tarjeta de Saldo Actual y Nivel VIP (Tema Claro Farmacéutico) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 shadow-xs relative overflow-hidden space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-700 dark:text-indigo-400 block">
                            Saldo Actual de Puntos
                          </span>
                          <div className="flex items-baseline gap-2.5 mt-1">
                            <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                              {actual} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">pts</span>
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                              • S/ {(actual * 0.05).toFixed(2)} de descuento
                            </span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-2xs ${nivelActual.chip}`}>
                          <nivelActual.icon className="w-3.5 h-3.5" />
                          {nivelActual.nivel}
                        </span>
                      </div>

                      {/* Barra de Progreso hacia el Siguiente Nivel */}
                      <div className="pt-2.5 border-t border-indigo-100/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">
                            Progreso hacia <strong className="font-extrabold text-slate-800 dark:text-slate-100">{proximoNivelNombre}</strong>:
                          </span>
                          <span className="font-black text-indigo-700 dark:text-indigo-400">
                            {faltan > 0 ? `Faltan ${faltan} pts (${progreso}%)` : '¡Nivel Máximo VIP!'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reglas Comerciales Oficiales de Botica */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[11px]">
                        <p className="font-extrabold text-amber-800 dark:text-amber-300">Política de Fidelización Farmacéutica:</p>
                        <p>• <strong>Acumulación en Mostrador:</strong> 1 punto ganado por cada S/ 10.00 en compras en el POS.</p>
                        <p>• <strong>Canje Directo:</strong> 20 puntos equivalen a S/ 1.00 de descuento directo en compras (5% de retorno).</p>
                      </div>
                    </div>

                    {/* Selector de Operación */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Ajuste
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200/60 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setTipoOperacionPuntos('SUMAR')}
                          className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            tipoOperacionPuntos === 'SUMAR'
                              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-200/80 dark:border-indigo-800 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          + Bonificar
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoOperacionPuntos('RESTAR')}
                          className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            tipoOperacionPuntos === 'RESTAR'
                              ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs border border-rose-200/80 dark:border-rose-800 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          - Canjear / Restar
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoOperacionPuntos('FIJAR')}
                          className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                            tipoOperacionPuntos === 'FIJAR'
                              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-300 dark:border-slate-700 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          = Fijar Saldo
                        </button>
                      </div>
                    </div>

                    {/* Cantidad de Puntos */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Cantidad de Puntos
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={puntosDelta}
                        onChange={(e) => setPuntosDelta(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 font-mono shadow-2xs transition-all"
                      />
                      {/* Atajos Rápidos */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {[20, 50, 100, 200, 500].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setPuntosDelta(pts)}
                            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                          >
                            {tipoOperacionPuntos === 'SUMAR' ? `+${pts}` : pts} pts
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motivo o Concepto del Ajuste */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Motivo / Concepto del Ajuste
                      </label>
                      <input
                        type="text"
                        value={motivoPuntos}
                        onChange={(e) => setMotivoPuntos(e.target.value)}
                        placeholder="Ej. Bonificación de bienvenida, cortesía especial..."
                        className="w-full px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 shadow-2xs transition-all"
                      />
                      {/* Chips de Selección Rápida */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[
                          'Bonificación de bienvenida',
                          'Campaña Aniversario',
                          'Cortesía por compra especial',
                          'Compensación por demora',
                          'Canje manual en mostrador',
                          'Corrección de saldo'
                        ].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMotivoPuntos(m)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                              motivoPuntos === m
                                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-2xs'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Previsualización del Saldo Resultante (Tema Claro) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs shadow-2xs">
                      <div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300 block">
                          Nuevo Saldo Resultante:
                        </span>
                        <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-300">
                          {nuevo} pts <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">(S/ {(nuevo * 0.05).toFixed(2)} canjeables)</span>
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black border shadow-2xs ${nivelNuevo.chip}`}>
                        <nivelNuevo.icon className="w-3.5 h-3.5" />
                        {nivelNuevo.nivel}
                      </span>
                    </div>
                  </div>

                  {/* Pie Fijo con Botones de Comunicación y Acción */}
                  <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                    <div className="flex items-center gap-2">
                      {/* Botón WhatsApp */}
                      {clientePuntosSeleccionado.telefono && (
                        <button
                          type="button"
                          onClick={() => enviarWhatsAppPuntos(clientePuntosSeleccionado, nuevo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                          title="Enviar aviso de puntos acumulados por WhatsApp al cliente"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {/* Botón Imprimir Voucher */}
                      <button
                        type="button"
                        onClick={() => imprimirVoucherPuntos(clientePuntosSeleccionado, nuevo, motivoPuntos)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                        title="Imprimir ticket térmico de saldo de puntos para entregar en mostrador"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>Voucher</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalGestionPuntos(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={guardandoPuntos}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {guardandoPuntos ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Guardar Puntos</span>
                      </button>
                    </div>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL ESPECIALIZADO 3: SEGURIDAD CLÍNICA & FARMACOVIGILANCIA BPA ─── */}
      {modalFarmaco && clienteFarmacoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalFarmaco(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-[2.5px] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 relative my-auto cursor-default animate-in zoom-in-95 duration-200 font-sora max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera Fija */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    Ficha Clínica & Farmacovigilancia (BPA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Paciente: {clienteFarmacoSeleccionado.nombre} • {clienteFarmacoSeleccionado.tipo_documento}: {clienteFarmacoSeleccionado.numero_documento || 'S/D'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalFarmaco(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Formulario con cuerpo scrolleable y pie fijo */}
            <form onSubmit={guardarFarmacovigilancia} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {/* Selector rápido de paciente con DropdownPill */}
                {clientes.length > 1 && (
                  <div className="mb-1">
                    <DropdownPill
                      label="Cambiar Paciente a Evaluar"
                      value={clienteFarmacoSeleccionado.id}
                      onChange={(val) => {
                        const id = parseInt(val);
                        const cl = clientes.find(c => c.id === id);
                        if (cl) abrirFarmacovigilancia(cl);
                      }}
                      options={clientes.map(c => ({
                        value: c.id,
                        label: c.nombre,
                        subtitle: `${c.tipo_documento}: ${c.numero_documento || '—'}${c.alergias ? ` • Alergias: ${c.alergias}` : ''}`,
                        badge: c.alergias ? 'Alergia Registrada' : 'Sin Alergias'
                      }))}
                      icon={ShieldAlert}
                      searchable={true}
                      searchPlaceholder="Buscar por nombre, DNI o RUC..."
                      placeholder="Seleccionar paciente..."
                    />
                  </div>
                )}

                {/* Banner Dinámico de Estado de Seguridad en Mostrador POS */}
                {formFarmaco.alergias && formFarmaco.alergias.trim() ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-rose-800 dark:text-rose-300">
                          Alerta Activa en Mostrador POS:
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200/80 text-rose-800 border border-rose-300">
                          Advertencia en Dispensación
                        </span>
                      </div>
                      <p className="text-rose-700 dark:text-rose-400 text-[11px] leading-relaxed">
                        Al atender a este paciente en caja se emitirá advertencia visual por: <strong className="font-black text-rose-900 dark:text-rose-200">{formFarmaco.alergias}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">Sin alérgenos ni condiciones de riesgo declaradas.</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Paciente Seguro
                    </span>
                  </div>
                )}

                {/* 1. Alérgenos Medicamentosos de Alto Riesgo (BPA) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>1. Alérgenos Medicamentosos de Alto Riesgo (BPA)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormFarmaco({ ...formFarmaco, alergias: '' })}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      Limpiar Todo
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Haz clic sobre un medicamento para agregarlo o removerlo de la advertencia en caja:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALERGENOS_COMUNES.map((alergeno) => {
                      const seleccionado = (formFarmaco.alergias || '').toLowerCase().includes(alergeno.toLowerCase());
                      return (
                        <button
                          key={alergeno}
                          type="button"
                          onClick={() => toggleAlergenoEnForm(alergeno)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            seleccionado
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50/50'
                          }`}
                        >
                          <AlertTriangle className={`w-3 h-3 ${seleccionado ? 'text-white' : 'text-rose-500'}`} />
                          <span>{alergeno}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Condiciones Clínicas & Fisiológicas de Riesgo (BPA) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                      <span>2. Condiciones Especiales & Poblaciones Vulnerables (BPA)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Estados que requieren precaución farmacoterapéutica obligatoria en mostrador:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDICIONES_CLINICAS_COMUNES.map((condicion) => {
                      const seleccionada = (formFarmaco.alergias || '').toLowerCase().includes(condicion.toLowerCase());
                      return (
                        <button
                          key={condicion}
                          type="button"
                          onClick={() => toggleAlergenoEnForm(condicion)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            seleccionada
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-black'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <HeartPulse className={`w-3 h-3 ${seleccionada ? 'text-white' : 'text-purple-500'}`} />
                          <span>{condicion}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Campo de Alergias y Condiciones Médicas Personalizadas */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Texto Completo de Alergias & Condiciones Registradas
                  </label>
                  <input
                    type="text"
                    value={formFarmaco.alergias}
                    onChange={(e) => setFormFarmaco({ ...formFarmaco, alergias: e.target.value })}
                    placeholder="Ej. Penicilina, Ciprofloxacino, Gestante, Hipertensa..."
                    className="w-full px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950 shadow-2xs transition-all"
                  />
                </div>

                {/* 4. Fecha de Nacimiento y Grupo Etario */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <DatePickerPill
                        label="Fecha de Nacimiento"
                        value={formFarmaco.fecha_nacimiento}
                        onChange={(val) => setFormFarmaco({ ...formFarmaco, fecha_nacimiento: val })}
                        mode="nacimiento"
                        direction="down"
                        align="left"
                        placeholder="Seleccionar fecha..."
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Clasificación BPA</span>
                      {(() => {
                        const grupo = obtenerGrupoEtario(formFarmaco.fecha_nacimiento);
                        const edad = calcularEdad(formFarmaco.fecha_nacimiento);
                        return (
                          <div className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-2xs ${
                            grupo.grupo === 'Pediátrico'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                              : grupo.grupo === 'Adulto Mayor'
                              ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}>
                            {grupo.grupo === 'Pediátrico' ? <Baby className="w-4 h-4 text-amber-600" /> : grupo.grupo === 'Adulto Mayor' ? <HeartPulse className="w-4 h-4 text-purple-600" /> : <Smile className="w-4 h-4 text-emerald-600" />}
                            <span>{grupo.grupo} {edad ? `(${edad})` : ''}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Teléfono para Emergencias RAM */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Teléfono de Contacto Directo / Emergencia</span>
                    </label>
                    <input
                      type="text"
                      value={formFarmaco.telefono}
                      onChange={(e) => setFormFarmaco({ ...formFarmaco, telefono: e.target.value })}
                      placeholder="Ej. 984 512 340"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-950 shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Pie Fijo con Botones de Comunicación, Impresión y Acción */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Botón WhatsApp */}
                  {(formFarmaco.telefono || clienteFarmacoSeleccionado.telefono) && (
                    <button
                      type="button"
                      onClick={() => enviarWhatsAppFarmaco(
                        { ...clienteFarmacoSeleccionado, telefono: formFarmaco.telefono || clienteFarmacoSeleccionado.telefono },
                        formFarmaco.alergias,
                        formFarmaco.fecha_nacimiento
                      )}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                      title="Enviar resumen de ficha de seguridad por WhatsApp al paciente"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  {/* Botón Imprimir Carnet BPA */}
                  <button
                    type="button"
                    onClick={() => imprimirCarnetBPA(
                      clienteFarmacoSeleccionado,
                      formFarmaco.alergias,
                      formFarmaco.fecha_nacimiento,
                      formFarmaco.telefono || clienteFarmacoSeleccionado.telefono
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                    title="Imprimir carnet de alergias en ticket térmico 72mm para el paciente"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Carnet BPA</span>
                  </button>

                  {/* Botón Ver Compras Anteriores */}
                  <button
                    type="button"
                    onClick={() => abrirHistorialDesdeFarmaco(clienteFarmacoSeleccionado)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                    title="Revisar qué medicamentos ha adquirido previamente este paciente"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Compras</span>
                  </button>

                  {/* Botón Notificación RAM DIGEMID */}
                  <button
                    type="button"
                    onClick={abrirDigemidNotiRAM}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                    title="Acceso directo a portal de notificación de sospecha de Reacciones Adversas (VigiFlow / DIGEMID)"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <span>Noti-RAM</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalFarmaco(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoFarmaco}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {guardandoFarmaco ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Guardar Ficha BPA</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Visor e Impresión de Ticket Térmico de Venta */}
      {mostrarTicket && ventaParaTicket && (
        <TicketImpresion
          isOpen={mostrarTicket}
          onClose={() => setMostrarTicket(false)}
          alCerrar={() => setMostrarTicket(false)}
          venta={ventaParaTicket}
        />
      )}
    </div>
  );
}
