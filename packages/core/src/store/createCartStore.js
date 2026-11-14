import { create } from 'zustand';

/**
 * HEIS Suite - Factory Universal de Stores de Carrito POS
 * Unifica el manejo de estado de carritos POS en botica, ferretería, restaurante y hospedaje.
 */
export function createCartStore(config = {}) {
  const {
    defaultTipoComprobante = 'Boleta',
    defaultTipoPago = 'Efectivo',
    defaultCreditoDias = 30,
    customState = {},
    customActions = () => ({}),
  } = config;

  return create((set, get) => ({
    items: [],
    cliente: null,
    tipoComprobante: defaultTipoComprobante,
    tipoPago: defaultTipoPago,
    numeroOperacion: '',
    descuento: 0,
    montoRecibido: '',
    creditoDias: defaultCreditoDias,
    ...customState,

    setCliente: (cliente) => set({ cliente }),
    setTipoComprobante: (tipo) => set({ tipoComprobante: tipo }),
    setTipoPago: (pago) => set({ tipoPago: pago }),
    setNumeroOperacion: (num) => set({ numeroOperacion: num }),
    setDescuento: (descuento) => set({ descuento: parseFloat(descuento) || 0 }),
    setMontoRecibido: (monto) => set({ montoRecibido: monto }),
    setCreditoDias: (dias) => set({ creditoDias: dias }),

    removeItem: (key) => {
      const { items } = get();
      set({ items: items.filter((i) => (i.itemKey !== undefined ? i.itemKey !== key : i.id !== key)) });
    },

    clearCart: () =>
      set({
        items: [],
        cliente: null,
        tipoComprobante: defaultTipoComprobante,
        tipoPago: defaultTipoPago,
        numeroOperacion: '',
        descuento: 0,
        montoRecibido: '',
        creditoDias: defaultCreditoDias,
      }),

    getSubtotal: () => {
      const { items } = get();
      return items.reduce((acc, i) => acc + (parseFloat(i.subtotal) || 0), 0);
    },

    getIgv: () => {
      const subtotal = get().getSubtotal();
      return parseFloat((subtotal * 0.18).toFixed(2));
    },

    getTotal: () => {
      const subtotal = get().getSubtotal();
      const { descuento } = get();
      return Math.max(0, parseFloat((subtotal - (parseFloat(descuento) || 0)).toFixed(2)));
    },

    getVuelto: () => {
      const total = get().getTotal();
      const { montoRecibido } = get();
      const recibido = parseFloat(montoRecibido) || 0;
      return recibido >= total ? parseFloat((recibido - total).toFixed(2)) : 0;
    },

    ...customActions(set, get),
  }));
}
