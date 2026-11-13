import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  cliente: null,
  tipoComprobante: 'Boleta',
  tipoPago: 'Efectivo',
  numeroOperacion: '',
  medicoCmp: '',
  descuento: 0,
  puntosCanjeados: 0,
  montoRecibido: '',
  creditoDias: 30,

  // Agregar medicamento al carrito (soporta Caja o Fracción)
  addItem: (medicamento, formato = 'Caja', cantidad = 1, lote = null) => {
    const { items } = get();
    const esFraccion = formato === 'Fraccion';
    const precio = esFraccion
      ? parseFloat(medicamento.precio_fraccion || medicamento.precio_venta)
      : parseFloat(medicamento.precio_venta);

    // Identificador único según formato
    const itemKey = `${medicamento.id}-${formato}-${lote?.id || 'fefo'}`;
    const existingIndex = items.findIndex((i) => i.itemKey === itemKey);

    if (existingIndex > -1) {
      const updated = [...items];
      const nuevaCantidad = updated[existingIndex].cantidad + parseFloat(cantidad);

      updated[existingIndex].cantidad = nuevaCantidad;
      updated[existingIndex].subtotal = parseFloat((nuevaCantidad * precio).toFixed(2));
      set({ items: updated });
    } else {
      const newItem = {
        itemKey,
        id_medicamento: medicamento.id,
        nombre: medicamento.nombre_comercial,
        generico: medicamento.nombre_generico,
        concentracion: medicamento.concentracion,
        presentacion: medicamento.presentacion,
        formato_venta: formato,
        id_lote: lote?.id || null,
        numero_lote: lote?.numero_lote || 'FEFO Auto',
        fecha_vencimiento: lote?.fecha_vencimiento || null,
        requiere_receta: !!medicamento.requiere_receta,
        precio_unitario: precio,
        cantidad: parseFloat(cantidad),
        subtotal: parseFloat((parseFloat(cantidad) * precio).toFixed(2))
      };
      set({ items: [...items, newItem] });
    }
  },

  updateCantidad: (itemKey, cantidad) => {
    const cant = parseFloat(cantidad);
    if (cant <= 0) {
      get().removeItem(itemKey);
      return;
    }

    const updated = get().items.map((item) => {
      if (item.itemKey === itemKey) {
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

  removeItem: (itemKey) => {
    set({ items: get().items.filter((i) => i.itemKey !== itemKey) });
  },

  clearCart: () => {
    set({
      items: [],
      descuento: 0,
      puntosCanjeados: 0,
      montoRecibido: '',
      numeroOperacion: '',
      medicoCmp: ''
    });
  },

  setCliente: (cliente) => set({ cliente }),
  setTipoComprobante: (tipo) => set({ tipoComprobante: tipo }),
  setTipoPago: (tipo) => set({ tipoPago: tipo }),
  setNumeroOperacion: (num) => set({ numeroOperacion: num }),
  setMedicoCmp: (cmp) => set({ medicoCmp: cmp }),
  setDescuento: (desc) => set({ descuento: Math.max(0, parseFloat(desc) || 0) }),
  setPuntosCanjeados: (puntos) => set({ puntosCanjeados: parseInt(puntos) || 0 }),
  setMontoRecibido: (monto) => set({ montoRecibido: monto }),
  setCreditoDias: (dias) => set({ creditoDias: dias }),

  requiereRecetaEnCarrito: () => {
    return get().items.some((i) => i.requiere_receta);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    const desc = get().descuento;
    return Math.max(0, parseFloat((sub - desc).toFixed(2)));
  },

  getVuelto: () => {
    const total = get().getTotal();
    const recibido = get().montoRecibido;
    if (recibido === '' || recibido === null || recibido === undefined) return 0;
    const num = parseFloat(recibido);
    if (isNaN(num) || num <= total) return 0;
    return Math.max(0, parseFloat((num - total).toFixed(2)));
  }
}));
