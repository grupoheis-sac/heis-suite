import { create } from 'zustand';

export const useHotelCartStore = create((set, get) => ({
  items: [],
  modoCobro: 'habitacion', // 'habitacion' | 'mostrador'
  reservaSeleccionada: null, // Objeto de la reserva / estancia activa
  clienteMostrador: {
    tipo_doc: 'DNI',
    num_doc: '',
    nombre: 'CLIENTE GENERAL',
    direccion: ''
  },
  tipoComprobante: 'boleta', // 'boleta' | 'factura' | 'recibo'
  tipoPago: 'efectivo', // 'efectivo' | 'yape' | 'plin' | 'tarjeta' | 'mixto'
  numeroOperacion: '',
  montoRecibido: '',
  descuento: 0,
  observaciones: '',

  // Agregar ítem al carrito
  addItem: (producto, cantidad = 1) => {
    const { items } = get();
    const precio = parseFloat(producto.precio_venta || producto.precio_unitario || 0);
    const existingIndex = items.findIndex((i) => i.id === producto.id);

    if (existingIndex > -1) {
      const updated = [...items];
      const nuevaCantidad = updated[existingIndex].cantidad + parseInt(cantidad);
      updated[existingIndex].cantidad = nuevaCantidad;
      updated[existingIndex].subtotal = parseFloat((nuevaCantidad * precio).toFixed(2));
      set({ items: updated });
    } else {
      const newItem = {
        id: producto.id,
        codigo: producto.codigo || 'HOT-000',
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || 'otros',
        precio_unitario: precio,
        precio_venta: precio,
        controla_stock: producto.controla_stock ?? false,
        stock_actual: producto.stock_actual ?? 999,
        cantidad: parseInt(cantidad),
        subtotal: parseFloat((parseInt(cantidad) * precio).toFixed(2))
      };
      set({ items: [...items, newItem] });
    }
  },

  updateCantidad: (id, cantidad) => {
    const cant = parseInt(cantidad);
    if (cant <= 0) {
      get().removeItem(id);
      return;
    }

    const updated = get().items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          cantidad: cant,
          subtotal: parseFloat((cant * item.precio_unitario).toFixed(2))
        };
      }
      return item;
    });
    set({ items: updated });
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  clearCart: () => {
    set({
      items: [],
      descuento: 0,
      montoRecibido: '',
      numeroOperacion: '',
      observaciones: ''
    });
  },

  setModoCobro: (modo) => set({ modoCobro: modo }),
  setReservaSeleccionada: (reserva) => set({ reservaSeleccionada: reserva }),
  setClienteMostrador: (cliente) => set({ clienteMostrador: { ...get().clienteMostrador, ...cliente } }),
  setTipoComprobante: (tipo) => set({ tipoComprobante: tipo }),
  setTipoPago: (tipo) => set({ tipoPago: tipo }),
  setNumeroOperacion: (num) => set({ numeroOperacion: num }),
  setMontoRecibido: (monto) => set({ montoRecibido: monto }),
  setDescuento: (desc) => set({ descuento: Math.max(0, parseFloat(desc) || 0) }),
  setObservaciones: (obs) => set({ observaciones: obs }),

  getSubtotal: () => {
    return parseFloat(get().items.reduce((acc, it) => acc + (it.subtotal || 0), 0).toFixed(2));
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    const desc = parseFloat(get().descuento || 0);
    return Math.max(0, parseFloat((sub - desc).toFixed(2)));
  },

  getVuelto: () => {
    const tot = get().getTotal();
    const recibido = parseFloat(get().montoRecibido || 0);
    if (recibido <= tot) return 0.00;
    return parseFloat((recibido - tot).toFixed(2));
  }
}));
