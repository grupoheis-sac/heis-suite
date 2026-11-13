import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from './api';
import { useHotelCartStore } from './store/hotelCartStore';
import { useSucursalStore } from '@heis/core';
import { POSHotelCatalogo, POSHotelTicket } from './components/pos';

export default function POS() {
  const { sedeActiva } = useSucursalStore();
  const {
    items,
    addItem,
    updateCantidad,
    removeItem,
    clearCart,
    modoCobro,
    setModoCobro,
    reservaSeleccionada,
    setReservaSeleccionada,
    clienteMostrador,
    setClienteMostrador,
    tipoComprobante,
    setTipoComprobante,
    tipoPago,
    setTipoPago,
    numeroOperacion,
    setNumeroOperacion,
    montoRecibido,
    setMontoRecibido,
    descuento,
    setDescuento,
    observaciones,
    setObservaciones,
    getSubtotal,
    getTotal,
    getVuelto
  } = useHotelCartStore();

  const [productos, setProductos] = useState([]);
  const [reservasActivas, setReservasActivas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [resultadoOperacion, setResultadoOperacion] = useState(null);

  // Cargar catálogo de productos y servicios
  const cargarCatalogo = useCallback(async () => {
    try {
      const res = await api.get('/catalogo', {
        params: { sede_id: sedeActiva?.id }
      });
      if (res.data?.success) {
        setProductos(res.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
      toast.error('No se pudo cargar el catálogo de productos.');
    }
  }, [sedeActiva]);

  // Cargar habitaciones ocupadas actualmente (checkin)
  const cargarReservasActivas = useCallback(async () => {
    try {
      const res = await api.get('/reservas', {
        params: { estado: 'checkin' }
      });
      if (res.data?.success) {
        setReservasActivas(res.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar estancias activas:', err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const inicializar = async () => {
      setCargando(true);
      await Promise.all([cargarCatalogo(), cargarReservasActivas()]);
      setCargando(false);
    };
    inicializar();
  }, [cargarCatalogo, cargarReservasActivas]);

  // Manejador de agregar ítem al carrito
  const handleAgregarItem = (producto) => {
    addItem(producto, 1);
    toast.success(`+1 ${producto.nombre}`, {
      id: `toast-add-${producto.id}`,
      duration: 1200,
      icon: '🛒'
    });
  };

  // Confirmar y procesar la operación
  const handleConfirmarOperacion = async () => {
    if (items.length === 0) {
      toast.error('El ticket de consumos está vacío.');
      return;
    }

    try {
      setProcesando(true);

      if (modoCobro === 'habitacion') {
        if (!reservaSeleccionada) {
          toast.error('Debe seleccionar la habitación ocupada a la que se cargará el consumo.');
          return;
        }

        const res = await api.post('/pos/cargar-habitacion', {
          reserva_id: reservaSeleccionada.id,
          items,
          observaciones
        });

        if (res.data?.success) {
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.6 }
          });

          toast.success(res.data.message || '¡Consumo cargado exitosamente!');
          setResultadoOperacion({
            tipo: 'habitacion',
            habitacion_numero: res.data.data.habitacion_numero,
            huesped_nombre: res.data.data.huesped_nombre,
            total: res.data.data.total_cargado,
            items: [...items]
          });

          clearCart();
          cargarCatalogo(); // Actualizar stock
        }
      } else {
        // Venta de mostrador
        const totalVenta = getTotal();

        if (tipoPago === 'efectivo' && montoRecibido !== '' && montoRecibido !== null && montoRecibido !== undefined) {
          const rec = parseFloat(montoRecibido);
          if (isNaN(rec) || rec < totalVenta - 0.01) {
            toast.error(`El monto recibido (S/ ${isNaN(rec) ? '0.00' : rec.toFixed(2)}) no alcanza para cubrir la venta de S/ ${totalVenta.toFixed(2)}. Falta S/ ${(totalVenta - (isNaN(rec) ? 0 : rec)).toFixed(2)}.`);
            return;
          }
        }

        const res = await api.post('/pos/venta-directa', {
          tipo_comprobante: tipoComprobante,
          cliente_tipo_doc: clienteMostrador.tipo_doc,
          cliente_num_doc: clienteMostrador.num_doc,
          cliente_nombre: clienteMostrador.nombre || 'CLIENTE GENERAL',
          metodo_pago: tipoPago,
          monto_recibido: montoRecibido !== '' ? parseFloat(montoRecibido) : totalVenta,
          vuelto: getVuelto(),
          descuento: parseFloat(descuento || 0),
          items,
          observaciones
        });

        if (res.data?.success) {
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.6 }
          });

          toast.success(res.data.message || '¡Venta registrada con éxito!');
          window.dispatchEvent(new CustomEvent('caja-turno-changed'));
          setResultadoOperacion({
            tipo: 'mostrador',
            factura: res.data.data.factura,
            pago: res.data.data.pago,
            cliente: res.data.data.cliente,
            total: res.data.data.factura?.total || getTotal(),
            monto_recibido: res.data.data.monto_recibido,
            vuelto: res.data.data.vuelto,
            metodo_pago: tipoPago,
            items: [...items]
          });

          clearCart();
          cargarCatalogo(); // Actualizar stock
        }
      }
    } catch (err) {
      console.error('Error al procesar operación en POS:', err);
      toast.error(err.response?.data?.message || 'Error al procesar la operación.');
    } finally {
      setProcesando(false);
    }
  };

  // Iniciar nueva operación
  const handleNuevaOperacion = () => {
    setResultadoOperacion(null);
    clearCart();
    setReservaSeleccionada(null);
    setMontoRecibido('');
    setTimeout(() => {
      document.getElementById('pos-hotel-search-input')?.focus();
    }, 50);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 xl:gap-4 lg:h-[calc(100vh-6.5rem)] lg:max-h-[calc(100vh-6.5rem)] min-w-0 flex-1 font-sora overflow-hidden select-none">
      {/* Columna Izquierda: Catálogo de Ítems */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900/90 rounded-[28px] p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-sm h-full overflow-hidden">
        <POSHotelCatalogo
          productos={productos}
          cargando={cargando}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          onAgregarItem={handleAgregarItem}
          itemsEnCarrito={items}
          onRecargar={() => {
            cargarCatalogo();
            cargarReservasActivas();
            toast.success('Catálogo actualizado', { duration: 1000 });
          }}
          onProductoActualizado={(id, datos) => {
            setProductos((prev) =>
              prev.map((p) => (p.id === id ? { ...p, ...datos } : p))
            );
          }}
        />
      </div>

      {/* Columna Derecha: Ticket de Consumo & Cobro */}
      <div className="w-full lg:w-[410px] xl:w-[440px] 2xl:w-[460px] shrink-0 flex flex-col justify-between bg-white dark:bg-slate-900/90 rounded-[28px] p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-sm h-full min-w-0 overflow-hidden relative">
        <POSHotelTicket
          items={items}
          modoCobro={modoCobro}
          setModoCobro={setModoCobro}
          reservasActivas={reservasActivas}
          reservaSeleccionada={reservaSeleccionada}
          setReservaSeleccionada={setReservaSeleccionada}
          clienteMostrador={clienteMostrador}
          setClienteMostrador={setClienteMostrador}
          tipoComprobante={tipoComprobante}
          setTipoComprobante={setTipoComprobante}
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          numeroOperacion={numeroOperacion}
          setNumeroOperacion={setNumeroOperacion}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          descuento={descuento}
          setDescuento={setDescuento}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          updateCantidad={updateCantidad}
          removeItem={removeItem}
          clearCart={clearCart}
          getSubtotal={getSubtotal}
          getTotal={getTotal}
          getVuelto={getVuelto}
          procesando={procesando}
          onConfirmarOperacion={handleConfirmarOperacion}
          resultadoOperacion={resultadoOperacion}
          onNuevaOperacion={handleNuevaOperacion}
        />
      </div>
    </div>
  );
}
