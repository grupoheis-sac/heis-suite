import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, Eye, ArrowRight } from 'lucide-react';
import { useCartStore } from './store/cartStore';
import { useSettingsStore } from '@heis/core';
import { useSucursalStore } from '@heis/core';
import api from './api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import ModalStockSucursales from './components/ModalStockSucursales';
import { TicketImpresion } from '@heis/ui';
import {
  notificarProductoAgregado,
  notificarCanjePuntos,
  notificarComprobanteEmitido
} from './utils/notificaciones';
import {
  POSCatalogo,
  POSTicket,
  POSModalDCI,
  POSModalPaciente,
  POSModalAtajos
} from './components/pos';


export default function POS() {
  const navigate = useNavigate();
  const {
    items,
    addItem,
    updateCantidad,
    removeItem,
    clearCart,
    tipoComprobante,
    setTipoComprobante,
    tipoPago,
    setTipoPago,
    numeroOperacion,
    setNumeroOperacion,
    medicoCmp,
    setMedicoCmp,
    descuento,
    setDescuento,
    puntosCanjeados,
    setPuntosCanjeados,
    montoRecibido,
    setMontoRecibido,
    creditoDias,
    setCreditoDias,
    requiereRecetaEnCarrito,
    getSubtotal,
    getTotal,
    getVuelto
  } = useCartStore();

  const [medicamentos, setMedicamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(() => {
    return sessionStorage.getItem('botica_caja_abierta') === 'true';
  });
  const [verificandoCaja, setVerificandoCaja] = useState(() => {
    return sessionStorage.getItem('botica_caja_abierta') === null;
  });
  const [modoSoloConsulta, setModoSoloConsulta] = useState(false);
  const [montoAperturaRapida, setMontoAperturaRapida] = useState('0.00');
  const [abriendoCaja, setAbriendoCaja] = useState(false);

  // Filtro de categorías farmacéuticas por colores + filtros clínicos
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // Panel inline de cobro y emisión en el ticket derecho (0 modales)
  const [modoCobroActivo, setModoCobroActivo] = useState(false);

  // Estados para Pago Mixto / Combinado (Efectivo + Yape + Plin + Tarjeta)
  const [montoMixtoEfectivo, setMontoMixtoEfectivo] = useState('');
  const [efectivoRecibidoMixto, setEfectivoRecibidoMixto] = useState('');
  const [montoMixtoYape, setMontoMixtoYape] = useState('');
  const [montoMixtoPlin, setMontoMixtoPlin] = useState('');
  const [montoMixtoTarjeta, setMontoMixtoTarjeta] = useState('');
  const [operacionMixtoYape, setOperacionMixtoYape] = useState('');
  const [operacionMixtoPlin, setOperacionMixtoPlin] = useState('');
  const [operacionMixtoTarjeta, setOperacionMixtoTarjeta] = useState('');

  // Estado para ticket térmico emitido (muestra estado post-emisión inline)
  const [ticketVenta, setTicketVenta] = useState(null);

  const handleNuevaVenta = () => {
    setTicketVenta(null);
    setModoCobroActivo(false);
    clearCart();
    setIdCliente('');
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setMontoRecibido('');
    setNumeroOperacion('');
    setMontoMixtoEfectivo('');
    setEfectivoRecibidoMixto('');
    setMontoMixtoYape('');
    setMontoMixtoPlin('');
    setMontoMixtoTarjeta('');
    setOperacionMixtoYape('');
    setOperacionMixtoPlin('');
    setOperacionMixtoTarjeta('');
    setTimeout(() => {
      const el = searchInputRef.current || document.getElementById('pos-barcode-input');
      el?.focus();
    }, 50);
  };

  const settings = useSettingsStore();
  const { sucursalActiva } = useSucursalStore();

  // Estado para consulta de stock en otras sucursales
  const [modalStockMedId, setModalStockMedId] = useState(null);
  const [mostrarModalStockSedes, setMostrarModalStockSedes] = useState(false);

  const handleConsultarStockSedes = (idMed) => {
    setModalStockMedId(idMed);
    setMostrarModalStockSedes(true);
  };

  // Estado para modal de Genéricos Bioequivalentes DCI (Art. 32 Ley 29459)
  const [mostrarModalDci, setMostrarModalDci] = useState(false);
  const [medicamentoDciSeleccionado, setMedicamentoDciSeleccionado] = useState(null);

  // Estado para registro rápido de paciente (RENIEC / SUNAT)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoClienteTipoDoc, setNuevoClienteTipoDoc] = useState('DNI');
  const [nuevoClienteNumDoc, setNuevoClienteNumDoc] = useState('');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState('');
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('');
  const [consultandoDoc, setConsultandoDoc] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [mostrarModalAtajos, setMostrarModalAtajos] = useState(false);
  const [mostrarModalTicket, setMostrarModalTicket] = useState(false);

  const searchInputRef = useRef(null);
  const isFirstRender = useRef(true);

  const cargarDatos = async () => {
    // 1. Verificación instantánea e independiente de caja (sin esperar catálogo de medicamentos ni clientes)
    const promesaCaja = api.get('/caja/actual')
      .then((resCaja) => {
        const dataCaja = resCaja?.data || resCaja;
        if (dataCaja?.success !== undefined) {
          const abierta = Boolean(dataCaja.cajaAbierta);
          setCajaAbierta(abierta);
          sessionStorage.setItem('botica_caja_abierta', String(abierta));
          if (abierta) {
            setModoSoloConsulta(false);
          }
        }
      })
      .catch(() => {
        // En caso de corte momentáneo de red, mantiene el estado previo seguro
      })
      .finally(() => {
        setVerificandoCaja(false);
      });

    // 2. Carga en paralelo del catálogo de medicamentos y clientes
    try {
      const [resMed, resClientes] = await Promise.all([
        api.get('/medicamentos?limit=40'),
        api.get('/clientes?limit=100').catch(() => null)
      ]);
      const listaMed = resMed?.medicamentos || resMed?.data || [];
      if (resMed?.success && Array.isArray(listaMed)) {
        setMedicamentos(listaMed);
      } else {
        setMedicamentos([]);
      }
      if (resClientes?.success && Array.isArray(resClientes.clientes)) {
        setClientes(resClientes.clientes);
      } else {
        setClientes([]);
      }
    } catch (e) {
      setMedicamentos([]);
      setClientes([]);
    }

    await promesaCaja;
  };

  const handleAperturarCajaRapida = async (e) => {
    e?.preventDefault?.();
    const monto = parseFloat(montoAperturaRapida === '' ? 0 : montoAperturaRapida);
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingrese un monto inicial válido (mínimo S/ 0.00).');
      return;
    }
    setAbriendoCaja(true);
    try {
      const res = await api.post('/caja/abrir', { monto_inicial: monto });
      const data = res?.data || res;
      if (data?.success) {
        toast.success('¡Turno de caja aperturado con éxito!');
        setCajaAbierta(true);
        sessionStorage.setItem('botica_caja_abierta', 'true');
        setModoSoloConsulta(false);
        window.dispatchEvent(new CustomEvent('caja-status-changed', { detail: { open: true } }));
        await cargarDatos();
      } else {
        toast.error(data?.message || 'Error al aperturar caja.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err?.message || 'Error al aperturar caja.');
    } finally {
      setAbriendoCaja(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const handleCajaChanged = () => {
      cargarDatos();
    };
    window.addEventListener('caja-status-changed', handleCajaChanged);
    return () => window.removeEventListener('caja-status-changed', handleCajaChanged);
  }, []);

  // Búsqueda en tiempo real de clientes en el backend (por DNI, RUC o Nombre)
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (!q || clienteSeleccionado) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/clientes?busqueda=${encodeURIComponent(q)}&limit=25`);
        if (res?.success && res.clientes) {
          setClientes((prev) => {
            const map = new Map();
            res.clientes.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
      } catch (e) {
        // En modo offline mantiene los clientes locales
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaCliente, clienteSeleccionado]);

  // Búsqueda en tiempo real de medicamentos por Marca o Principio Activo
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounce = setTimeout(async () => {
      if (busqueda.trim().length === 0) {
        cargarDatos();
        return;
      }
      setCargando(true);
      try {
        const res = await api.get(`/medicamentos?busqueda=${encodeURIComponent(busqueda)}&limit=40`);
        const listaMed = res?.medicamentos || res?.data || [];
        if (res?.success && Array.isArray(listaMed)) {
          setMedicamentos(listaMed);
        } else {
          setMedicamentos([]);
        }
      } catch (e) {
        setMedicamentos([]);
      } finally {
        setCargando(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [busqueda]);

  // Auto-selección inteligente de comprobante (RUC -> Factura, DNI/General -> Boleta)
  useEffect(() => {
    if (clienteSeleccionado) {
      if (clienteSeleccionado.tipo_documento === 'RUC') {
        setTipoComprobante('Factura');
      } else {
        setTipoComprobante('Boleta');
      }
    }
  }, [clienteSeleccionado, setTipoComprobante]);

  // Filtrado reactivo de medicamentos por categoría clínica, categoría farmacéutica o FEFO
  const medicamentosFiltrados = useMemo(() => {
    let list = medicamentos;
    if (filtroCategoria === 'TODOS') {
      return list;
    }
    if (filtroCategoria === 'RECETA') {
      return list.filter((m) => m.requiere_receta);
    }
    if (filtroCategoria === 'FRACCION') {
      return list.filter((m) => m.fraccionable && parseFloat(m.precio_fraccion || 0) > 0);
    }
    if (filtroCategoria === 'FEFO') {
      return [...list].sort((a, b) => {
        const vA = a.lotes?.[0]?.fecha_vencimiento || '9999-12-31';
        const vB = b.lotes?.[0]?.fecha_vencimiento || '9999-12-31';
        return vA.localeCompare(vB);
      });
    }

    // Filtrar por nombre de categoría farmacéutica o ID de categoría
    return list.filter((m) => {
      const catNombre = typeof m.categoria === 'object' ? m.categoria?.nombre : m.categoria;
      if (catNombre && catNombre.trim().toLowerCase() === filtroCategoria.trim().toLowerCase()) {
        return true;
      }
      if (m.id_categoria && String(m.id_categoria) === String(filtroCategoria)) {
        return true;
      }
      return false;
    });
  }, [medicamentos, filtroCategoria]);

  // Detección inteligente de DNI/RUC en la píldora de búsqueda principal
  const clienteDetectadoEnBarra = useMemo(() => {
    const q = busqueda.trim();
    if (!q || q.length < 5) return null;
    return clientes.find(
      (c) => c.numero_documento && c.numero_documento.toLowerCase() === q.toLowerCase()
    );
  }, [busqueda, clientes]);

  const esDocumentoEnBarra = useMemo(() => {
    const q = busqueda.trim();
    if (!(/^\d{8}$/.test(q) || /^\d{11}$/.test(q))) return false;
    // Si coincide con un código de barras de un medicamento existente en el catálogo, no tratarlo como DNI/RUC
    const esMedicamento = medicamentos.some((m) => m.codigo_barras && m.codigo_barras.trim() === q);
    return !esMedicamento;
  }, [busqueda, medicamentos]);

  // Filtros para la píldora de búsqueda de cliente/paciente
  const qCliente = busquedaCliente.trim().toLowerCase();
  const esDniValido = /^\d{8}$/.test(qCliente);
  const esRucValido = /^\d{11}$/.test(qCliente);
  const esDocumentoBuscado = esDniValido || esRucValido;

  const clientesFiltrados = useMemo(() => {
    if (!qCliente) return clientes.slice(0, 10);
    return clientes.filter((c) => {
      const matchNom = c.nombre?.toLowerCase().includes(qCliente);
      const matchDoc = c.numero_documento?.toLowerCase().includes(qCliente);
      const matchTel = c.telefono?.includes(qCliente);
      return matchNom || matchDoc || matchTel;
    }).slice(0, 10);
  }, [clientes, qCliente]);

  const clienteExisteExacto = useMemo(() => {
    if (!qCliente) return null;
    return clientes.find(
      (c) => c.numero_documento && c.numero_documento.toLowerCase() === qCliente
    );
  }, [clientes, qCliente]);

  const handleBarcodeSubmit = async (e) => {
    e?.preventDefault?.();
    if (!cajaAbierta && !modoSoloConsulta) {
      toast.error('Debe aperturar un turno de caja para utilizar el lector de barras.');
      return;
    }
    const q = busqueda.trim();
    if (!q) return;

    // 1. PRIORIDAD MÁXIMA PARA PISTOLAS: Buscar por código de barras de medicamento
    try {
      const res = await api.get(`/medicamentos/codigo/${encodeURIComponent(q)}`);
      if (res?.success && res.medicamento) {
        addItem(res.medicamento, 'Caja', 1, res.medicamento.lotes?.[0]);
        notificarProductoAgregado({
          nombre: res.medicamento.nombre_comercial,
          formato: 'Caja',
          cantidad: 1,
          precio: res.medicamento.precio_venta
        });
        setBusqueda('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }
    } catch (err) {
      // Buscar en catálogo local cargado en memoria por código de barras
      const medLocal = medicamentos.find(
        (m) => m.codigo_barras && m.codigo_barras.trim() === q
      );
      if (medLocal) {
        addItem(medLocal, 'Caja', 1, medLocal.lotes?.[0]);
        notificarProductoAgregado({
          nombre: medLocal.nombre_comercial,
          formato: 'Caja',
          cantidad: 1,
          precio: medLocal.precio_venta
        });
        setBusqueda('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }
    }

    // 2. Si coincide con un cliente existente por DNI o RUC
    const clientePorDoc = clientes.find(
      (c) => c.numero_documento && c.numero_documento.toLowerCase() === q.toLowerCase()
    );
    if (clientePorDoc) {
      setClienteSeleccionado(clientePorDoc);
      setIdCliente(clientePorDoc.id.toString());
      setBusqueda('');
      toast.success(
        `Cliente ${clientePorDoc.nombre} asignado (${clientePorDoc.puntos_fidelidad || 0} pts de canje)`
      );
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    // 3. Si es un DNI (8 dígitos) o RUC (11 dígitos) y no está en clientes: abrir registro con RENIEC/SUNAT
    const esDni = /^\d{8}$/.test(q);
    const esRuc = /^\d{11}$/.test(q);
    if (esDni || esRuc) {
      abrirRegistroRapidoConDoc(q);
      setBusqueda('');
      return;
    }

    // 4. Si el usuario escribió un término de búsqueda (ej. "paracetamol") y presionó Enter
    const qLower = q.toLowerCase();
    const medExacto = medicamentosFiltrados.find(
      (m) =>
        m.nombre_comercial.toLowerCase() === qLower ||
        m.nombre_generico?.toLowerCase() === qLower
    );
    const medCoincidente = medExacto || medicamentosFiltrados.find(
      (m) =>
        m.nombre_comercial.toLowerCase().includes(qLower) ||
        m.nombre_generico?.toLowerCase().includes(qLower)
    );

    if (medCoincidente) {
      addItem(medCoincidente, 'Caja', 1, medCoincidente.lotes?.[0]);
      notificarProductoAgregado({
        nombre: medCoincidente.nombre_comercial,
        formato: 'Caja',
        cantidad: 1,
        precio: medCoincidente.precio_venta
      });
      setBusqueda('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      toast.error(`No se encontró medicamento ni código de barras "${q}"`);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const abrirModalDci = (med) => {
    setMedicamentoDciSeleccionado(med);
    setMostrarModalDci(true);
  };

  const genericosEquivalentes = useMemo(() => {
    if (!medicamentoDciSeleccionado?.nombre_generico) return [];
    const baseGen = medicamentoDciSeleccionado.nombre_generico.trim().toLowerCase();
    const primerTermino = baseGen.split(' ')[0];
    return medicamentos.filter(
      (m) =>
        m.id !== medicamentoDciSeleccionado.id &&
        m.nombre_generico &&
        m.nombre_generico.toLowerCase().includes(primerTermino)
    );
  }, [medicamentoDciSeleccionado, medicamentos]);

  const handleConsultarDocumento = async (docParam, tipoParam) => {
    const tipo = tipoParam || nuevoClienteTipoDoc;
    const doc = (docParam !== undefined ? docParam : nuevoClienteNumDoc).toString().trim();
    if (!doc) {
      toast.error('Ingrese un número de documento.');
      return;
    }
    if (tipo === 'DNI' && doc.length !== 8) {
      toast.error('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (tipo === 'RUC' && doc.length !== 11) {
      toast.error('El RUC debe tener exactamente 11 dígitos.');
      return;
    }

    setConsultandoDoc(true);
    try {
      if (tipo === 'DNI') {
        const res = await api.get(`/consultas/dni/${doc}`);
        const dataDoc = res?.data?.data || res?.data;
        if (res?.success && dataDoc) {
          const nombreCompleto = dataDoc.nombre_completo || dataDoc.nombres || '';
          setNuevoClienteNombre(nombreCompleto);
          toast.success(`RENIEC Oficial: ${nombreCompleto}`);
        } else {
          toast.error(res?.message || 'No se encontró el DNI en RENIEC');
        }
      } else {
        const res = await api.get(`/consultas/ruc/${doc}`);
        const dataRuc = res?.data?.data || res?.data;
        if (res?.success && dataRuc) {
          const razonSocial = dataRuc.razon_social || '';
          setNuevoClienteNombre(razonSocial);
          if (dataRuc.direccion) setNuevoClienteDireccion(dataRuc.direccion);
          toast.success(`SUNAT Oficial: ${razonSocial}`);
        } else {
          toast.error(res?.message || 'No se encontró el RUC en SUNAT');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al consultar documento';
      toast.error(msg);
    } finally {
      setConsultandoDoc(false);
    }
  };

  const abrirRegistroRapidoConDoc = (docRaw = '') => {
    const cleanDoc = docRaw.toString().replace(/\D/g, '').trim();
    const esRuc = cleanDoc.length === 11;
    const tipo = esRuc ? 'RUC' : 'DNI';
    setNuevoClienteTipoDoc(tipo);
    setNuevoClienteNumDoc(cleanDoc);
    setNuevoClienteNombre('');
    setNuevoClienteDireccion('');
    setNuevoClienteTelefono('');
    setMostrarNuevoCliente(true);
    setMostrarDropdownClientes(false);
    if ((tipo === 'DNI' && cleanDoc.length === 8) || (tipo === 'RUC' && cleanDoc.length === 11)) {
      handleConsultarDocumento(cleanDoc, tipo);
    }
  };

  const handleGuardarNuevoCliente = async (e) => {
    e.preventDefault();
    if (!nuevoClienteNombre.trim()) {
      toast.error('Ingrese o consulte el nombre del paciente.');
      return;
    }
    setGuardandoCliente(true);
    try {
      const payload = {
        tipo_documento: nuevoClienteTipoDoc,
        numero_documento: nuevoClienteNumDoc.trim(),
        nombre: nuevoClienteNombre.trim(),
        direccion: nuevoClienteDireccion.trim(),
        telefono: nuevoClienteTelefono.trim()
      };
      const res = await api.post('/clientes', payload);
      if (res?.success && res.cliente) {
        setClientes((prev) => [res.cliente, ...prev]);
        setClienteSeleccionado(res.cliente);
        setIdCliente(res.cliente.id.toString());
        setMostrarNuevoCliente(false);
        setNuevoClienteNumDoc('');
        setNuevoClienteNombre('');
        setNuevoClienteDireccion('');
        setNuevoClienteTelefono('');
        toast.success(`Paciente ${res.cliente.nombre} registrado y seleccionado para la venta.`);
      } else {
        // Fallback operativo seguro
        const nuevoSimulado = {
          id: Date.now(),
          ...payload,
          puntos_fidelidad: 0
        };
        setClientes((prev) => [nuevoSimulado, ...prev]);
        setClienteSeleccionado(nuevoSimulado);
        setIdCliente(nuevoSimulado.id.toString());
        setMostrarNuevoCliente(false);
        setNuevoClienteNumDoc('');
        setNuevoClienteNombre('');
        setNuevoClienteDireccion('');
        setNuevoClienteTelefono('');
        toast.success(`Paciente ${nuevoSimulado.nombre} agregado y seleccionado.`);
      }
    } catch (err) {
      const nuevoSimulado = {
        id: Date.now(),
        tipo_documento: nuevoClienteTipoDoc,
        numero_documento: nuevoClienteNumDoc.trim(),
        nombre: nuevoClienteNombre.trim(),
        direccion: nuevoClienteDireccion.trim(),
        telefono: nuevoClienteTelefono.trim(),
        puntos_fidelidad: 0
      };
      setClientes((prev) => [nuevoSimulado, ...prev]);
      setClienteSeleccionado(nuevoSimulado);
      setIdCliente(nuevoSimulado.id.toString());
      setMostrarNuevoCliente(false);
      setNuevoClienteNumDoc('');
      setNuevoClienteNombre('');
      setNuevoClienteDireccion('');
      setNuevoClienteTelefono('');
      toast.success(`Paciente ${nuevoSimulado.nombre} guardado y seleccionado.`);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Puntos disponibles del cliente seleccionado
  const puntosDisponibles = clienteSeleccionado?.puntos_fidelidad || 0;
  // Regla: 10 puntos = S/ 1.00 de descuento
  const maximoDescuentoPorPuntos = Math.min(
    getSubtotal(),
    parseFloat((puntosDisponibles / 10).toFixed(2))
  );

  const toggleCanjearPuntos = () => {
    if (puntosCanjeados > 0) {
      setPuntosCanjeados(0);
      setDescuento(0);
      notificarCanjePuntos({ descuento: 0, puntos: 0, descartado: true });
    } else {
      if (maximoDescuentoPorPuntos <= 0) {
        toast.error('El paciente no tiene suficientes puntos para canjear.');
        return;
      }
      const pts = Math.round(maximoDescuentoPorPuntos * 10);
      setPuntosCanjeados(pts);
      setDescuento(maximoDescuentoPorPuntos);
      notificarCanjePuntos({ descuento: maximoDescuentoPorPuntos, puntos: pts });
    }
  };

  const total = getTotal();
  const vuelto = getVuelto();
  const necesitaReceta = requiereRecetaEnCarrito();

  // Cálculos reactivos de Pago Mixto / Combinado (Efectivo + Yape + Plin + Tarjeta)
  const numEfectivo = parseFloat(montoMixtoEfectivo) || 0;
  const numYape = parseFloat(montoMixtoYape) || 0;
  const numPlin = parseFloat(montoMixtoPlin) || 0;
  const numTarjeta = parseFloat(montoMixtoTarjeta) || 0;
  const totalAsignadoMixto = parseFloat((numEfectivo + numYape + numPlin + numTarjeta).toFixed(2));
  const saldoPendienteMixto = Math.max(0, parseFloat((total - totalAsignadoMixto).toFixed(2)));
  const vueltoEfectivoMixto = Math.max(
    0,
    parseFloat(((parseFloat(efectivoRecibidoMixto) || numEfectivo) - numEfectivo).toFixed(2))
  );

  const handleCobrar = async () => {
    if (items.length === 0) {
      toast.error('El carrito de dispensación está vacío.');
      return;
    }

    if (!cajaAbierta) {
      toast.error('La caja chica se encuentra cerrada. Debe aperturar un turno de caja antes de realizar ventas.');
      setModoSoloConsulta(false);
      return;
    }

    const totalVenta = total;
    if (totalVenta <= 0) {
      toast.error('El total a cobrar debe ser mayor a S/ 0.00.');
      return;
    }

    // 1. Validación de Efectivo: monto recibido no puede ser vacío, 0 o menor al total
    let montoRecibidoFinal = totalVenta;
    let vueltoFinal = 0;

    if (tipoPago === 'Efectivo') {
      const rawRec = montoRecibido;
      const numRec = (rawRec !== '' && rawRec !== null && rawRec !== undefined)
        ? parseFloat(rawRec)
        : null;

      if (numRec === null || isNaN(numRec) || numRec < totalVenta - 0.009 || numRec <= 0) {
        const recibidoMostrado = (numRec === null || isNaN(numRec)) ? 0 : Math.max(0, numRec);
        const faltante = (totalVenta - recibidoMostrado).toFixed(2);
        toast.error(`Monto en efectivo recibido insuficiente. El paciente entregó S/ ${recibidoMostrado.toFixed(2)} y faltan S/ ${faltante} para cubrir el total de S/ ${totalVenta.toFixed(2)}.`);
        return;
      }

      montoRecibidoFinal = numRec;
      vueltoFinal = Math.max(0, parseFloat((numRec - totalVenta).toFixed(2)));
    }

    // 2. Validación de Pago Mixto
    if (tipoPago === 'Mixto') {
      if (Math.abs(totalVenta - totalAsignadoMixto) > 0.01 || totalAsignadoMixto === 0) {
        toast.error(`El pago mixto está incompleto. Faltan asignar S/ ${saldoPendienteMixto.toFixed(2)}.`);
        return;
      }

      if (numEfectivo > 0 && efectivoRecibidoMixto !== '' && parseFloat(efectivoRecibidoMixto) < numEfectivo - 0.009) {
        const faltanteEfec = (numEfectivo - parseFloat(efectivoRecibidoMixto)).toFixed(2);
        toast.error(`Efectivo recibido en pago mixto insuficiente. Faltan S/ ${faltanteEfec}.`);
        return;
      }
    }

    if (requiereRecetaEnCarrito() && !medicoCmp.trim()) {
      toast.error('Uno o más medicamentos requieren receta médica. Ingrese el CMP del doctor.');
      return;
    }

    if (tipoPago === 'Credito' && !idCliente) {
      toast.error('Para ventas a crédito debe seleccionar un cliente registrado.');
      return;
    }

    setProcesandoVenta(true);
    try {
      let montoEfectivoFinal = null;
      let montoDigitalFinal = null;
      let numeroOperacionFinal = numeroOperacion || null;
      let notasFinal = null;

      if (tipoPago === 'Mixto') {
        montoEfectivoFinal = numEfectivo;
        montoDigitalFinal = parseFloat((numYape + numPlin + numTarjeta).toFixed(2));
        const parts = [];
        if (numEfectivo > 0) parts.push(`Efectivo: S/ ${numEfectivo.toFixed(2)}`);
        if (numYape > 0) parts.push(`Yape: S/ ${numYape.toFixed(2)}${operacionMixtoYape ? ` (Op: ${operacionMixtoYape})` : ''}`);
        if (numPlin > 0) parts.push(`Plin: S/ ${numPlin.toFixed(2)}${operacionMixtoPlin ? ` (Op: ${operacionMixtoPlin})` : ''}`);
        if (numTarjeta > 0) parts.push(`Tarjeta: S/ ${numTarjeta.toFixed(2)}${operacionMixtoTarjeta ? ` (Ref: ${operacionMixtoTarjeta})` : ''}`);
        notasFinal = `Pago Mixto [${parts.join(' + ')}]`;
        numeroOperacionFinal = [
          operacionMixtoYape ? `Yape:${operacionMixtoYape}` : '',
          operacionMixtoPlin ? `Plin:${operacionMixtoPlin}` : '',
          operacionMixtoTarjeta ? `POS:${operacionMixtoTarjeta}` : ''
        ].filter(Boolean).join(' | ') || null;
        montoRecibidoFinal = parseFloat(((parseFloat(efectivoRecibidoMixto) || numEfectivo) + numYape + numPlin + numTarjeta).toFixed(2));
        vueltoFinal = vueltoEfectivoMixto;
      }

      const payload = {
        tipo_comprobante: tipoComprobante,
        id_cliente: idCliente ? parseInt(idCliente) : null,
        tipo_pago: tipoPago,
        numero_operacion: numeroOperacionFinal,
        monto_efectivo: montoEfectivoFinal,
        monto_digital: montoDigitalFinal,
        notas: notasFinal,
        medico_cmp: medicoCmp || null,
        items: items.map((i) => ({
          id_medicamento: i.id_medicamento,
          id_lote: i.id_lote,
          formato_venta: i.formato_venta,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        })),
        monto_recibido: montoRecibidoFinal,
        descuento,
        puntos_canjeados: puntosCanjeados,
        credito_dias: creditoDias,
        id_sucursal: sucursalActiva?.id || 1,
        config_sunat: {
          activa: settings.facturacionElectronicaActiva,
          modo: settings.modoSunat,
          proveedor: settings.sunatProveedor,
          apiUrl: settings.sunatApiUrl,
          token: settings.sunatToken,
          serieBoleta: sucursalActiva?.serie_boleta || settings.serieBoleta,
          serieFactura: sucursalActiva?.serie_factura || settings.serieFactura
        }
      };

      const res = await api.post('/ventas', payload);
      const ventaData = res?.venta || res?.data?.venta || res;

      if (res?.success || ventaData?.id) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        notificarComprobanteEmitido({
          numero: ventaData?.numero || 'B001-000001',
          tipo: ventaData?.tipo_comprobante || tipoComprobante,
          total: totalVenta,
          cliente: clienteSeleccionado?.nombre
        });

        // Preparar datos para el ticket térmico con trazabilidad SUNAT
        setTicketVenta({
          ...ventaData,
          numero: ventaData?.numero || 'B001-000001',
          serie: ventaData?.serie || (tipoComprobante === 'Factura' ? 'F001' : 'B001'),
          tipo_comprobante: ventaData?.tipo_comprobante || tipoComprobante,
          detalles: items.map((i) => ({
            cantidad: i.cantidad,
            formato_venta: i.formato_venta,
            medicamento: { nombre_comercial: i.nombre || i.nombre_comercial },
            lote: { numero_lote: i.numero_lote || 'FEFO', fecha_vencimiento: i.fecha_vencimiento || null },
            precio_unitario: i.precio_unitario,
            subtotal: i.subtotal
          })),
          cliente: clienteSeleccionado,
          tipo_pago: tipoPago,
          monto_efectivo: montoEfectivoFinal,
          monto_digital: montoDigitalFinal,
          total: totalVenta,
          monto_recibido: montoRecibidoFinal,
          vuelto: vueltoFinal,
          notas: notasFinal,
          sunat_hash: ventaData?.sunat_hash,
          sunat_qr: ventaData?.sunat_qr,
          enlace_pdf: ventaData?.enlace_pdf,
          enlace_xml: ventaData?.enlace_xml,
          created_at: ventaData?.created_at || new Date().toISOString()
        });
        setMostrarModalTicket(true);
        clearCart();
        cargarDatos();
      } else {
        toast.error(res?.message || 'No se pudo registrar la venta.');
      }
    } catch (error) {
      console.error('Error en venta server:', error);
      const msg = error?.response?.data?.message || error?.message || 'Error al procesar la venta en el servidor.';
      toast.error(msg);
    } finally {
      setProcesandoVenta(false);
    }
  };

  // ⌨️ Manejo de Atajos de Teclado F1, F2, F4, F8, F9, ESC (+ compatibilidad laptops Fn / Ctrl / Alt)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isF1 = e.key === 'F1' || e.code === 'F1' || e.keyCode === 112 || (e.altKey && e.key.toLowerCase() === 'h');
      const isF2 = e.key === 'F2' || e.code === 'F2' || e.keyCode === 113 || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k');
      const isF4 = e.key === 'F4' || e.code === 'F4' || e.keyCode === 115 || (e.altKey && e.key.toLowerCase() === 'n');
      const isF8 = e.key === 'F8' || e.code === 'F8' || e.keyCode === 119 || (e.altKey && e.key.toLowerCase() === 'c');
      const isF9 = e.key === 'F9' || e.code === 'F9' || e.keyCode === 120 || (e.altKey && e.key.toLowerCase() === 'l');
      const isEsc = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape' || e.keyCode === 27;

      // F1 o Alt+H: Ver / Ocultar modal de atajos de teclado
      if (isF1) {
        e.preventDefault();
        e.stopPropagation();
        setMostrarModalAtajos((prev) => !prev);
        return;
      }

      // F2 o Ctrl+K: Enfocar buscador / lector de barras o nueva venta
      if (isF2) {
        e.preventDefault();
        e.stopPropagation();
        if (ticketVenta) {
          handleNuevaVenta();
        } else {
          const el = searchInputRef.current || document.getElementById('pos-barcode-input');
          el?.focus();
          el?.select();
        }
        return;
      }

      // Auto-enfoque inteligente para pistolas de código de barras:
      // Si el usuario pistolea cuando el foco no está en un input y no hay modales abiertos,
      // enfocar automáticamente el campo de búsqueda para que la pistola no pierda caracteres.
      const hayModalAbierto =
        mostrarModalAtajos ||
        mostrarModalDci ||
        mostrarNuevoCliente ||
        mostrarDropdownClientes ||
        mostrarModalStockSedes;

      const tagActivo = document.activeElement?.tagName?.toLowerCase();
      const estaEnInput = ['input', 'textarea', 'select'].includes(tagActivo) || document.activeElement?.isContentEditable;

      if (!hayModalAbierto && !estaEnInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
        const el = searchInputRef.current || document.getElementById('pos-barcode-input');
        el?.focus();
      }

      // F4 o Alt+N: Abrir registro rápido de paciente / selector
      if (isF4) {
        e.preventDefault();
        e.stopPropagation();
        setMostrarNuevoCliente((prev) => !prev);
        return;
      }

      // F8 o Alt+C: Cobrar venta / Abrir panel inline de cobro
      if (isF8) {
        e.preventDefault();
        e.stopPropagation();
        if (ticketVenta) {
          handleNuevaVenta();
          return;
        }
        if (items.length === 0) {
          toast.error('El carrito de dispensación está vacío.');
          return;
        }
        if (!cajaAbierta) {
          toast.error('La caja chica se encuentra cerrada. Debe aperturar un turno antes de cobrar.');
          setModoSoloConsulta(false);
          return;
        }
        if (modoCobroActivo) {
          if (!procesandoVenta) {
            handleCobrar();
          }
        } else {
          setModoCobroActivo(true);
        }
        return;
      }

      // Enter cuando el panel inline de cobro está activo o hay venta completada
      if (e.key === 'Enter' || e.code === 'Enter') {
        if (ticketVenta) {
          e.preventDefault();
          e.stopPropagation();
          handleNuevaVenta();
          return;
        }
        if (modoCobroActivo && !procesandoVenta) {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag !== 'textarea') {
            e.preventDefault();
            e.stopPropagation();
            handleCobrar();
            return;
          }
        }
      }

      // F9 o Alt+L: Limpiar carrito
      if (isF9) {
        e.preventDefault();
        e.stopPropagation();
        if (items.length > 0) {
          clearCart();
          toast('Carrito vaciado exitosamente', { icon: '🧹' });
        }
        return;
      }

      // Escape: Cerrar modales o volver al carrito
      if (isEsc) {
        e.preventDefault();
        e.stopPropagation();
        if (mostrarModalAtajos) {
          setMostrarModalAtajos(false);
        } else if (ticketVenta) {
          handleNuevaVenta();
        } else if (mostrarModalDci) {
          setMostrarModalDci(false);
        } else if (mostrarNuevoCliente) {
          setMostrarNuevoCliente(false);
        } else if (mostrarDropdownClientes) {
          setMostrarDropdownClientes(false);
        } else if (mostrarModalStockSedes) {
          setMostrarModalStockSedes(false);
        } else if (modoCobroActivo) {
          setModoCobroActivo(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    items,
    tipoPago,
    cajaAbierta,
    medicoCmp,
    idCliente,
    montoRecibido,
    descuento,
    puntosCanjeados,
    creditoDias,
    procesandoVenta,
    modoCobroActivo,
    ticketVenta,
    mostrarModalDci,
    mostrarNuevoCliente,
    mostrarDropdownClientes,
    mostrarModalStockSedes,
    mostrarModalAtajos,
    saldoPendienteMixto,
    totalAsignadoMixto,
    montoMixtoEfectivo,
    montoMixtoYape,
    montoMixtoTarjeta,
    efectivoRecibidoMixto,
    operacionMixtoYape,
    operacionMixtoTarjeta
  ]);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* ─── BANNER DE ADVERTENCIA: MODO CONSULTA (SI LA CAJA ESTÁ CERRADA Y EL USUARIO DECIDE SOLO CONSULTAR) ─── */}
      {!cajaAbierta && !verificandoCaja && modoSoloConsulta && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-xs shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
              Turno de Caja Cerrado — Modo Consulta de Stock y Precios
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 hidden md:inline font-medium">
              (Cobros y ventas deshabilitados hasta aperturar un turno de caja)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModoSoloConsulta(false)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Aperturar Turno Ahora</span>
          </button>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row gap-4 xl:gap-5 lg:h-[calc(100vh-8.5rem)] lg:max-h-[calc(100vh-8.5rem)] pb-4 lg:pb-0 min-w-0 flex-1 ${!verificandoCaja && !cajaAbierta && !modoSoloConsulta ? 'pointer-events-none select-none filter blur-[1px]' : ''}`}>
                {/* ======================================================== */}
        {/* LADO IZQUIERDO: CATÁLOGO CLÍNICO Y BÚSQUEDA INTELIGENTE   */}
        {/* ======================================================== */}
        <POSCatalogo
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          cargando={cargando}
          searchInputRef={searchInputRef}
          handleBarcodeSubmit={handleBarcodeSubmit}
          medicamentos={medicamentos}
          medicamentosFiltrados={medicamentosFiltrados}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          cargarDatos={cargarDatos}
          addItem={addItem}
          abrirModalDci={abrirModalDci}
          clienteDetectadoEnBarra={clienteDetectadoEnBarra}
          esDocumentoEnBarra={esDocumentoEnBarra}
          setClienteSeleccionado={setClienteSeleccionado}
          setIdCliente={setIdCliente}
          abrirRegistroRapidoConDoc={abrirRegistroRapidoConDoc}
          onConsultarStockSedes={handleConsultarStockSedes}
        />

        {/* ======================================================== */}
        {/* LADO DERECHO: TICKET DE CAJA Y DISPENSACIÓN              */}
        {/* ======================================================== */}
        <POSTicket
          cajaAbierta={cajaAbierta}
          onAbrirCajaPrompt={() => setModoSoloConsulta(false)}
          items={items}
          clienteSeleccionado={clienteSeleccionado}
          setClienteSeleccionado={setClienteSeleccionado}
          setIdCliente={setIdCliente}
          busquedaCliente={busquedaCliente}
          setBusquedaCliente={setBusquedaCliente}
          mostrarDropdownClientes={mostrarDropdownClientes}
          setMostrarDropdownClientes={setMostrarDropdownClientes}
          clienteExisteExacto={clienteExisteExacto}
          clientesFiltrados={clientesFiltrados}
          esDniValido={esDniValido}
          esRucValido={esRucValido}
          esDocumentoBuscado={esDocumentoBuscado}
          abrirRegistroRapidoConDoc={abrirRegistroRapidoConDoc}
          tipoComprobante={tipoComprobante}
          setTipoComprobante={setTipoComprobante}
          necesitaReceta={necesitaReceta}
          medicoCmp={medicoCmp}
          setMedicoCmp={setMedicoCmp}
          updateCantidad={updateCantidad}
          removeItem={removeItem}
          clearCart={clearCart}
          puntosCanjeados={puntosCanjeados}
          descuento={descuento}
          setPuntosCanjeados={setPuntosCanjeados}
          setDescuento={setDescuento}
          maximoDescuentoPorPuntos={maximoDescuentoPorPuntos}
          toggleCanjearPuntos={toggleCanjearPuntos}
          getSubtotal={getSubtotal}
          total={total}
          setMostrarModalAtajos={setMostrarModalAtajos}
          modoCobroActivo={modoCobroActivo}
          setModoCobroActivo={setModoCobroActivo}
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          numeroOperacion={numeroOperacion}
          setNumeroOperacion={setNumeroOperacion}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          vuelto={vuelto}
          creditoDias={creditoDias}
          setCreditoDias={setCreditoDias}
          montoMixtoEfectivo={montoMixtoEfectivo}
          setMontoMixtoEfectivo={setMontoMixtoEfectivo}
          efectivoRecibidoMixto={efectivoRecibidoMixto}
          setEfectivoRecibidoMixto={setEfectivoRecibidoMixto}
          montoMixtoYape={montoMixtoYape}
          setMontoMixtoYape={setMontoMixtoYape}
          montoMixtoPlin={montoMixtoPlin}
          setMontoMixtoPlin={setMontoMixtoPlin}
          montoMixtoTarjeta={montoMixtoTarjeta}
          setMontoMixtoTarjeta={setMontoMixtoTarjeta}
          operacionMixtoYape={operacionMixtoYape}
          setOperacionMixtoYape={setOperacionMixtoYape}
          operacionMixtoPlin={operacionMixtoPlin}
          setOperacionMixtoPlin={setOperacionMixtoPlin}
          operacionMixtoTarjeta={operacionMixtoTarjeta}
          setOperacionMixtoTarjeta={setOperacionMixtoTarjeta}
          totalAsignadoMixto={totalAsignadoMixto}
          saldoPendienteMixto={saldoPendienteMixto}
          numEfectivo={numEfectivo}
          numYape={numYape}
          numPlin={numPlin}
          numTarjeta={numTarjeta}
          vueltoEfectivoMixto={vueltoEfectivoMixto}
          procesandoVenta={procesandoVenta}
          onCobrar={handleCobrar}
          ticketVenta={ticketVenta}
          onVerTicket={() => setMostrarModalTicket(true)}
          onNuevaVenta={handleNuevaVenta}
        />
      </div>

      {/* ─── BLOQUEO DE PANTALLA: TURNO DE CAJA CERRADO ─── */}
      {!cajaAbierta && !verificandoCaja && !modoSoloConsulta && (
        <div className="absolute -top-3 -left-3 -right-3 -bottom-20 sm:inset-0 z-10 bg-slate-900/40 backdrop-blur-md flex items-start sm:items-center justify-center pt-2 sm:pt-4 p-3 sm:p-4 rounded-none sm:rounded-3xl animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-3xl max-w-md w-full p-5 sm:p-8 text-center relative overflow-hidden">
            {/* Resplandor decorativo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Pastilla indicadora */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[11px] sm:text-xs font-black tracking-wide uppercase mb-3 sm:mb-4 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Turno de Caja Cerrado</span>
            </div>

            {/* Icono de Candado */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 mx-auto mb-2.5 sm:mb-3">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>

            {/* Título & Mensaje */}
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 sm:mb-2">
              Punto de Venta Bloqueado
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 sm:mb-5 leading-relaxed max-w-xs mx-auto">
              Para registrar ventas y dispensar medicamentos, debe aperturar un turno de caja con su fondo inicial en efectivo.
            </p>

            {/* Formulario de Apertura Rápida */}
            <form onSubmit={handleAperturarCajaRapida} className="space-y-3.5 sm:space-y-4">
              <div className="text-left">
                <label className="block text-[10.5px] sm:text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Monto Inicial en Efectivo
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={montoAperturaRapida}
                    onChange={(e) => setMontoAperturaRapida(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-2xl text-base sm:text-lg font-black text-slate-900 dark:text-white outline-none transition-all shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {/* Botones de montos sugeridos */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {['0.00', '50.00', '100.00', '200.00'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMontoAperturaRapida(val)}
                    className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      montoAperturaRapida === val
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    S/ {parseFloat(val).toFixed(0)}
                  </button>
                ))}
              </div>

              {/* Botón de acción principal */}
              <button
                type="submit"
                disabled={abriendoCaja}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {abriendoCaja ? (
                  <span>Aperturando Turno...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Aperturar Turno y Habilitar POS</span>
                  </>
                )}
              </button>
            </form>

            {/* Opciones Secundarias */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setModoSoloConsulta(true)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Consultar precios y stock sin aperturar caja"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Modo consulta</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/caja')}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Gestión de Caja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL GUÍA DE ATAJOS DE TECLADO (F1) ─── */}
      <POSModalAtajos
        visible={mostrarModalAtajos}
        onClose={() => setMostrarModalAtajos(false)}
      />


      {/* ─── MODAL DCI (Componente extraído P14) ─── */}
      <POSModalDCI
        visible={mostrarModalDci}
        onClose={() => setMostrarModalDci(false)}
        medicamentoDciSeleccionado={medicamentoDciSeleccionado}
        genericosEquivalentes={genericosEquivalentes}
        addItem={addItem}
      />

      {/* ─── MODAL PACIENTE (Componente extraído P14) ─── */}
      <POSModalPaciente
        visible={mostrarNuevoCliente}
        onClose={() => setMostrarNuevoCliente(false)}
        tipoDoc={nuevoClienteTipoDoc}
        setTipoDoc={setNuevoClienteTipoDoc}
        numDoc={nuevoClienteNumDoc}
        setNumDoc={setNuevoClienteNumDoc}
        nombre={nuevoClienteNombre}
        setNombre={setNuevoClienteNombre}
        direccion={nuevoClienteDireccion}
        setDireccion={setNuevoClienteDireccion}
        telefono={nuevoClienteTelefono}
        setTelefono={setNuevoClienteTelefono}
        consultando={consultandoDoc}
        guardando={guardandoCliente}
        onConsultar={handleConsultarDocumento}
        onSubmit={handleGuardarNuevoCliente}
      />

      {/* MODAL DE CONSULTA DE STOCK MULTI-SEDE */}
      <ModalStockSucursales
        medicamentoId={modalStockMedId}
        isOpen={mostrarModalStockSedes}
        onClose={() => setMostrarModalStockSedes(false)}
      />

      {/* ─── MODAL VISTA PREVIA E IMPRESIÓN DEL TICKET EMITIDO ─── */}
      <TicketImpresion
        isOpen={mostrarModalTicket}
        onClose={() => setMostrarModalTicket(false)}
        venta={ticketVenta}
      />
    </div>
  );
}
