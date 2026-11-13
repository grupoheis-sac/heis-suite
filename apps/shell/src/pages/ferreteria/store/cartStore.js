import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  cliente: null,
  tipoComprobante: 'Boleta',
  tipoPago: 'Efectivo',
  numeroOperacion: '',
  descuento: 0,
  montoRecibido: 0,
  creditoDias: 30,

  // Agregar producto al carrito
  addItem: (producto, cantidad = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.id === producto.id);
    const cantAgregar = parseFloat(cantidad);

    if (existingIndex > -1) {
      const actualItem = items[existingIndex];
      const nuevaCantidad = parseFloat((parseFloat(actualItem.cantidad) + cantAgregar).toFixed(3));

      // Validar stock
      if (nuevaCantidad > parseFloat(producto.stock)) {
        throw new Error(`Stock insuficiente. Máximo disponible: ${producto.stock} ${producto.unidad_medida}`);
      }

      const updated = items.map((it, idx) => {
        if (idx === existingIndex) {
          return {
            ...it,
            cantidad: nuevaCantidad,
            subtotal: parseFloat((nuevaCantidad * parseFloat(it.precio_unitario)).toFixed(2))
          };
        }
        return it;
      });

      set({ items: updated });
    } else {
      if (cantAgregar > parseFloat(producto.stock)) {
        throw new Error(`Stock insuficiente. Máximo disponible: ${producto.stock} ${producto.unidad_medida}`);
      }

      const newItem = {
        id: producto.id,
        nombre: producto.nombre,
        codigo_barras: producto.codigo_barras,
        precio_unitario: parseFloat(producto.precio_venta),
        unidad_medida: producto.unidad_medida,
        stock: parseFloat(producto.stock),
        cantidad: cantAgregar,
        subtotal: parseFloat((cantAgregar * parseFloat(producto.precio_venta)).toFixed(2))
      };
      set({ items: [...items, newItem] });
    }
  },

  // Modificar cantidad directamente
  updateCantidad: (id, cantidad) => {
    const { items } = get();
    const cant = parseFloat(cantidad);
    if (cant <= 0) {
      get().removeItem(id);
      return;
    }

    const updated = items.map((item) => {
      if (item.id === id) {
        if (cant > item.stock) {
          throw new Error(`No puedes vender más del stock actual (${item.stock} ${item.unidad_medida}).`);
        }
        return {
          ...item,
          cantidad: parseFloat(cant.toFixed(3)),
          subtotal: parseFloat((cant * item.precio_unitario).toFixed(2))
        };
      }
      return item;
    });

    set({ items: updated });
  },

  // Eliminar producto del carrito
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  // Limpiar carrito completo (incluye reseteo de cliente para evitar facturaciones accidentales)
  clearCart: () => {
    set({
      items: [],
      cliente: null,
      descuento: 0,
      montoRecibido: 0,
      numeroOperacion: ''
    });
  },

  setCliente: (cliente) => set({ cliente }),
  setTipoComprobante: (tipo) => set({ tipoComprobante: tipo }),
  setTipoPago: (tipo) => set({ tipoPago: tipo }),
  setNumeroOperacion: (num) => set({ numeroOperacion: num }),
  setDescuento: (desc) => set({ descuento: Math.max(0, parseFloat(desc) || 0) }),
  setMontoRecibido: (monto) => set({ montoRecibido: parseFloat(monto) || 0 }),
  setCreditoDias: (dias) => set({ creditoDias: dias }),

  // Totales computados con redondeo financiero
  getSubtotal: () => {
    return parseFloat(get().items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    const desc = get().descuento;
    return Math.max(0, parseFloat((sub - desc).toFixed(2)));
  },

  getVuelto: () => {
    const total = get().getTotal();
    const recibido = get().montoRecibido;
    if (recibido <= 0 || recibido < total) return 0;
    return parseFloat((recibido - total).toFixed(2));
  },

  getFaltanteEfectivo: () => {
    const total = get().getTotal();
    const recibido = get().montoRecibido;
    if (recibido <= 0 || recibido >= total) return 0;
    return parseFloat((total - recibido).toFixed(2));
  }
}));
