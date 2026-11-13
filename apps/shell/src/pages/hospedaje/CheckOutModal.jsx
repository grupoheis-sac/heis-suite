import React, { useState, useEffect } from 'react';
import { Modal } from '@heis/ui';
import DropdownPill from './components/DropdownPill';
import api from './api';
import {
  Receipt,
  Plus,
  Trash2,
  BedDouble,
  Coffee,
  Wine,
  Sparkles,
  CheckCircle2,
  Wallet,
  MessageCircle,
  Star,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Smile,
  Heart
} from 'lucide-react';
import { notificarExito, notificarError } from './utils/notificaciones';

const OPCIONES_COMPROBANTE = [
  { value: 'boleta', label: 'Boleta de Venta Electrónica (B001)', subtitle: 'DNI / Consumidor Final', badge: 'SUNAT B001' },
  { value: 'factura', label: 'Factura Electrónica (F001)', subtitle: 'Empresas con RUC 20 / 10', badge: 'SUNAT F001' },
  { value: 'recibo', label: 'Recibo Simple / Nota de Hospedaje', subtitle: 'Control interno de recepción', badge: 'Interno' }
];

const OPCIONES_METODO_PAGO_CHECKOUT = [
  { value: 'efectivo', label: 'Efectivo en Caja', subtitle: 'Cobro físico en recepción', badge: 'Caja' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito', subtitle: 'Terminal POS Visa / Mastercard', badge: 'POS' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', subtitle: 'Terminal POS con voucher', badge: 'POS' },
  { value: 'yape', label: 'Yape / Plin', subtitle: 'Billetera digital instantánea QR', badge: 'Digital' },
  { value: 'transferencia', label: 'Transferencia Bancaria', subtitle: 'Abono interbancario verificado', badge: 'Banco' }
];

const OPCIONES_CATEGORIA_CARGO = [
  { value: 'minibar', label: 'Minibar (Bebidas, Snacks)', badge: 'Minibar' },
  { value: 'restaurante', label: 'Restaurante / Room Service', badge: 'Cocina' },
  { value: 'lavanderia', label: 'Lavandería y Planchado', badge: 'Servicio' },
  { value: 'spa', label: 'Spa / Sauna / Relax', badge: 'Bienestar' },
  { value: 'tours', label: 'Tours / Transporte', badge: 'Turismo' },
  { value: 'otros', label: 'Otros Servicios', badge: 'Varios' }
];

export default function CheckOutModal({ isOpen, onClose, reservaId, habitacionNumero, onSuccess }) {
  const [reserva, setReserva] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutExitoso, setCheckoutExitoso] = useState(null);

  // New quick charge state
  const [mostrarAgregarCargo, setMostrarAgregarCargo] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('minibar');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState(1);

  // Billing & Payment options
  const [tipoComprobante, setTipoComprobante] = useState('boleta'); // 'boleta' | 'factura' | 'recibo'
  const [rucCliente, setRucCliente] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);

  // Fase 3: Pago Mixto / Split Payments
  const [esPagoMixto, setEsPagoMixto] = useState(false);
  const [pagosMixtos, setPagosMixtos] = useState([
    { id: 1, metodo_pago: 'efectivo', monto: '' },
    { id: 2, metodo_pago: 'yape', monto: '' }
  ]);

  // C4: Control de Devolución de Llaves / Tarjeta RFID
  const [llaveDevuelta, setLlaveDevuelta] = useState(true);

  // C3: Encuesta de Satisfacción Post-Estancia (NPS)
  const [calificacionEstancia, setCalificacionEstancia] = useState(5);
  const [calificacionLimpieza, setCalificacionLimpieza] = useState(5);
  const [calificacionAtencion, setCalificacionAtencion] = useState(5);
  const [calificacionConfort, setCalificacionConfort] = useState(5);
  const [comentarioSatisfaccion, setComentarioSatisfaccion] = useState('');

  useEffect(() => {
    if (isOpen && reservaId) {
      setCheckoutExitoso(null);
      cargarDetalleReserva();
    }
  }, [isOpen, reservaId]);

  const cargarDetalleReserva = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/reservas/${reservaId}`);
      const data = res.data.data || res.data;
      setReserva(data);
      setCargos(data.cargos || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cargar detalles de la estancia.';
      setError(msg);
      notificarError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarCargo = async (e) => {
    e.preventDefault();
    if (!nuevoConcepto || !nuevoPrecio) return;
    try {
      const res = await api.post('/cargos', {
        reserva_id: reservaId,
        concepto: nuevoConcepto,
        categoria: nuevaCategoria,
        precio_unitario: parseFloat(nuevoPrecio),
        cantidad: parseInt(nuevaCantidad) || 1
      });
      const nuevo = res.data.data || res.data;
      setCargos([nuevo, ...cargos]);
      setNuevoConcepto('');
      setNuevoPrecio('');
      setNuevaCantidad(1);
      setMostrarAgregarCargo(false);
      notificarExito('Consumo añadido a la cuenta');
    } catch (err) {
      notificarError(err.response?.data?.message || 'Error al agregar cargo.');
    }
  };

  const handleEliminarCargo = async (id) => {
    if (!window.confirm('¿Desea retirar este cargo de la cuenta?')) return;
    try {
      await api.delete(`/cargos/${id}`);
      setCargos(cargos.filter(c => c.id !== id));
      notificarExito('Cargo retirado');
    } catch (err) {
      notificarError(err.response?.data?.message || 'Error al eliminar cargo.');
    }
  };

  const totalHabitacion = reserva ? Number(reserva.total) : 0;
  const totalCargos = cargos.reduce((acc, c) => acc + Number(c.subtotal), 0);
  const totalGeneral = Math.max(0, (totalHabitacion + totalCargos) - (parseFloat(descuento) || 0));
  const adelanto = reserva ? Number(reserva.adelanto || 0) : 0;
  const saldoPendiente = Math.max(0, totalGeneral - adelanto);

  const totalPagosMixtos = pagosMixtos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const diferenciaPagoMixto = +(saldoPendiente - totalPagosMixtos).toFixed(2);

  const handleAgregarLineaPago = () => {
    setPagosMixtos([
      ...pagosMixtos,
      { id: Date.now(), metodo_pago: 'tarjeta_debito', monto: Math.max(0, diferenciaPagoMixto) }
    ]);
  };

  const handleEliminarLineaPago = (id) => {
    if (pagosMixtos.length <= 1) return;
    setPagosMixtos(pagosMixtos.filter(p => p.id !== id));
  };

  const handleActualizarLineaPago = (id, campo, valor) => {
    setPagosMixtos(pagosMixtos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const handleAutocompletarLinea = (id) => {
    const otros = pagosMixtos.filter(p => p.id !== id).reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const restante = Math.max(0, +(saldoPendiente - otros).toFixed(2));
    setPagosMixtos(pagosMixtos.map(p => p.id === id ? { ...p, monto: restante } : p));
  };

  const handleAplicarPenalidadLlave = async () => {
    try {
      const res = await api.post('/cargos', {
        reserva_id: reservaId,
        concepto: 'Penalidad: Pérdida de Tarjeta/Llave RFID',
        categoria: 'otros',
        precio_unitario: 20,
        cantidad: 1
      });
      const nuevo = res.data.data || res.data;
      setCargos([nuevo, ...cargos]);
      notificarExito('Penalidad agregada', 'Se añadió el cargo de S/ 20.00 por reposición de tarjeta.');
    } catch (err) {
      notificarError('Error al registrar cargo de penalidad.');
    }
  };

  const handleConfirmarCheckOut = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (esPagoMixto) {
        if (Math.abs(diferenciaPagoMixto) > 0.05) {
          notificarError(`La suma de los métodos mixtos (S/ ${totalPagosMixtos.toFixed(2)}) debe cubrir exactamente el saldo pendiente (S/ ${saldoPendiente.toFixed(2)}).`);
          setSubmitting(false);
          return;
        }
      }

      const res = await api.post(`/reservas/${reservaId}/checkout`, {
        tipo_comprobante: tipoComprobante,
        ruc_cliente: tipoComprobante === 'factura' ? rucCliente : null,
        razon_social: tipoComprobante === 'factura' ? razonSocial : null,
        metodo_pago: esPagoMixto ? 'mixto' : metodoPago,
        descuento: parseFloat(descuento) || 0,
        pagos_mixtos: esPagoMixto ? pagosMixtos.filter(p => parseFloat(p.monto) > 0) : null,
        llave_devuelta: llaveDevuelta,
        calificacion_estancia: calificacionEstancia,
        calificacion_limpieza: calificacionLimpieza,
        calificacion_atencion: calificacionAtencion,
        calificacion_confort: calificacionConfort,
        comentario_satisfaccion: comentarioSatisfaccion || null
      });

      const dataSalida = res.data?.data || res.data;
      setCheckoutExitoso(dataSalida);
      notificarExito(`Check-out de Habitación ${habitacionNumero || reserva?.habitacion?.numero} completado con éxito`);
      window.dispatchEvent(new CustomEvent('caja-turno-changed'));
      window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar el check-out.';
      setError(msg);
      notificarError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
      title={`Check-out & Liquidación — Habitación ${habitacionNumero || reserva?.habitacion?.numero || ''}`}
      subtitle="Consolidación de noches, consumos de minibar y emisión de comprobante"
      maxWidth="max-w-2xl"
    >
      {checkoutExitoso ? (
        <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-150 font-sora">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9 stroke-[2.4]" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              ¡Check-Out Liquidado Exitosamente!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Habitación {habitacionNumero || reserva?.habitacion?.numero} liberada y enviada a <strong>Limpieza</strong>.
            </p>
            {checkoutExitoso?.factura?.numero && (
              <span className="inline-block mt-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Comprobante: {checkoutExitoso.factura.numero}
              </span>
            )}
          </div>

          {/* Quick Win B: Botón de WhatsApp para Agradecimiento y Reseña */}
          {reserva?.huesped?.telefono && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enviar Agradecimiento & Solicitar Google Review</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Fideliza al huésped enviándole un mensaje cordial por WhatsApp con un enlace para calificar su experiencia con 5 estrellas.
              </p>
              <a
                href={`https://wa.me/${reserva.huesped.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Estimado/a *${reserva.huesped.nombre}*, ¡muchas gracias por hospedarte con nosotros en la Habitación *${habitacionNumero || reserva?.habitacion?.numero}*! ✨🏨\n\nEsperamos que tu estancia haya sido extraordinaria. Nos encantaría contar con tu calificación de 5 estrellas en Google si disfrutaste el servicio:\n⭐⭐⭐⭐⭐ https://g.page/r/review\n\n¡Esperamos darte la bienvenida muy pronto!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar WhatsApp a {reserva.huesped.nombre} ({reserva.huesped.telefono})</span>
              </a>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Listo, Cerrar Ventana
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">Cargando detalles de cuenta...</div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      ) : (
        <div className="space-y-5 font-sora">
          {/* Guest and room header summary */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Huésped Titular</p>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {reserva?.huesped?.nombre} {reserva?.huesped?.apellido}
              </h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                {reserva?.huesped?.tipo_documento}: {reserva?.huesped?.num_documento}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código de Estadía</p>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-slate-700">
                {reserva?.codigo}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {reserva?.num_noches} noche(s) × S/ {reserva?.precio_noche}
              </p>
            </div>
          </div>

          {/* Consumos and Charges breakdown */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-xs">
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Consumos y Servicios Adicionales ({cargos.length})
              </span>
              <button
                type="button"
                onClick={() => setMostrarAgregarCargo(!mostrarAgregarCargo)}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200/70 dark:border-emerald-800/60 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Consumo</span>
              </button>
            </div>

            {/* Quick add charge form */}
            {mostrarAgregarCargo && (
              <form onSubmit={handleAgregarCargo} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200/60 dark:border-emerald-800/40 grid grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Concepto (ej: Bebida minibar)"
                  value={nuevoConcepto}
                  onChange={(e) => setNuevoConcepto(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                />
                <select
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="minibar">Minibar</option>
                  <option value="restaurante">Restaurante / Room Service</option>
                  <option value="lavanderia">Lavandería</option>
                  <option value="spa">Spa</option>
                  <option value="tours">Tours / Transporte</option>
                  <option value="otros">Otros</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Precio (S/)"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="1"
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(e.target.value)}
                    className="w-14 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-40 overflow-y-auto">
              <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-2">
                  <BedDouble className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Alojamiento {reserva?.num_noches} noche(s)
                </span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">S/ {totalHabitacion.toFixed(2)}</span>
              </div>

              {cargos.map((cargo) => (
                <div key={cargo.id} className="px-4 py-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-2">
                    {cargo.categoria === 'minibar' ? <Wine className="w-3.5 h-3.5 text-amber-500" /> : <Coffee className="w-3.5 h-3.5 text-emerald-500" />}
                    <span>{cargo.concepto} (×{cargo.cantidad})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">S/ {Number(cargo.subtotal).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleEliminarCargo(cargo.id)}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing & Invoice settings */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <DropdownPill
                  label="Tipo de Comprobante SUNAT"
                  value={tipoComprobante}
                  onChange={(val) => setTipoComprobante(val)}
                  options={OPCIONES_COMPROBANTE}
                  icon={Receipt}
                />
              </div>

              {/* Selector de Modo de Cobro: Pago Único vs Pago Mixto */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sora">
                    Modalidad de Cobro
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nuevo = !esPagoMixto;
                      setEsPagoMixto(nuevo);
                      if (nuevo && pagosMixtos[0].monto === '') {
                        setPagosMixtos([
                          { id: 1, metodo_pago: 'efectivo', monto: Math.floor(saldoPendiente / 2) },
                          { id: 2, metodo_pago: 'yape', monto: +(saldoPendiente - Math.floor(saldoPendiente / 2)).toFixed(2) }
                        ]);
                      }
                    }}
                    className={`text-[10px] font-extrabold font-sora px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                      esPagoMixto
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-blue-600'
                    }`}
                  >
                    {esPagoMixto ? '✓ Pago Mixto Activo' : 'Dividir Cuenta (Pago Mixto)'}
                  </button>
                </div>

                {!esPagoMixto ? (
                  <DropdownPill
                    value={metodoPago}
                    onChange={(val) => setMetodoPago(val)}
                    options={OPCIONES_METODO_PAGO_CHECKOUT}
                    icon={Wallet}
                  />
                ) : (
                  <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 py-2.5 px-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80">
                    Cobro dividido en múltiples métodos de pago
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de Pago Mixto si está activado */}
            {esPagoMixto && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-300 font-sora">
                    Desglose de Métodos de Pago
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-sora">
                      Cubierto: <strong className="font-mono text-slate-800 dark:text-white">S/ {totalPagosMixtos.toFixed(2)}</strong> / S/ {saldoPendiente.toFixed(2)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${
                      Math.abs(diferenciaPagoMixto) < 0.01
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : diferenciaPagoMixto > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {Math.abs(diferenciaPagoMixto) < 0.01 ? '✓ Exacto' : diferenciaPagoMixto > 0 ? `Falta S/ ${diferenciaPagoMixto.toFixed(2)}` : `Exceso S/ ${Math.abs(diferenciaPagoMixto).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {pagosMixtos.map((pago, index) => (
                    <div key={pago.id} className="flex items-center gap-2">
                      <select
                        value={pago.metodo_pago}
                        onChange={(e) => handleActualizarLineaPago(pago.id, 'metodo_pago', e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer w-40"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Tarjeta de Débito</option>
                        <option value="tarjeta_credito">Tarjeta de Crédito</option>
                        <option value="yape">Yape / Plin</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                      </select>

                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={pago.monto}
                          onChange={(e) => handleActualizarLineaPago(pago.id, 'monto', e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutocompletarLinea(pago.id)}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-[10px] font-bold font-sora cursor-pointer"
                        title="Asignar monto restante automáticamente"
                      >
                        Restante
                      </button>

                      {pagosMixtos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEliminarLineaPago(pago.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAgregarLineaPago}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir otro método de pago</span>
                </button>
              </div>
            )}

            {tipoComprobante === 'factura' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">RUC de la Empresa</label>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    placeholder="20XXXXXXXXX"
                    value={rucCliente}
                    onChange={(e) => setRucCliente(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="EMPRESA CONTRATISTA SAC"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* C4: Control de Devolución de Llaves / Tarjeta RFID */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                    Devolución de Llave / Tarjeta RFID
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Asignada: <strong className="font-mono text-amber-700 dark:text-amber-300">{reserva?.tarjeta_llave_codigo || `T-${habitacionNumero || reserva?.habitacion?.numero || 'Hab'}`}</strong> ({reserva?.tarjetas_entregadas || 1} {reserva?.tarjetas_entregadas === 1 ? 'tarjeta' : 'tarjetas'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLlaveDevuelta(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    llaveDevuelta
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Devuelta Conforme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLlaveDevuelta(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    !llaveDevuelta
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>No Devuelta / Extraviada</span>
                </button>
              </div>
            </div>

            {!llaveDevuelta && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-medium text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Tarjeta no devuelta. Puedes cargar la penalidad de reposición a la cuenta.</span>
                </div>
                <button
                  type="button"
                  onClick={handleAplicarPenalidadLlave}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase font-sora shadow-xs transition cursor-pointer"
                >
                  + Cargar Penalidad S/ 20.00
                </button>
              </div>
            )}
          </div>

          {/* C3: Encuesta de Satisfacción Post-Estancia (NPS) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                    Calificación de Experiencia & NPS
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Encuesta post-estancia del huésped para reportes de calidad
                  </p>
                </div>
              </div>

              {/* Estrellas Interactivas General */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacionEstancia(star)}
                    className="p-1 rounded-lg transition hover:scale-110 cursor-pointer"
                    title={`${star} estrellas`}
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        star <= calificacionEstancia
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1 text-xs font-black font-sora text-slate-700 dark:text-slate-300">
                  {calificacionEstancia}/5
                </span>
              </div>
            </div>

            {/* Sub-pilares de Calidad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Limpieza */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Limpieza</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalificacionLimpieza(num)}
                      className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition ${
                        calificacionLimpieza === num
                          ? 'bg-amber-400 text-slate-900 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atención */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Atención</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalificacionAtencion(num)}
                      className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition ${
                        calificacionAtencion === num
                          ? 'bg-amber-400 text-slate-900 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confort */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Confort</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalificacionConfort(num)}
                      className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition ${
                        calificacionConfort === num
                          ? 'bg-amber-400 text-slate-900 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Comentarios o sugerencias del huésped (opcional)..."
                value={comentarioSatisfaccion}
                onChange={(e) => setComentarioSatisfaccion(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Account balance sheet */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 shadow-xs space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Subtotal Alojamiento + Consumos:</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold tabular-nums">S/ {(totalHabitacion + totalCargos).toFixed(2)}</span>
            </div>
            {adelanto > 0 && (
              <div className="flex justify-between text-xs text-blue-700 dark:text-blue-400 font-medium">
                <span>Adelanto / Depósito previo recibido:</span>
                <span className="font-mono font-bold tabular-nums">- S/ {adelanto.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2.5 border-t border-blue-200/60 dark:border-blue-800/40 flex justify-between items-baseline">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Monto Total a Cobrar al Salir:
              </span>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-sora tabular-nums">
                S/ {saldoPendiente.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Al completar el check-out, la habitación pasará automáticamente a estado <strong>"En Limpieza"</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmarCheckOut}
              className="glow-btn-hotel px-6 py-2.5 text-white rounded-xl text-xs font-extrabold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Procesando Salida...' : 'Confirmar Check-out & Facturar'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
